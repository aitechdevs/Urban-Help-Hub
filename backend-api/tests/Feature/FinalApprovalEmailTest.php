<?php

namespace Tests\Feature;

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CustomerProfileApprovalController;
use App\Http\Middleware\QueueFinalApprovalEmail;
use App\Models\User;
use App\Services\ApprovalEmailDelivery;
use App\Services\FinalApprovalEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class FinalApprovalEmailTest extends TestCase
{
    use RefreshDatabase;

    private function approvalRequest(string $uri, string $action, User $admin): Request
    {
        $request = Request::create($uri, 'PUT');
        $pattern = str_contains($action, 'updateVerification') ? '/admin/helpers/{userId}/verification' : '/admin/review/customer-profiles/{changeId}';
        $route = new Route(['PUT'], $pattern, ['uses' => $action, 'controller' => $action]);
        $route->bind($request);
        $request->setRouteResolver(fn () => $route);
        $request->setUserResolver(fn () => $admin);
        return $request;
    }

    public function test_verified_transition_queues_one_email_but_repeat_click_does_not(): void
    {
        $helper = User::factory()->create(['role' => 'helper', 'status' => 'active']);
        DB::table('profiles')->insert(['user_id' => $helper->id, 'verification_status' => 'pending', 'city' => 'Toronto', 'province' => 'Ontario', 'country' => 'Canada']);
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $request = $this->approvalRequest('/admin/helpers/'.$helper->id.'/verification', AdminController::class.'@updateVerification', $admin);
        $next = function () use ($helper) {
            DB::table('profiles')->where('user_id', $helper->id)->update(['verification_status' => 'verified']);
            return response()->json(['success' => true]);
        };
        $middleware = new QueueFinalApprovalEmail;
        $middleware->handle($request, $next);
        $middleware->handle($request, $next);
        $this->assertDatabaseCount('approval_email_outbox', 1);
        $this->assertDatabaseHas('approval_email_outbox', ['recipient' => $helper->email, 'event_type' => 'helper_verified', 'status' => 'pending']);
        $this->assertStringContainsString('Verification status: Verified', DB::table('approval_email_outbox')->value('body'));
    }

    public function test_failed_verification_queues_no_email(): void
    {
        $helper = User::factory()->create(['role' => 'helper']);
        DB::table('profiles')->insert(['user_id' => $helper->id, 'verification_status' => 'pending']);
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $request = $this->approvalRequest('/admin/helpers/'.$helper->id.'/verification', AdminController::class.'@updateVerification', $admin);
        (new QueueFinalApprovalEmail)->handle($request, fn () => response()->json(['success' => false], 422));
        $this->assertDatabaseCount('approval_email_outbox', 0);
    }

    public function test_customer_email_contains_only_approved_changes_and_uses_approved_email(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'email' => 'approved@example.test']);
        $change = DB::table('customer_profile_changes')->insertGetId(['user_id' => $customer->id,
            'baseline' => json_encode(['province' => 'Ontario', 'postal_code' => 'OLD', 'email' => 'old@example.test']),
            'proposed' => json_encode(['province' => 'Alberta', 'postal_code' => 'T2P 1J9', 'email' => $customer->email]),
            'revision' => 1, 'status' => 'approved']);
        FinalApprovalEmail::customer($change);
        FinalApprovalEmail::customer($change);
        $this->assertDatabaseCount('approval_email_outbox', 1);
        $row = DB::table('approval_email_outbox')->first();
        $this->assertSame($customer->email, $row->recipient);
        $this->assertStringContainsString('Province / state: Alberta', $row->body);
        $this->assertStringContainsString('Postal code: T2P 1J9', $row->body);
    }

    public function test_sent_email_is_not_sent_again(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        DB::table('approval_email_outbox')->insert(['event_key' => 'test:1', 'user_id' => $customer->id,
            'event_type' => 'customer_profile_approved', 'recipient' => $customer->email, 'subject' => 'Approved',
            'body' => 'Approved details', 'status' => 'pending', 'attempts' => 0]);
        Mail::shouldReceive('raw')->once()->andReturn(new \stdClass);
        $delivery = new ApprovalEmailDelivery;
        $this->assertSame('sent', $delivery->deliverNext());
        $this->assertNull($delivery->deliverNext());
        $this->assertDatabaseHas('approval_email_outbox', ['event_key' => 'test:1', 'status' => 'sent', 'attempts' => 1]);
    }

    public function test_changed_recipient_is_skipped_instead_of_sending_to_old_address(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'email' => 'current@example.test']);
        DB::table('approval_email_outbox')->insert(['event_key' => 'test:2', 'user_id' => $customer->id,
            'event_type' => 'customer_profile_approved', 'recipient' => 'old@example.test', 'subject' => 'Approved',
            'body' => 'Approved', 'status' => 'pending', 'attempts' => 0]);
        Mail::shouldReceive('raw')->never();
        $this->assertSame('skipped', (new ApprovalEmailDelivery)->deliverNext());
    }

    public function test_send_failures_stop_after_three_attempts(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        DB::table('approval_email_outbox')->insert(['event_key' => 'test:3', 'user_id' => $customer->id,
            'event_type' => 'customer_profile_approved', 'recipient' => $customer->email, 'subject' => 'Approved',
            'body' => 'Approved', 'status' => 'pending', 'attempts' => 0]);
        Mail::shouldReceive('raw')->times(3)->andThrow(new \RuntimeException('SMTP unavailable'));
        $delivery = new ApprovalEmailDelivery;
        for ($i = 0; $i < 3; $i++) {
            DB::table('approval_email_outbox')->where('event_key', 'test:3')->update(['next_attempt_at' => null]);
            $this->assertSame('failed', $delivery->deliverNext());
        }
        $this->assertNull($delivery->deliverNext());
        $this->assertDatabaseHas('approval_email_outbox', ['event_key' => 'test:3', 'status' => 'failed', 'attempts' => 3]);
    }
}
