<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PayPalPaymentsTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private User $helper;

    private User $admin;

    private int $taskId;

    private int $assignmentId;

    private array $captureOverrides = [];

    private string $payoutState = 'SUCCESS';

    private bool $failPayout = false;

    private bool $approvalRequired = false;

    private bool $capturePosted = false;

    protected function setUp(): void
    {
        parent::setUp();
        config(['services.paypal.payouts_enabled' => true, 'services.paypal.mode' => 'sandbox', 'services.paypal.client_id' => 'test-client', 'services.paypal.client_secret' => 'test-secret', 'services.paypal.merchant_id' => 'test-merchant', 'services.paypal.webhook_id' => 'test-webhook']);
        config(['services.paypal.frontend_url' => 'https://urbanhelphub.com/']);
        $this->customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        $this->helper = User::factory()->create(['role' => 'helper', 'status' => 'active']);
        $this->admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        DB::table('paypal_payout_accounts')->insert(['helper_id' => $this->helper->id, 'recipient' => Crypt::encryptString('helper@example.test')]);
        $category = DB::table('service_categories')->insertGetId(['name' => 'Cleaning', 'slug' => 'cleaning', 'is_active' => true]);
        DB::table('profiles')->insert(['user_id' => $this->helper->id, 'verification_status' => 'verified', 'country' => 'Canada', 'province' => 'ON', 'city' => 'Toronto']);
        DB::table('helper_services')->insert(['user_id' => $this->helper->id, 'service_category_id' => $category, 'approval_status' => 'approved', 'is_active' => true]);
        $this->taskId = DB::table('tasks')->insertGetId(['customer_id' => $this->customer->id, 'service_category_id' => $category, 'title' => 'Clean apartment', 'description' => 'Clean the apartment', 'status' => 'awaiting_confirmation', 'currency' => 'CAD', 'country' => 'Canada', 'province' => 'Ontario', 'city' => 'Toronto', 'scheduled_date' => now()->toDateString()]);
        $this->assignmentId = DB::table('task_assignments')->insertGetId(['task_id' => $this->taskId, 'helper_id' => $this->helper->id, 'status' => 'accepted', 'agreed_fixed_price' => 100, 'agreed_hourly_rate' => 25]);
        Http::preventStrayRequests();
        Http::fake(function (Request $request) {
            $url = $request->url();
            if (str_ends_with($url, '/v1/oauth2/token')) {
                return Http::response(['access_token' => 'test-access-token']);
            }
            if (str_ends_with($url, '/verify-webhook-signature')) {
                return Http::response(['verification_status' => $request['transmission_sig'] === 'valid-test-signature' ? 'SUCCESS' : 'FAILURE']);
            }
            if ($request->method() === 'POST' && str_ends_with($url, '/v2/checkout/orders')) {
                return Http::response(['id' => 'order-'.$request['purchase_units'][0]['custom_id'], 'links' => [['rel' => 'payer-action', 'href' => 'https://www.sandbox.paypal.com/checkoutnow?token=test']]], 201);
            }
            if ($request->method() === 'POST' && preg_match('~/v2/checkout/orders/order-\d+/capture$~', $url)) {
                $this->assertTrue($request->hasHeader('Content-Type', 'application/json'));
                $this->assertSame('{}', $request->body());
                $this->capturePosted = true;

                return Http::response(['id' => 'minimal-order', 'status' => 'COMPLETED'], 201);
            }
            if (preg_match('~/v2/checkout/orders/(order-\d+)$~', $url, $match)) {
                $installment = DB::table('payment_installments')->where('paypal_order_id', $match[1])->first();
                $capture = array_replace_recursive([
                    'id' => 'capture-'.$installment->id, 'status' => 'COMPLETED',
                    'amount' => ['currency_code' => 'CAD', 'value' => number_format($installment->amount_minor / 100, 2, '.', '')],
                    'seller_receivable_breakdown' => ['paypal_fee' => ['currency_code' => 'CAD', 'value' => '2.00']],
                ], $this->captureOverrides);

                return Http::response(['id' => $match[1], 'status' => $this->approvalRequired && ! $this->capturePosted ? 'APPROVED' : 'COMPLETED', 'purchase_units' => [[
                    'custom_id' => (string) $installment->id, 'payee' => ['merchant_id' => 'test-merchant'],
                    'payments' => ['captures' => [$capture]],
                ]]]);
            }
            if (preg_match('~/v2/payments/captures/capture-(\d+)$~', $url, $match)) {
                $installment = DB::table('payment_installments')->where('id', $match[1])->first();

                return Http::response(array_replace_recursive([
                    'id' => 'capture-'.$installment->id, 'status' => 'COMPLETED',
                    'amount' => ['currency_code' => 'CAD', 'value' => number_format($installment->amount_minor / 100, 2, '.', '')],
                    'seller_receivable_breakdown' => ['paypal_fee' => ['currency_code' => 'CAD', 'value' => '2.00']],
                    'supplementary_data' => ['related_ids' => ['order_id' => $installment->paypal_order_id]],
                ], $this->captureOverrides));
            }
            if ($request->method() === 'POST' && str_ends_with($url, '/v1/payments/payouts')) {
                if ($this->failPayout) {
                    return Http::failedConnection();
                }

                return Http::response(['batch_header' => ['payout_batch_id' => 'batch-1']], 201);
            }
            if (str_contains($url, '/v1/payments/payouts/batch-1')) {
                $payout = DB::table('payouts')->first();

                return Http::response(['items' => [[
                    'payout_item_id' => 'item-1', 'payout_batch_id' => 'batch-1', 'transaction_status' => $this->payoutState,
                    'payout_item' => ['sender_item_id' => 'urban-payout-'.$payout->id, 'receiver' => 'helper@example.test', 'amount' => ['currency' => 'CAD', 'value' => '60.00']],
                    'payout_item_fee' => ['currency' => 'CAD', 'value' => '1.00'],
                ]]]);
            }
            throw new \RuntimeException('Unexpected HTTP request: '.$url);
        });
    }

    private function confirmMatch(): int
    {
        Sanctum::actingAs($this->customer);
        $this->putJson('/api/customer/tasks/'.$this->taskId.'/confirm', ['assignment_id' => $this->assignmentId])->assertOk();

        return DB::table('payments')->where('task_id', $this->taskId)->value('id');
    }

    private function pay(int $paymentId, string $stage): string
    {
        Sanctum::actingAs($this->customer);
        $this->postJson('/api/customer/payments/'.$paymentId.'/checkout', ['stage' => $stage])->assertOk();
        $order = DB::table('payment_installments')->where('payment_id', $paymentId)->where('stage', $stage)->value('paypal_order_id');
        $this->postJson('/api/customer/payments/'.$paymentId.'/capture', ['order_id' => $order])->assertOk();

        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/v2/checkout/orders')
            && $request['payment_source']['paypal']['experience_context']['return_url'] === 'https://urbanhelphub.com/dashboard/?paypal_payment='.$paymentId
            && $request['payment_source']['paypal']['experience_context']['cancel_url'] === 'https://urbanhelphub.com/dashboard/?paypal_cancelled=1');

        return $order;
    }

    private function completeWork(): void
    {
        Sanctum::actingAs($this->helper);
        $this->putJson('/api/helper/jobs/'.$this->assignmentId.'/start')->assertOk();
        $this->travel(2)->hours();
        $this->putJson('/api/helper/jobs/'.$this->assignmentId.'/complete')->assertOk();
        Sanctum::actingAs($this->customer);
        $this->putJson('/api/customer/tasks/'.$this->taskId.'/confirm-completion')->assertOk();
    }

    public static function payoutAdministratorRoles(): array
    {
        return [
            'administrator' => ['admin'],
            'super administrator' => ['super_admin'],
        ];
    }

    #[DataProvider('payoutAdministratorRoles')]
    public function test_full_payment_flow_holds_sixty_percent_until_admin_release_and_paypal_success(string $role): void
    {
        $paymentId = $this->confirmMatch();
        $this->putJson('/api/customer/tasks/'.$this->taskId.'/confirm', ['assignment_id' => $this->assignmentId])->assertConflict();
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'total_amount' => 100, 'platform_fee' => 40, 'status' => 'pending']);
        $this->assertDatabaseHas('payouts', ['payment_id' => $paymentId, 'net_amount' => 60, 'other_deductions' => 0, 'status' => 'pending']);
        $this->assertDatabaseHas('payment_installments', ['payment_id' => $paymentId, 'stage' => 'commitment', 'amount_minor' => 5000]);
        $this->assertDatabaseHas('payment_installments', ['payment_id' => $paymentId, 'stage' => 'balance', 'amount_minor' => 5000]);
        $commitmentOrder = $this->pay($paymentId, 'commitment');
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => 'partially_paid']);
        $this->completeWork();
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'total_amount' => 100]);
        $this->assertNotSame($commitmentOrder, $this->pay($paymentId, 'balance'));
        $this->assertCount(2, DB::table('payment_installments')->where('payment_id', $paymentId)->distinct()->pluck('paypal_capture_id'));
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => 'paid', 'provider_fees' => 4]);
        $payoutId = DB::table('payouts')->value('id');
        $administrator = User::factory()->create(['role' => $role, 'status' => 'active']);
        Sanctum::actingAs($administrator);
        $this->postJson('/api/admin/payouts/'.$payoutId.'/release', ['customer_verified' => true, 'tax_amount' => '12.00'])->assertOk();
        $this->assertDatabaseHas('payouts', ['id' => $payoutId, 'status' => 'processing', 'net_amount' => 60, 'released_by' => $administrator->id]);
        $encryptedRecipient = DB::table('payouts')->where('id', $payoutId)->value('paypal_recipient');
        $this->assertNotSame('helper@example.test', $encryptedRecipient);
        $this->assertSame('helper@example.test', Crypt::decryptString($encryptedRecipient));
        $this->postJson('/api/admin/payouts/'.$payoutId.'/submit')->assertOk();
        $this->assertDatabaseHas('payouts', ['id' => $payoutId, 'status' => 'processing', 'paid_at' => null]);
        $this->postJson('/api/admin/payouts/'.$payoutId.'/refresh')->assertOk();
        $this->assertDatabaseHas('payouts', ['id' => $payoutId, 'status' => 'paid', 'net_amount' => 60, 'provider_fee' => 1]);
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'tax_amount' => 12, 'platform_fee' => 40]);
        Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/v1/payments/payouts') && $request['items'][0]['amount']['value'] === '60.00');
        $this->postJson('/api/admin/payouts/'.$payoutId.'/submit')->assertConflict();
        $events = DB::table('paypal_payout_audit_events')->where('payout_id', $payoutId)->orderBy('id')->get();
        $this->assertSame(['released', 'submission_started', 'submitted', 'refreshed'], $events->pluck('action')->all());
        $this->assertSame([$administrator->id], $events->pluck('actor_user_id')->unique()->values()->all());
        $this->assertSame([$role], $events->pluck('actor_role')->unique()->values()->all());
        $this->artisan('paypal:payout-audit', ['payout' => $payoutId])->assertSuccessful();
    }

    public function test_inactive_super_admin_and_helpers_cannot_act_on_payouts(): void
    {
        $inactive = User::factory()->create(['role' => 'super_admin', 'status' => 'suspended']);
        foreach ([$inactive, $this->helper] as $actor) {
            Sanctum::actingAs($actor);
            foreach (['release', 'submit', 'refresh'] as $action) {
                $this->postJson('/api/admin/payouts/1/'.$action)->assertForbidden();
            }
        }
        $this->assertDatabaseCount('paypal_payout_audit_events', 0);
        Http::assertNothingSent();
    }

    public function test_full_upfront_payment_uses_one_capture_and_payout_still_requires_completion(): void
    {
        $paymentId = $this->confirmMatch();
        $this->getJson('/api/customer/tasks')->assertOk()->assertJsonPath('data.0.payment.installments.0.has_order', 0);
        $orderId = $this->pay($paymentId, 'full');
        $this->assertDatabaseHas('payment_installments', ['payment_id' => $paymentId, 'stage' => 'full', 'amount_minor' => 10000, 'status' => 'completed']);
        $this->assertSame(2, DB::table('payment_installments')->where('payment_id', $paymentId)->where('status', 'superseded')->whereNull('paypal_order_id')->count());
        $this->getJson('/api/customer/tasks')->assertOk()->assertJsonCount(1, 'data.0.payment.installments')
            ->assertJsonPath('data.0.payment.installments.0.stage', 'full');
        $this->postJson('/api/customer/payments/'.$paymentId.'/capture', ['order_id' => $orderId])->assertOk();
        foreach (['commitment', 'balance', 'full'] as $stage) {
            $this->postJson('/api/customer/payments/'.$paymentId.'/checkout', ['stage' => $stage])->assertConflict();
        }
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => 'paid', 'provider_fees' => 2]);

        $payoutId = DB::table('payouts')->value('id');
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/payouts/'.$payoutId.'/release', ['customer_verified' => true, 'tax_amount' => 0])->assertConflict();
        $this->completeWork();
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/payouts/'.$payoutId.'/release', ['customer_verified' => true, 'tax_amount' => 0])->assertOk();
        $this->postJson('/api/admin/payouts/'.$payoutId.'/submit')->assertOk();
        $this->postJson('/api/admin/payouts/'.$payoutId.'/refresh')->assertOk();
        $this->assertDatabaseHas('payouts', ['id' => $payoutId, 'status' => 'paid', 'net_amount' => 60]);
        $this->assertCount(1, Http::recorded(fn (Request $request) => $request->method() === 'POST'
            && str_ends_with($request->url(), '/v2/checkout/orders')));
    }

    public function test_an_existing_split_checkout_cannot_be_replaced_by_a_full_order(): void
    {
        $paymentId = $this->confirmMatch();
        $url = '/api/customer/payments/'.$paymentId.'/checkout';
        $this->postJson($url, ['stage' => 'commitment'])->assertOk();
        $this->postJson($url, ['stage' => 'full'])->assertConflict();
        $this->assertDatabaseMissing('payment_installments', ['payment_id' => $paymentId, 'stage' => 'full']);
        $this->assertCount(1, Http::recorded(fn (Request $request) => $request->method() === 'POST'
            && str_ends_with($request->url(), '/v2/checkout/orders')));
    }

    public function test_installments_cannot_use_historical_checkout_or_payout_routes(): void
    {
        $paymentId = $this->confirmMatch();
        $this->getJson('/api/customer/payments/'.$paymentId.'/paypal/config')->assertConflict();
        $this->postJson('/api/customer/payments/'.$paymentId.'/paypal/create-order')->assertConflict();
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/payouts/'.DB::table('payouts')->value('id').'/approve-paypal', [
            'account_version' => str_repeat('a', 64),
        ])->assertConflict();
        Http::assertNothingSent();
    }

    public function test_work_and_balance_are_blocked_before_commitment_and_customer_confirmation(): void
    {
        $paymentId = $this->confirmMatch();
        Sanctum::actingAs($this->helper);
        $this->putJson('/api/helper/jobs/'.$this->assignmentId.'/start')->assertConflict();
        Sanctum::actingAs($this->customer);
        $this->postJson('/api/customer/payments/'.$paymentId.'/checkout', ['stage' => 'balance'])->assertConflict();
        $this->assertDatabaseHas('tasks', ['id' => $this->taskId, 'status' => 'scheduled']);
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => 'pending']);
        Http::assertNothingSent();
    }

    public function test_admin_cannot_release_without_full_payment_or_bypass_provider_status(): void
    {
        $paymentId = $this->confirmMatch();
        Sanctum::actingAs($this->admin);
        $payoutId = DB::table('payouts')->value('id');
        $this->postJson('/api/admin/payouts/'.$payoutId.'/release', ['customer_verified' => true, 'tax_amount' => 0])->assertConflict();
        $this->putJson('/api/admin/payments/'.$paymentId.'/status', ['status' => 'paid'])->assertConflict();
        $this->putJson('/api/admin/payouts/'.$payoutId.'/status', ['status' => 'paid'])->assertConflict();
        $this->assertDatabaseHas('payouts', ['id' => $payoutId, 'status' => 'pending', 'released_by' => null]);
    }

    public function test_customer_cannot_pay_another_customers_order_or_release_earnings(): void
    {
        $paymentId = $this->confirmMatch();
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));
        $this->postJson('/api/customer/payments/'.$paymentId.'/checkout', ['stage' => 'commitment'])->assertNotFound();
        $this->postJson('/api/customer/payments/'.$paymentId.'/capture', ['order_id' => 'foreign-order'])->assertNotFound();
        $this->postJson('/api/admin/payouts/'.DB::table('payouts')->value('id').'/release', ['customer_verified' => true, 'tax_amount' => 0])->assertForbidden();
        Http::assertNothingSent();
    }

    public function test_wrong_capture_amount_and_currency_are_rejected(): void
    {
        $paymentId = $this->confirmMatch();
        $this->postJson('/api/customer/payments/'.$paymentId.'/checkout', ['stage' => 'commitment'])->assertOk();
        $order = DB::table('payment_installments')->where('stage', 'commitment')->value('paypal_order_id');
        foreach ([['amount' => ['value' => '1.00']], ['amount' => ['currency_code' => 'USD']], ['status' => 'PENDING'], ['supplementary_data' => ['related_ids' => ['order_id' => 'different-order']]]] as $overrides) {
            $this->captureOverrides = $overrides;
            $this->postJson('/api/customer/payments/'.$paymentId.'/capture', ['order_id' => $order])->assertConflict();
            $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => 'pending', 'provider_fees' => 0]);
        }
    }

    public function test_replayed_capture_and_signed_webhook_do_not_double_count_fees(): void
    {
        $paymentId = $this->confirmMatch();
        $order = $this->pay($paymentId, 'commitment');
        $this->postJson('/api/customer/payments/'.$paymentId.'/capture', ['order_id' => $order])->assertOk();
        $this->postJson('/api/paypal/webhook', ['id' => 'capture-event', 'event_type' => 'PAYMENT.CAPTURE.COMPLETED', 'resource' => ['supplementary_data' => ['related_ids' => ['order_id' => $order]]]], ['PAYPAL-AUTH-ALGO' => 'SHA256withRSA', 'PAYPAL-CERT-URL' => 'https://example.test/cert',
            'PAYPAL-TRANSMISSION-ID' => 'transmission-test', 'PAYPAL-TRANSMISSION-TIME' => '2026-11-24T00:00:00Z', 'PAYPAL-TRANSMISSION-SIG' => 'valid-test-signature'])->assertOk();
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'provider_fees' => 2, 'status' => 'partially_paid']);
        $this->assertDatabaseHas('payouts', ['payment_id' => $paymentId, 'status' => 'pending', 'paid_at' => null]);
    }

    public function test_unsigned_webhook_is_rejected_and_dispute_blocks_release(): void
    {
        $paymentId = $this->confirmMatch();
        $this->pay($paymentId, 'commitment');
        $capture = DB::table('payment_installments')->where('stage', 'commitment')->value('paypal_capture_id');
        $event = ['id' => 'dispute-event', 'event_type' => 'CUSTOMER.DISPUTE.CREATED', 'resource' => ['disputed_transactions' => [['seller_transaction_id' => $capture]]]];
        $this->postJson('/api/paypal/webhook', $event)->assertBadRequest();
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => 'partially_paid']);
        $this->postJson('/api/paypal/webhook', $event, ['PAYPAL-AUTH-ALGO' => 'SHA256withRSA', 'PAYPAL-CERT-URL' => 'https://example.test/cert',
            'PAYPAL-TRANSMISSION-ID' => 'transmission-test', 'PAYPAL-TRANSMISSION-TIME' => '2026-11-24T00:00:00Z', 'PAYPAL-TRANSMISSION-SIG' => 'valid-test-signature'])->assertOk();
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => 'blocked']);
    }

    public function test_odd_cent_total_preserves_full_price_and_sixty_percent_share(): void
    {
        DB::table('task_assignments')->where('id', $this->assignmentId)->update(['agreed_fixed_price' => '100.01']);
        $paymentId = $this->confirmMatch();
        $this->assertDatabaseHas('payment_installments', ['payment_id' => $paymentId, 'stage' => 'commitment', 'amount_minor' => 5001]);
        $this->assertDatabaseHas('payment_installments', ['payment_id' => $paymentId, 'stage' => 'balance', 'amount_minor' => 5000]);
        $this->assertDatabaseHas('payouts', ['payment_id' => $paymentId, 'net_amount' => '60.01', 'platform_deduction' => '40.00']);
    }

    public function test_customer_cannot_confirm_a_quote_from_a_helper_who_is_no_longer_eligible(): void
    {
        DB::table('users')->where('id', $this->helper->id)->update(['status' => 'suspended']);
        Sanctum::actingAs($this->customer);
        $this->putJson('/api/customer/tasks/'.$this->taskId.'/confirm', ['assignment_id' => $this->assignmentId])->assertConflict();
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseHas('tasks', ['id' => $this->taskId, 'status' => 'awaiting_confirmation']);
    }

    public function test_no_quote_or_unsupported_currency_does_not_confirm_match(): void
    {
        DB::table('task_assignments')->where('id', $this->assignmentId)->update(['agreed_fixed_price' => null]);
        Sanctum::actingAs($this->customer);
        $this->putJson('/api/customer/tasks/'.$this->taskId.'/confirm', ['assignment_id' => $this->assignmentId])->assertUnprocessable();
        $this->assertDatabaseCount('payments', 0);
        $this->assertDatabaseHas('task_assignments', ['id' => $this->assignmentId, 'status' => 'accepted']);
        DB::table('task_assignments')->where('id', $this->assignmentId)->update(['agreed_fixed_price' => 100]);
        DB::table('tasks')->where('id', $this->taskId)->update(['currency' => 'NGN']);
        DB::table('users')->where('id', $this->helper->id)->update(['currency_code' => 'NGN']);
        $this->putJson('/api/customer/tasks/'.$this->taskId.'/confirm', ['assignment_id' => $this->assignmentId])->assertUnprocessable();
        $this->assertDatabaseCount('payments', 0);
    }

    public function test_uncertain_payout_response_cannot_send_a_second_transfer(): void
    {
        $paymentId = $this->confirmMatch();
        $this->pay($paymentId, 'commitment');
        $this->completeWork();
        $this->pay($paymentId, 'balance');
        $payoutId = DB::table('payouts')->value('id');
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/payouts/'.$payoutId.'/release', ['customer_verified' => true, 'tax_amount' => 0])->assertOk();
        $this->failPayout = true;

        $this->postJson('/api/admin/payouts/'.$payoutId.'/submit')->assertStatus(502);
        $this->postJson('/api/admin/payouts/'.$payoutId.'/submit')->assertConflict();

        $this->assertDatabaseHas('payouts', ['id' => $payoutId, 'status' => 'processing', 'provider_payout_id' => null, 'paid_at' => null]);
        $this->assertSame(['released', 'submission_started'], DB::table('paypal_payout_audit_events')
            ->where('payout_id', $payoutId)->orderBy('id')->pluck('action')->all());
    }

    public function test_admin_attestation_and_tax_review_are_required_before_release(): void
    {
        $paymentId = $this->confirmMatch();
        $this->pay($paymentId, 'commitment');
        $this->completeWork();
        $this->pay($paymentId, 'balance');
        $payoutId = DB::table('payouts')->value('id');
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/admin/payouts/'.$payoutId.'/release', ['customer_verified' => false, 'tax_amount' => 0])->assertUnprocessable();
        $this->postJson('/api/admin/payouts/'.$payoutId.'/release', ['customer_verified' => true, 'tax_amount' => -1])->assertUnprocessable();
        $this->postJson('/api/admin/payouts/'.$payoutId.'/release', ['customer_verified' => true])->assertUnprocessable();
        $this->postJson('/api/admin/payouts/'.$payoutId.'/submit')->assertConflict();
        $this->assertDatabaseHas('payouts', ['id' => $payoutId, 'status' => 'pending', 'released_by' => null]);
    }

    public function test_helper_proposes_quote_and_can_save_only_their_own_paypal_email(): void
    {
        DB::table('task_assignments')->where('id', $this->assignmentId)->update(['status' => 'offered']);
        DB::table('tasks')->where('id', $this->taskId)->update(['status' => 'open']);
        Sanctum::actingAs($this->helper);
        $this->putJson('/api/helper/opportunities/'.$this->assignmentId.'/accept', ['agreed_fixed_price' => '210.001'])->assertUnprocessable();
        $this->putJson('/api/helper/opportunities/'.$this->assignmentId.'/accept', ['agreed_fixed_price' => '210.00'])->assertOk();
        $this->assertDatabaseHas('task_assignments', ['id' => $this->assignmentId, 'status' => 'accepted', 'agreed_fixed_price' => 210]);
        $this->putJson('/api/helper/paypal/payout-account', ['email' => 'new-helper@example.test', 'password' => 'password'])->assertOk();
        $stored = DB::table('paypal_payout_accounts')->where('helper_id', $this->helper->id)->value('recipient');
        $this->assertNotSame('new-helper@example.test', $stored);
        $this->assertSame('new-helper@example.test', Crypt::decryptString($stored));
        $this->getJson('/api/helper/paypal/payout-account')->assertOk()->assertJsonPath('data.email', 'new-helper@example.test');
        Sanctum::actingAs($this->customer);
        $this->getJson('/api/customer/tasks')->assertOk()->assertJsonPath('data.0.candidates.0.agreed_fixed_price', 210);
        $this->putJson('/api/helper/paypal/payout-account', ['email' => 'customer@example.test', 'password' => 'password'])->assertForbidden();
    }

    public function test_refunded_capture_is_rechecked_before_sending_authorized_payout(): void
    {
        $paymentId = $this->confirmMatch();
        $this->pay($paymentId, 'commitment');
        $this->completeWork();
        $this->pay($paymentId, 'balance');
        $payoutId = DB::table('payouts')->value('id');
        Sanctum::actingAs($this->admin);
        $this->postJson('/api/admin/payouts/'.$payoutId.'/release', ['customer_verified' => true, 'tax_amount' => 0])->assertOk();
        $this->captureOverrides = ['status' => 'REFUNDED'];

        $this->postJson('/api/admin/payouts/'.$payoutId.'/submit')->assertConflict();

        $this->assertDatabaseHas('payouts', ['id' => $payoutId, 'status' => 'processing', 'processed_at' => null, 'paid_at' => null]);
        Http::assertNotSent(fn (Request $request) => str_ends_with($request->url(), '/v1/payments/payouts'));
    }

    public function test_capture_uses_json_and_fetches_full_order_after_minimal_provider_response(): void
    {
        $paymentId = $this->confirmMatch();
        $this->approvalRequired = true;

        $this->pay($paymentId, 'commitment');

        $this->assertTrue($this->capturePosted);
        $this->assertDatabaseHas('payment_installments', ['payment_id' => $paymentId, 'stage' => 'commitment', 'status' => 'completed']);
        $this->assertDatabaseHas('payments', ['id' => $paymentId, 'status' => 'partially_paid']);
        $this->assertDatabaseHas('payouts', ['payment_id' => $paymentId, 'status' => 'pending', 'paid_at' => null]);
    }
}
