<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PayPalPayoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PayPalPayoutTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $helper;

    private User $customer;

    private int $paymentId;

    private int $payoutId;

    private int $taskId;

    private string $version;

    private ?string $sender = null;

    private string $itemState = 'PENDING';

    private bool $emptyBatch = false;

    private string $helperAmount = '70.00';

    private bool $lostResponse = false;

    private bool $mismatch = false;

    private string $captureState = 'COMPLETED';

    private array $submitted = [];

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        config(['services.paypal' => ['mode' => 'sandbox', 'client_id' => 'synthetic-public', 'client_secret' => 'synthetic-secret', 'merchant_id' => 'MERCHANT123', 'webhook_id' => 'WEBHOOK123', 'currency' => 'CAD', 'payouts_enabled' => true, 'live_payouts_enabled' => false]]);
        $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $this->helper = User::factory()->create(['role' => 'helper', 'status' => 'active']);
        $this->customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        $category = DB::table('service_categories')->insertGetId(['name' => 'Test payout', 'slug' => 'test-payout', 'is_active' => true]);
        $this->taskId = DB::table('tasks')->insertGetId(['customer_id' => $this->customer->id, 'service_category_id' => $category, 'title' => 'Completed test job', 'description' => 'Synthetic job', 'status' => 'completed', 'currency' => 'CAD']);
        $this->paymentId = DB::table('payments')->insertGetId([
            'task_id' => $this->taskId, 'customer_id' => $this->customer->id, 'helper_id' => $this->helper->id,
            'provider' => 'paypal', 'paypal_mode' => 'sandbox', 'paypal_order_id' => 'ORDER12345', 'paypal_capture_id' => 'CAPTURE12345',
            'subtotal_amount' => 100, 'platform_fee' => 30, 'total_amount' => 100, 'commission_percent' => 30, 'currency' => 'CAD', 'status' => 'paid', 'paid_at' => now(),
        ]);
        $this->payoutId = DB::table('payouts')->insertGetId(['payment_id' => $this->paymentId, 'task_id' => $this->taskId, 'helper_id' => $this->helper->id, 'provider' => 'manual', 'currency' => 'CAD', 'gross_amount' => 100, 'platform_deduction' => 30, 'other_deductions' => 0, 'net_amount' => 70, 'status' => 'pending']);
        $encrypted = Crypt::encryptString('helper@example.test');
        DB::table('paypal_payout_accounts')->insert(['helper_id' => $this->helper->id, 'recipient' => $encrypted, 'created_at' => now(), 'updated_at' => now()]);
        $this->version = app(PayPalPayoutService::class)->accountVersion($this->helper->id, $encrypted);
        Sanctum::actingAs($this->admin);
        Http::fake(function ($request) {
            $url = $request->url();
            if (str_ends_with($url, '/oauth2/token')) {
                return Http::response(['access_token' => 'synthetic-private-token', 'expires_in' => 3600]);
            }
            if (str_contains($url, '/v2/checkout/orders/')) {
                return Http::response($this->order());
            }
            if (str_ends_with($url, '/verify-webhook-signature')) {
                return Http::response(['verification_status' => 'SUCCESS']);
            }
            if ($request->method() === 'POST' && str_ends_with($url, '/v1/payments/payouts')) {
                $sender = $request['sender_batch_header']['sender_batch_id'];
                $this->submitted[] = $request->data();
                $already = $this->sender !== null;
                $this->sender = $sender;
                if ($this->lostResponse && ! $already) {
                    return Http::response([], 504);
                }
                if ($already) {
                    return Http::response(['name' => 'DUPLICATE_BATCH_ID', 'links' => [['href' => 'https://api-m.sandbox.paypal.com/v1/payments/payouts/BATCH12345']]], 400);
                }

                return Http::response(['batch_header' => ['payout_batch_id' => 'BATCH12345', 'batch_status' => 'PENDING']], 201);
            }
            if (str_contains($url, '/v1/payments/payouts/BATCH12345')) {
                return Http::response(['batch_header' => ['payout_batch_id' => 'BATCH12345', 'sender_batch_header' => ['sender_batch_id' => $this->sender]], 'items' => $this->emptyBatch ? [] : [[
                    'payout_item_id' => 'ITEM12345', 'transaction_status' => $this->itemState,
                    'payout_item' => ['sender_item_id' => 'payout-'.$this->payoutId, 'recipient_type' => 'EMAIL', 'receiver' => $this->mismatch ? 'attacker@example.test' : 'helper@example.test', 'amount' => ['value' => $this->helperAmount, 'currency' => 'CAD']],
                ]]]);
            }
            throw new \RuntimeException('Unexpected synthetic request');
        });
    }

    private function order(): array
    {
        return ['id' => 'ORDER12345', 'intent' => 'CAPTURE', 'status' => 'COMPLETED', 'purchase_units' => [[
            'reference_id' => (string) $this->paymentId, 'custom_id' => (string) $this->paymentId, 'payee' => ['merchant_id' => 'MERCHANT123'],
            'amount' => ['currency_code' => 'CAD', 'value' => '100.00'],
            'payments' => ['captures' => [['id' => 'CAPTURE12345', 'status' => $this->captureState, 'amount' => ['currency_code' => 'CAD', 'value' => '100.00']]]],
        ]]];
    }

    private function approve(): TestResponse
    {
        return $this->postJson('/api/admin/payouts/'.$this->payoutId.'/approve-paypal', ['account_version' => $this->version, 'amount' => 9999, 'receiver' => 'attacker@example.test']);
    }

    private function reconcile(): TestResponse
    {
        return $this->postJson('/api/admin/payouts/'.$this->payoutId.'/reconcile-paypal');
    }

    public function test_only_active_admin_can_approve_or_reconcile_and_no_automatic_submission_before_approval(): void
    {
        $this->assertSame([], $this->submitted);
        foreach ([$this->helper, $this->customer, User::factory()->create(['role' => 'admin', 'status' => 'suspended'])] as $user) {
            Sanctum::actingAs($user);
            $this->approve()->assertForbidden();
            $this->reconcile()->assertForbidden();
        }
        $this->app['auth']->forgetGuards();
        $this->approve()->assertUnauthorized();
        Http::assertNothingSent();
        $this->assertDatabaseHas('payouts', ['status' => 'pending', 'approved_at' => null]);
    }

    public function test_admin_approval_sends_exactly_seventy_percent_and_waits_for_item_success(): void
    {
        $this->approve()->assertOk()->assertJsonPath('data.status', 'processing');
        $this->assertCount(1, $this->submitted);
        $this->assertSame(['value' => '70.00', 'currency' => 'CAD'], $this->submitted[0]['items'][0]['amount']);
        $this->assertSame('helper@example.test', $this->submitted[0]['items'][0]['receiver']);
        $this->assertDatabaseHas('payments', ['platform_fee' => 30, 'commission_percent' => 30]);
        $this->assertDatabaseHas('payouts', ['approved_by' => $this->admin->id, 'status' => 'processing', 'paid_at' => null]);
        $this->itemState = 'SUCCESS';
        $this->reconcile()->assertOk()->assertJsonPath('data.status', 'paid');
        $this->reconcile()->assertOk();
        $this->assertCount(1, $this->submitted);
        $this->assertDatabaseHas('payouts', ['paypal_item_id' => 'ITEM12345', 'paypal_batch_id' => 'BATCH12345', 'status' => 'paid']);
        $this->assertSame(1, DB::table('notifications')->where('user_id', $this->helper->id)->where('type', 'payout_paid')->count());
    }

    public function test_duplicate_admin_requests_never_create_another_sender_batch(): void
    {
        $this->approve()->assertOk();
        $this->approve()->assertOk();
        $this->assertCount(1, $this->submitted);
        $this->assertNotNull(DB::table('payouts')->value('approved_at'));
    }

    public function test_lost_submission_response_reuses_same_batch_and_handles_provider_duplicate(): void
    {
        $this->lostResponse = true;
        $this->approve()->assertStatus(503);
        $sender = DB::table('payouts')->value('paypal_sender_batch_id');
        $this->assertNotNull($sender);
        $this->assertDatabaseHas('payouts', ['status' => 'processing', 'paypal_batch_id' => null]);
        $this->reconcile()->assertOk();
        $this->assertCount(2, $this->submitted);
        $this->assertSame($sender, $this->submitted[0]['sender_batch_header']['sender_batch_id']);
        $this->assertSame($sender, $this->submitted[1]['sender_batch_header']['sender_batch_id']);
    }

    public function test_unpaid_unconfirmed_refunded_disputed_and_tampered_amounts_cannot_be_approved(): void
    {
        foreach ([['status' => 'pending'], ['status' => 'refunded'], ['status' => 'reversed'], ['refunded_amount' => 1], ['paypal_dispute_status' => 'OPEN'], ['platform_fee' => 20]] as $update) {
            DB::table('payments')->where('id', $this->paymentId)->update($update);
            $this->approve()->assertConflict();
            DB::table('payments')->where('id', $this->paymentId)->update(['status' => 'paid', 'refunded_amount' => 0, 'paypal_dispute_status' => null, 'platform_fee' => 30]);
        }
        DB::table('tasks')->where('id', $this->taskId)->update(['status' => 'awaiting_completion']);
        $this->approve()->assertConflict();
        DB::table('tasks')->where('id', $this->taskId)->update(['status' => 'completed']);
        DB::table('payouts')->where('id', $this->payoutId)->update(['net_amount' => 99]);
        $this->approve()->assertConflict();
        $this->assertSame([], $this->submitted);
    }

    public function test_provider_refund_before_delayed_webhook_blocks_approval(): void
    {
        $this->captureState = 'REFUNDED';
        $this->approve()->assertConflict();
        $this->assertSame([], $this->submitted);
        $this->assertDatabaseHas('payouts', ['approved_at' => null]);
    }

    public function test_stale_recipient_version_blocks_approval_and_approved_recipient_cannot_be_redirected(): void
    {
        $original = DB::table('paypal_payout_accounts')->value('recipient');
        DB::table('paypal_payout_accounts')->update(['recipient' => Crypt::encryptString('new@example.test')]);
        $this->approve()->assertConflict();
        DB::table('paypal_payout_accounts')->update(['recipient' => $original]);
        $this->approve()->assertOk();
        DB::table('paypal_payout_accounts')->update(['recipient' => Crypt::encryptString('new@example.test')]);
        $this->itemState = 'SUCCESS';
        $this->reconcile()->assertOk();
        $this->assertSame('helper@example.test', Crypt::decryptString(DB::table('payouts')->value('paypal_recipient')));
        $this->assertCount(1, $this->submitted);
    }

    public function test_helper_account_requires_own_password_and_is_encrypted_not_in_user_serialization(): void
    {
        Sanctum::actingAs($this->helper);
        $this->putJson('/api/helper/paypal/payout-account', ['email' => 'new@example.test', 'password' => 'incorrect'])->assertUnprocessable();
        $this->putJson('/api/helper/paypal/payout-account', ['email' => 'new@example.test', 'password' => 'password'])->assertOk();
        $this->getJson('/api/helper/paypal/payout-account')->assertOk()->assertJsonPath('data.email', 'new@example.test');
        $stored = DB::table('paypal_payout_accounts')->value('recipient');
        $this->assertStringNotContainsString('new@example.test', $stored);
        $this->assertStringNotContainsString('recipient', $this->helper->toJson());
        Sanctum::actingAs($this->customer);
        $this->getJson('/api/helper/paypal/payout-account')->assertForbidden();
    }

    public function test_old_manual_status_endpoint_cannot_bypass_paypal_approval(): void
    {
        $this->putJson('/api/admin/payouts/'.$this->payoutId.'/status', ['status' => 'paid'])->assertConflict();
        $this->assertDatabaseHas('payouts', ['status' => 'pending']);
    }

    public function test_unclaimed_failed_and_returned_items_are_not_paid_or_resent(): void
    {
        $this->itemState = 'UNCLAIMED';
        $this->approve()->assertOk()->assertJsonPath('data.status', 'unclaimed');
        $this->assertDatabaseHas('payouts', ['paid_at' => null]);
        $this->itemState = 'FAILED';
        $this->reconcile()->assertOk()->assertJsonPath('data.status', 'failed');
        $this->approve()->assertOk()->assertJsonPath('data.status', 'failed');
        $this->itemState = 'RETURNED';
        $this->reconcile()->assertOk()->assertJsonPath('data.status', 'returned');
        $this->assertCount(1, $this->submitted);
    }

    public function test_recipient_or_amount_mismatch_cannot_mark_transfer_paid(): void
    {
        $this->mismatch = true;
        $this->itemState = 'SUCCESS';
        $this->approve()->assertStatus(503);
        $this->assertDatabaseHas('payouts', ['status' => 'processing', 'paid_at' => null]);
    }

    public function test_feature_switch_live_guard_and_old_ambiguous_submission_fail_closed(): void
    {
        config(['services.paypal.payouts_enabled' => false]);
        $this->approve()->assertConflict();
        config(['services.paypal.payouts_enabled' => true, 'services.paypal.mode' => 'live']);
        $this->approve()->assertConflict();
        config(['services.paypal.mode' => 'sandbox']);
        $this->lostResponse = true;
        $this->approve()->assertStatus(503);
        DB::table('payouts')->update(['approved_at' => now()->subDays(31)]);
        $this->reconcile()->assertConflict();
        $this->assertCount(1, $this->submitted);
    }

    public function test_verified_payout_webhooks_reconcile_and_repeat_ids_do_not_duplicate_notifications(): void
    {
        $this->approve()->assertOk();
        $this->itemState = 'SUCCESS';
        $event = ['id' => 'PAYOUTEVENT123', 'event_type' => 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED', 'resource' => ['payout_batch_id' => 'BATCH12345']];
        $this->postJson('/api/paypal/webhook', $event)->assertStatus(400);
        $headers = ['paypal-auth-algo' => 'SHA256withRSA', 'paypal-cert-url' => 'https://api.paypal.com/cert/test', 'paypal-transmission-id' => 'transmission', 'paypal-transmission-sig' => 'signature', 'paypal-transmission-time' => now()->toIso8601String()];
        $this->postJson('/api/paypal/webhook', $event, $headers)->assertOk();
        $this->postJson('/api/paypal/webhook', $event, $headers)->assertOk();
        $this->assertDatabaseHas('payouts', ['status' => 'paid']);
        $this->assertSame(1, DB::table('notifications')->where('user_id', $this->helper->id)->where('type', 'payout_paid')->count());
        $this->assertDatabaseCount('paypal_webhook_events', 1);
    }

    public function test_verified_collection_notifies_admin_of_ready_payout_once_without_sending_money(): void
    {
        DB::transaction(function () {
            app(PayPalPayoutService::class)->notifyEligible($this->paymentId);
            app(PayPalPayoutService::class)->notifyEligible($this->paymentId);
        });
        $this->assertSame(1, DB::table('notifications')->where('user_id', $this->admin->id)->where('type', 'payout_approval_required')->count());
        $this->assertSame([], $this->submitted);
        $this->assertDatabaseHas('payouts', ['status' => 'pending', 'approved_at' => null]);
        Http::assertNothingSent();
    }

    public function test_admin_dashboard_exposes_recipient_and_version_without_encrypted_storage(): void
    {
        $response = $this->getJson('/api/admin/payments')->assertOk()->assertJsonPath('data.0.payout_recipient', 'helper@example.test')->assertJsonPath('data.0.payout_account_version', $this->version);
        $this->assertStringNotContainsString('encrypted', $response->getContent());
    }

    public function test_poll_command_only_processes_previously_approved_transfers(): void
    {
        $this->artisan('paypal:payouts-reconcile')->assertSuccessful();
        $this->assertSame([], $this->submitted);
        $this->approve()->assertOk();
        $this->itemState = 'SUCCESS';
        $this->artisan('paypal:payouts-reconcile')->assertSuccessful();
        $this->assertDatabaseHas('payouts', ['status' => 'paid']);
        $this->assertCount(1, $this->submitted);
    }

    public function test_customer_completion_records_forty_sixty_and_capture_notifies_admin_without_payout(): void
    {
        DB::table('payouts')->delete();
        DB::table('payments')->delete();
        DB::table('tasks')->where('id', $this->taskId)->update(['status' => 'awaiting_completion']);
        DB::table('task_assignments')->insert(['task_id' => $this->taskId, 'helper_id' => $this->helper->id, 'status' => 'awaiting_completion', 'agreed_hourly_rate' => 50,
            'started_at' => now()->subHours(2)->toDateTimeString(), 'completed_at' => now()->toDateTimeString()]);
        config(['services.stripe.platform_fee_percent' => 55]);
        Sanctum::actingAs($this->customer);
        $this->putJson('/api/customer/tasks/'.$this->taskId.'/confirm-completion')->assertOk();
        $this->paymentId = DB::table('payments')->value('id');
        $this->payoutId = DB::table('payouts')->value('id');
        $this->assertDatabaseHas('payments', ['subtotal_amount' => 100, 'platform_fee' => 40, 'commission_percent' => 40, 'status' => 'pending']);
        $this->assertDatabaseHas('payouts', ['net_amount' => 60, 'status' => 'pending', 'approved_at' => null]);
        $this->assertSame(0, DB::table('notifications')->where('type', 'payout_approval_required')->count());
        DB::table('payments')->where('id', $this->paymentId)->update(['provider' => 'paypal', 'paypal_order_id' => 'ORDER12345', 'paypal_mode' => 'sandbox']);
        $event = ['id' => 'COLLECTEVENT123', 'event_type' => 'PAYMENT.CAPTURE.COMPLETED', 'resource' => ['id' => 'CAPTURE12345', 'supplementary_data' => ['related_ids' => ['order_id' => 'ORDER12345']]]];
        $headers = ['paypal-auth-algo' => 'SHA256withRSA', 'paypal-cert-url' => 'https://api.paypal.com/cert/test', 'paypal-transmission-id' => 'transmission', 'paypal-transmission-sig' => 'signature', 'paypal-transmission-time' => now()->toIso8601String()];
        $this->postJson('/api/paypal/webhook', $event, $headers)->assertOk();
        $this->postJson('/api/paypal/webhook', $event, $headers)->assertOk();
        $this->assertSame(1, DB::table('notifications')->where('user_id', $this->admin->id)->where('type', 'payout_approval_required')->count());
        $this->assertDatabaseHas('payments', ['id' => $this->paymentId, 'status' => 'paid']);
        $this->assertDatabaseHas('payouts', ['net_amount' => 60, 'status' => 'pending', 'approved_at' => null]);
        $this->assertSame([], $this->submitted);
        $this->assertDatabaseCount('payments', 1);
    }

    public function test_batch_without_individual_item_confirmation_does_not_mark_payout_paid(): void
    {
        $this->emptyBatch = true;
        $this->approve()->assertOk()->assertJsonPath('data.status', 'processing');
        $this->assertDatabaseHas('payouts', ['status' => 'processing', 'paid_at' => null]);
        $this->assertSame(0, DB::table('notifications')->where('type', 'payout_paid')->count());
    }

    public function test_new_forty_sixty_payout_and_historical_snapshot_remain_independent(): void
    {
        DB::table('payments')->where('id', $this->paymentId)->update(['commission_percent' => 40, 'platform_fee' => 40]);
        DB::table('payouts')->where('id', $this->payoutId)->update(['platform_deduction' => 40, 'net_amount' => 60]);
        $this->helperAmount = '60.00';
        $this->approve()->assertOk();
        $this->assertSame('60.00', $this->submitted[0]['items'][0]['amount']['value']);
        $this->assertDatabaseHas('payments', ['commission_percent' => 40, 'platform_fee' => 40]);
        $this->itemState = 'SUCCESS';
        $this->reconcile()->assertOk()->assertJsonPath('data.status', 'paid');
    }

    public function test_legacy_null_snapshot_is_not_repriced_and_inconsistent_new_snapshot_is_blocked(): void
    {
        DB::table('payments')->where('id', $this->paymentId)->update(['commission_percent' => 40]);
        $this->approve()->assertConflict();
        $this->assertSame([], $this->submitted);
        DB::table('payments')->where('id', $this->paymentId)->update(['commission_percent' => null]);
        $this->approve()->assertOk();
        $this->assertSame('70.00', $this->submitted[0]['items'][0]['amount']['value']);
        $this->assertDatabaseHas('payments', ['commission_percent' => null, 'platform_fee' => 30]);
    }

    public function test_unknown_or_fractional_commission_snapshot_requires_review(): void
    {
        foreach ([35, 40.5] as $percent) {
            DB::table('payments')->where('id', $this->paymentId)->update(['commission_percent' => $percent]);
            $this->approve()->assertConflict();
        }
        $this->assertSame([], $this->submitted);
    }
}
