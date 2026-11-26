<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\ApprovalEmailDelivery;
use App\Support\InAppNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdministratorNotificationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_super_admin_document_decision_queues_one_email_and_opens_that_document(): void
    {
        $administrator = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);
        $helper = User::factory()->create(['role' => 'helper', 'status' => 'active']);
        DB::table('profiles')->insert(['user_id' => $helper->id, 'verification_status' => 'pending']);
        $document = DB::table('helper_documents')->insertGetId([
            'user_id' => $helper->id, 'document_type' => 'identity',
            'file_path' => 'example-private-document.pdf', 'verification_status' => 'pending', 'is_active' => true,
        ]);

        Sanctum::actingAs($administrator);
        $route = "/api/admin/helpers/{$helper->id}/documents/{$document}";
        $decision = ['verification_status' => 'rejected', 'verification_notes' => 'private details'];
        $this->putJson($route, $decision)->assertOk();
        $this->putJson($route, $decision)->assertOk();

        $destination = "/helper/dashboard/?section=helper-documents#helper-document-{$document}";
        $this->assertDatabaseCount('approval_email_outbox', 1);
        $email = DB::table('approval_email_outbox')->first();
        $this->assertSame($helper->email, $email->recipient);
        $this->assertSame('UrbanHelpHub: Helper document review updated', $email->subject);
        $this->assertStringContainsString('https://urbanhelphub.com/login/?next='.rawurlencode($destination), $email->body);
        $this->assertStringNotContainsString('private details', $email->body);

        $html = null;
        Event::listen(MessageSending::class, function (MessageSending $event) use (&$html): void {
            $html = $event->message->getHtmlBody();
        });
        $this->assertSame('sent', app(ApprovalEmailDelivery::class)->deliverNext());
        $this->assertStringContainsString('alt="UrbanHelpHub"', $html);
        $this->assertStringContainsString('href="https://urbanhelphub.com/login/?next='.rawurlencode($destination).'"', $html);

        Sanctum::actingAs($helper);
        $this->getJson('/api/notifications')->assertOk()
            ->assertJsonPath('data.notifications.0.action_url', $destination);
    }

    public function test_legacy_notifications_get_role_specific_links_and_unsafe_saved_links_are_ignored(): void
    {
        $owner = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        InAppNotification::send($customer->id, 'completion_requested', 'Confirm job completion', 'Open the task.', '/dashboard', ['task_id' => 19]);
        InAppNotification::send($customer->id, 'generic', 'Account update', 'Open your dashboard.', 'https://example.test');
        InAppNotification::sendToAdmins('payout_approval_required', 'Review payout', 'Open payout #56.', '/admin', ['payout_id' => 56]);

        Sanctum::actingAs($customer);
        $this->getJson('/api/notifications')->assertOk()
            ->assertJsonFragment(['action_url' => '/dashboard/?section=customer-tasks#customer-task-19'])
            ->assertJsonFragment(['action_url' => '/dashboard/'])
            ->assertJsonMissing(['title' => 'Review payout']);

        foreach ([$admin, $owner] as $recipient) {
            Sanctum::actingAs($recipient);
            $this->getJson('/api/notifications')->assertOk()
                ->assertJsonPath('data.notifications.0.action_url', '/admin/?section=payments#payout-56');
        }
    }
}
