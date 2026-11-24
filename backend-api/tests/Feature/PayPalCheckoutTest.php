<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PayPalCheckoutTest extends TestCase
{
    use RefreshDatabase;

    private int $paymentId;

    private array $order;

    private bool $approved = false;

    private bool $captured = false;

    private bool $signature = true;

    private bool $providerFailure = false;

    private int $captureCalls = 0;

    protected function setUp(): void
    {
        parent::setUp();
        Http::preventStrayRequests();
        config(['services.paypal' => ['mode' => 'sandbox', 'client_id' => 'public-test-client', 'client_secret' => 'secret-not-for-browser', 'merchant_id' => 'MERCHANT123', 'webhook_id' => 'private-webhook-id', 'currency' => 'CAD']]);
        $customer = User::factory()->create(['role' => 'customer']);
        $helper = User::factory()->create(['role' => 'helper']);
        $category = DB::table('service_categories')->insertGetId(['name' => 'Test', 'slug' => 'test-paypal', 'is_active' => true]);
        $task = DB::table('tasks')->insertGetId(['customer_id' => $customer->id, 'service_category_id' => $category, 'title' => 'Test service', 'description' => 'Test', 'status' => 'completed', 'currency' => 'CAD']);
        $this->paymentId = DB::table('payments')->insertGetId(['task_id' => $task, 'customer_id' => $customer->id, 'helper_id' => $helper->id, 'subtotal_amount' => '100.00', 'platform_fee' => '30.00', 'total_amount' => '100.00', 'currency' => 'CAD', 'status' => 'pending']);
        DB::table('payouts')->insert(['payment_id' => $this->paymentId, 'task_id' => $task, 'helper_id' => $helper->id, 'gross_amount' => 100, 'net_amount' => 70, 'status' => 'pending', 'provider' => 'stripe']);
        Sanctum::actingAs($customer);
        $this->order = ['id' => 'ORDER12345', 'intent' => 'CAPTURE', 'status' => 'CREATED', 'payer' => ['payer_id' => 'PAYER123'], 'purchase_units' => [[
            'reference_id' => (string) $this->paymentId, 'custom_id' => (string) $this->paymentId,
            'payee' => ['merchant_id' => 'MERCHANT123'], 'amount' => ['currency_code' => 'CAD', 'value' => '100.00'],
        ]]];
        Http::fake(function ($request) {
            if ($this->providerFailure) {
                return Http::response(['debug' => 'secret-not-for-browser'], 500);
            }
            $url = $request->url();
            if (str_ends_with($url, '/v1/oauth2/token')) {
                return Http::response(['access_token' => 'private-access-token', 'expires_in' => 3600]);
            }
            if (str_ends_with($url, '/verify-webhook-signature')) {
                return Http::response(['verification_status' => $this->signature ? 'SUCCESS' : 'FAILURE']);
            }
            if (str_ends_with($url, '/capture')) {
                $this->captureCalls++;
                $this->captured = true;
            }
            $order = $this->order;
            $order['status'] = $this->captured ? 'COMPLETED' : ($this->approved ? 'APPROVED' : 'CREATED');
            if ($this->captured) {
                $order['purchase_units'][0]['payments'] ??= ['captures' => [[
                    'id' => 'CAPTURE12345', 'status' => 'COMPLETED', 'amount' => ['currency_code' => 'CAD', 'value' => '100.00'],
                ]]];
            }

            return Http::response($order);
        });
    }

    private function path(string $action): string
    {
        return "/api/customer/payments/{$this->paymentId}/paypal/{$action}";
    }

    private function createOrder(): void
    {
        $this->postJson($this->path('create-order'), ['amount' => '0.01', 'currency' => 'USD', 'customer_id' => 999])->assertOk()->assertJsonPath('data.order_id', 'ORDER12345');
    }

    private function captureOrder(): void
    {
        $this->approved = true;
        $this->postJson($this->path('capture'), ['order_id' => 'ORDER12345'])->assertOk()->assertJsonPath('data.status', 'paid');
    }

    private function webhook(string $type = 'PAYMENT.CAPTURE.COMPLETED', string $id = 'EVENT12345', array $resource = []): TestResponse
    {
        return $this->postJson('/api/paypal/webhook', ['id' => $id, 'event_type' => $type, 'resource' => $resource ?: ['id' => 'CAPTURE12345', 'supplementary_data' => ['related_ids' => ['order_id' => 'ORDER12345']]]], [
            'paypal-auth-algo' => 'SHA256withRSA', 'paypal-cert-url' => 'https://api.paypal.com/cert/test', 'paypal-transmission-id' => 'transmission', 'paypal-transmission-sig' => 'signature', 'paypal-transmission-time' => now()->toIso8601String(),
        ]);
    }

    public function test_creation_uses_database_amount_and_reuses_order_without_duplicate_payments(): void
    {
        $this->createOrder();
        $this->createOrder();
        $this->assertDatabaseCount('payments', 1);
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/v2/checkout/orders') && $request['purchase_units'][0]['amount']['value'] === '100.00' && $request['purchase_units'][0]['amount']['currency_code'] === 'CAD' && ! empty($request->header('PayPal-Request-Id')));
        $requests = Http::recorded(fn ($request) => $request->method() === 'POST' && str_ends_with($request->url(), '/v2/checkout/orders'));
        $this->assertCount(1, $requests);
    }

    public function test_idor_role_and_guest_protection(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));
        foreach (['create-order', 'capture'] as $action) {
            $this->postJson($this->path($action), ['order_id' => 'ORDER12345'])->assertNotFound();
        }
        $this->getJson($this->path('config'))->assertNotFound();
        Sanctum::actingAs(User::factory()->create(['role' => 'helper']));
        $this->postJson($this->path('create-order'))->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->postJson($this->path('create-order'))->assertUnauthorized();
        Http::assertNothingSent();
    }

    public function test_paid_cancelled_zero_and_unsupported_currency_are_rejected(): void
    {
        foreach (['paid', 'cancelled', 'refunded', 'reversed', 'invalid'] as $status) {
            DB::table('payments')->where('id', $this->paymentId)->update(['status' => $status]);
            $this->postJson($this->path('create-order'))->assertConflict();
        }
        DB::table('payments')->where('id', $this->paymentId)->update(['status' => 'pending', 'total_amount' => 0]);
        $this->postJson($this->path('create-order'))->assertUnprocessable();
        DB::table('payments')->where('id', $this->paymentId)->update(['total_amount' => 100, 'currency' => 'NGN']);
        $this->postJson($this->path('create-order'))->assertUnprocessable();
        Http::assertNothingSent();
    }

    public function test_capture_is_authoritative_idempotent_and_does_not_pay_helper(): void
    {
        $this->createOrder();
        $this->postJson($this->path('capture'), ['order_id' => 'OTHER12345'])->assertConflict();
        $this->postJson($this->path('capture'), ['order_id' => 'ORDER12345'])->assertConflict();
        $this->captureOrder();
        $this->captureOrder();
        $this->assertSame(1, $this->captureCalls);
        $this->assertDatabaseHas('payments', ['id' => $this->paymentId, 'status' => 'paid', 'paypal_capture_id' => 'CAPTURE12345']);
        $this->assertDatabaseHas('payouts', ['payment_id' => $this->paymentId, 'provider' => 'manual', 'status' => 'pending', 'provider_payout_id' => null]);
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_capture_amount_currency_and_recipient_mismatches_fail_closed(): void
    {
        $this->createOrder();
        $this->approved = true;
        $original = $this->order;
        foreach ([['amount', 'value', '99.00'], ['amount', 'currency_code', 'USD'], ['payee', 'merchant_id', 'ATTACKER']] as [$section, $key, $value]) {
            $this->order = $original;
            $this->order['purchase_units'][0][$section][$key] = $value;
            $this->postJson($this->path('capture'), ['order_id' => 'ORDER12345'])->assertStatus(502);
            $this->assertDatabaseHas('payments', ['id' => $this->paymentId, 'status' => 'pending']);
        }
        $this->assertSame(0, $this->captureCalls);
        $this->order = $original;
        $this->captured = true;
        $this->order['purchase_units'][0]['payments']['captures'] = [['id' => 'CAPTURE12345', 'status' => 'COMPLETED', 'amount' => ['value' => '0.01', 'currency_code' => 'CAD']]];
        $this->postJson($this->path('capture'), ['order_id' => 'ORDER12345'])->assertStatus(502);
        $this->assertDatabaseHas('payments', ['status' => 'pending']);
    }

    public function test_webhook_signature_replay_and_capture_response_race(): void
    {
        $this->createOrder();
        $this->captured = true;
        $this->signature = false;
        $this->webhook()->assertStatus(400);
        $this->assertDatabaseCount('paypal_webhook_events', 0);
        $this->signature = true;
        $this->webhook()->assertOk();
        $this->webhook()->assertOk();
        $this->captureOrder();
        $this->assertSame(0, $this->captureCalls);
        $this->assertDatabaseCount('paypal_webhook_events', 1);
        $this->assertDatabaseCount('notifications', 1);
        Http::assertSent(fn ($request) => str_ends_with($request->url(), '/verify-webhook-signature') && $request['webhook_id'] === 'private-webhook-id' && isset($request['webhook_event']['id']));
    }

    public function test_refunds_reversals_and_out_of_order_completed_events_cannot_restore_paid_status(): void
    {
        $this->createOrder();
        $this->captureOrder();
        $this->order['purchase_units'][0]['payments'] = [
            'captures' => [['id' => 'CAPTURE12345', 'status' => 'PARTIALLY_REFUNDED', 'amount' => ['currency_code' => 'CAD', 'value' => '100.00']]],
            'refunds' => [['id' => 'REFUND12345', 'status' => 'COMPLETED', 'amount' => ['currency_code' => 'CAD', 'value' => '40.00']]],
        ];
        $this->webhook('PAYMENT.CAPTURE.REFUNDED')->assertOk();
        $this->assertDatabaseHas('payments', ['status' => 'partially_refunded', 'refunded_amount' => 40]);
        $this->order['purchase_units'][0]['payments']['captures'][0]['status'] = 'REFUNDED';
        $this->order['purchase_units'][0]['payments']['refunds'][0]['amount']['value'] = '100.00';
        $this->webhook('PAYMENT.CAPTURE.REFUNDED', 'EVENTFULL')->assertOk();
        $this->assertDatabaseHas('payments', ['status' => 'refunded', 'refunded_amount' => 100]);
        unset($this->order['purchase_units'][0]['payments']);
        $this->webhook('PAYMENT.CAPTURE.COMPLETED', 'EVENTSTALE')->assertOk();
        $this->assertDatabaseHas('payments', ['status' => 'refunded', 'refunded_amount' => 100]);
        $this->webhook('PAYMENT.CAPTURE.REVERSED', 'EVENTREVERSE')->assertOk();
        $this->webhook('PAYMENT.CAPTURE.COMPLETED', 'EVENTSTALE2')->assertOk();
        $this->assertDatabaseHas('payments', ['status' => 'reversed']);
    }

    public function test_disputes_are_recorded_without_marking_payout_paid(): void
    {
        $this->createOrder();
        $this->captureOrder();
        $resource = ['id' => 'DISPUTEREF123', 'disputed_transactions' => [['seller_transaction_id' => 'CAPTURE12345']]];
        $this->webhook('CUSTOMER.DISPUTE.CREATED', 'DISPUTE1', $resource)->assertOk();
        $this->assertDatabaseHas('payments', ['paypal_dispute_status' => 'OPEN']);
        $this->webhook('CUSTOMER.DISPUTE.RESOLVED', 'DISPUTE2', $resource)->assertOk();
        $this->webhook('CUSTOMER.DISPUTE.CREATED', 'DISPUTE3', $resource)->assertOk();
        $this->assertDatabaseHas('payments', ['paypal_dispute_status' => 'RESOLVED']);
        $this->assertDatabaseHas('payouts', ['status' => 'pending']);
        $resource['id'] = 'NEWDISPUTEREF';
        $this->webhook('CUSTOMER.DISPUTE.CREATED', 'DISPUTE4', $resource)->assertOk();
        $this->assertDatabaseHas('payments', ['paypal_dispute_status' => 'OPEN', 'paypal_dispute_id' => 'NEWDISPUTEREF']);
    }

    public function test_provider_failure_is_sanitized_and_retry_keeps_request_key(): void
    {
        $this->providerFailure = true;
        $response = $this->postJson($this->path('create-order'))->assertStatus(502);
        $this->assertStringNotContainsString('secret-not-for-browser', $response->getContent());
        $key = DB::table('payments')->value('paypal_create_key');
        $this->assertNotEmpty($key);
        $this->providerFailure = false;
        $this->createOrder();
        $this->assertSame($key, DB::table('payments')->value('paypal_create_key'));
    }

    public function test_ambiguous_old_create_is_not_retried_after_request_id_retention_window(): void
    {
        DB::table('payments')->where('id', $this->paymentId)->update(['paypal_create_key' => 'key', 'paypal_started_at' => now()->subHours(7), 'paypal_mode' => 'sandbox']);
        $this->postJson($this->path('create-order'))->assertConflict();
        Http::assertNothingSent();
    }

    public function test_retired_provider_routes_are_removed_and_paypal_cannot_overlap_with_historical_checkout(): void
    {
        $routes = collect(Route::getRoutes())->map(fn ($route) => $route->uri());
        $this->assertNotContains('api/stripe/webhook', $routes);
        $this->assertNotContains('api/helper/stripe/status', $routes);
        foreach (['api/customer/payments/{paymentId}/checkout', 'api/admin/payments', 'api/admin/payments/{paymentId}/status'] as $route) {
            $this->assertContains($route, $routes);
        }
        DB::table('payments')->where('id', $this->paymentId)->update(['stripe_checkout_session_id' => 'cs_existing']);
        $this->postJson($this->path('create-order'))->assertConflict();
        DB::table('payments')->where('id', $this->paymentId)->update(['stripe_checkout_session_id' => null]);
        $this->createOrder();
        $this->postJson("/api/customer/payments/{$this->paymentId}/checkout")->assertConflict();
    }

    public function test_public_configuration_contains_only_client_id_currency_and_mode(): void
    {
        $response = $this->getJson($this->path('config'))->assertOk()->assertHeader('Cache-Control', 'no-store, private');
        $this->assertSame(['client_id', 'currency', 'mode'], array_keys($response->json('data')));
        foreach (['secret-not-for-browser', 'private-webhook-id', 'private-access-token', 'MERCHANT123'] as $secret) {
            $this->assertStringNotContainsString($secret, $response->getContent());
        }
    }

    public function test_failed_webhook_rolls_back_event_id_and_can_retry(): void
    {
        $this->createOrder();
        $this->webhook()->assertStatus(503);
        $this->assertDatabaseCount('paypal_webhook_events', 0);
        $this->captured = true;
        $this->webhook()->assertOk();
        $this->assertDatabaseCount('paypal_webhook_events', 1);
    }

    public function test_declined_capture_webhook_records_failure_without_payout(): void
    {
        $this->createOrder();
        $this->captured = true;
        $this->order['purchase_units'][0]['payments']['captures'] = [['id' => 'CAPTURE12345', 'status' => 'DECLINED', 'amount' => ['currency_code' => 'CAD', 'value' => '100.00']]];
        $this->webhook('PAYMENT.CAPTURE.DENIED')->assertOk();
        $this->assertDatabaseHas('payments', ['status' => 'failed', 'paid_at' => null]);
        $this->assertDatabaseHas('payouts', ['status' => 'pending']);
    }

    public function test_admin_cannot_override_paypal_confirmation_or_release_disputed_payout(): void
    {
        $this->createOrder();
        $this->captureOrder();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'status' => 'active']));
        $this->putJson("/api/admin/payments/{$this->paymentId}/status", ['status' => 'pending'])->assertConflict();
        DB::table('payments')->where('id', $this->paymentId)->update(['paypal_dispute_status' => 'OPEN']);
        $id = DB::table('payouts')->value('id');
        $this->putJson("/api/admin/payouts/{$id}/status", ['status' => 'paid'])->assertConflict();
        $this->assertDatabaseHas('payouts', ['status' => 'pending']);
    }

    public function test_missing_signature_headers_and_wrong_environment_fail_closed(): void
    {
        $this->postJson('/api/paypal/webhook', ['id' => 'EVENT12345', 'event_type' => 'PAYMENT.CAPTURE.COMPLETED'])->assertStatus(400);
        Http::assertNothingSent();
        $this->createOrder();
        config(['services.paypal.mode' => 'live']);
        $this->postJson($this->path('capture'), ['order_id' => 'ORDER12345'])->assertConflict();
        $this->postJson($this->path('create-order'))->assertConflict();
    }

    public function test_lost_capture_response_reconciles_without_a_second_capture(): void
    {
        $this->createOrder();
        $this->approved = true;
        $completed = $this->order;
        $completed['status'] = 'COMPLETED';
        $completed['purchase_units'][0]['payments']['captures'] = [['id' => 'CAPTURE12345', 'status' => 'COMPLETED', 'amount' => ['currency_code' => 'CAD', 'value' => '100.00']]];
        Http::swap(new Factory);
        Http::preventStrayRequests();
        Http::fake(function ($request) use ($completed) {
            if (str_ends_with($request->url(), '/capture')) {
                $this->captureCalls++;
                $this->captured = true;

                return Http::response([], 504);
            }
            $approved = $this->order;
            $approved['status'] = 'APPROVED';

            return Http::response($this->captured ? $completed : $approved);
        });
        $this->postJson($this->path('capture'), ['order_id' => 'ORDER12345'])->assertStatus(502);
        $this->assertDatabaseHas('payments', ['status' => 'pending']);
        $this->postJson($this->path('capture'), ['order_id' => 'ORDER12345'])->assertOk()->assertJsonPath('data.status', 'paid');
        $this->assertSame(1, $this->captureCalls);
    }
}
