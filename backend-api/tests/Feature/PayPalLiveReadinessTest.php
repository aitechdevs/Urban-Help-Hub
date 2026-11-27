<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PayPalLiveReadinessTest extends TestCase
{
    use RefreshDatabase;

    public function test_preflight_only_reads_the_configured_live_webhook(): void
    {
        config([
            'services.paypal.mode' => 'live', 'services.paypal.client_id' => 'test-client',
            'services.paypal.client_secret' => 'test-secret', 'services.paypal.merchant_id' => 'test-merchant',
            'services.paypal.webhook_id' => 'test-webhook', 'services.paypal.currency' => 'CAD',
            'services.paypal.frontend_url' => 'https://urbanhelphub.com',
            'services.paypal.live_direct_model_approved' => false,
        ]);
        Http::preventStrayRequests();
        Http::fake([
            'https://api-m.paypal.com/v1/oauth2/token' => Http::response(['access_token' => 'test-token']),
            'https://api-m.paypal.com/v1/notifications/webhooks/test-webhook' => Http::response([
                'url' => 'https://api.urbanhelphub.com/api/paypal/webhook', 'event_types' => [['name' => '*']],
            ]),
        ]);

        $this->artisan('paypal:check-live --remote')->expectsOutput('Checkout switch: off')->assertSuccessful();
        Http::assertSentCount(2);
        Http::assertSent(fn (Request $request) => $request->method() === 'GET'
            && $request->url() === 'https://api-m.paypal.com/v1/notifications/webhooks/test-webhook');
    }

    public function test_preflight_rejects_sandbox_without_authenticating(): void
    {
        config(['services.paypal.mode' => 'sandbox']);
        Http::fake();

        $this->artisan('paypal:check-live --remote')->assertFailed();
        Http::assertNothingSent();
    }
}
