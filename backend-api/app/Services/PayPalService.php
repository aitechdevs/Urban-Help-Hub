<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** PayPal transport boundary. Never propagate provider bodies, tokens or credentials. */
class PayPalService
{
    public function mode(): string
    {
        $mode = config('services.paypal.mode');
        if (! in_array($mode, ['sandbox', 'live'], true)) {
            throw new RuntimeException('PayPal configuration is unavailable.');
        }
        if (! config('services.paypal.client_id') || ! config('services.paypal.client_secret') || ! config('services.paypal.merchant_id') || ! config('services.paypal.webhook_id')) {
            throw new RuntimeException('PayPal configuration is unavailable.');
        }

        return $mode;
    }

    private function base(): string
    {
        return $this->mode() === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';
    }

    private function token(): string
    {
        $key = 'paypal-token:'.hash('sha256', $this->mode().config('services.paypal.client_id').config('services.paypal.client_secret'));
        $cached = Cache::get($key);
        if (is_string($cached) && $cached !== '') {
            return $cached;
        }
        $response = Http::asForm()->acceptJson()->withBasicAuth(config('services.paypal.client_id'), config('services.paypal.client_secret'))
            ->connectTimeout(5)->timeout(20)->withOptions(['allow_redirects' => false])
            ->post($this->base().'/v1/oauth2/token', ['grant_type' => 'client_credentials']);
        if (! $response->successful() || ! is_string($response->json('access_token'))) {
            throw new RuntimeException('PayPal authentication failed.');
        }
        $token = $response->json('access_token');
        Cache::put($key, $token, max(1, min(3000, (int) $response->json('expires_in', 60) - 60)));

        return $token;
    }

    /** No automatic POST retry: stable PayPal-Request-Id keys allow explicit reconciliation. */
    public function request(string $method, string $path, array $data = [], ?string $key = null): array
    {
        $request = Http::acceptJson()->asJson()->withToken($this->token())->connectTimeout(5)->timeout(25)
            ->withOptions(['allow_redirects' => false])->withHeaders(['Prefer' => 'return=representation']);
        if ($key) {
            $request = $request->withHeaders(['PayPal-Request-Id' => $key]);
        }
        $response = $request->send($method, $this->base().$path, $method === 'GET' ? [] : ['json' => $data]);
        if (! $response->successful() || ! is_array($response->json())) {
            throw new RuntimeException('PayPal request failed.');
        }

        return $response->json();
    }

    /** A duplicate sender batch is reconciled to its existing provider ID, never replaced. */
    public function submitPayout(array $payload, string $key): array
    {
        $response = Http::acceptJson()->asJson()->withToken($this->token())->connectTimeout(5)->timeout(25)
            ->withOptions(['allow_redirects' => false])->withHeaders(['PayPal-Request-Id' => $key])
            ->post($this->base().'/v1/payments/payouts', $payload);
        $body = $response->json();
        if ($response->successful() && is_array($body)) {
            return $body;
        }
        $duplicate = is_array($body) && (($body['name'] ?? null) === 'DUPLICATE_BATCH_ID' || collect($body['details'] ?? [])->contains(fn ($detail) => ($detail['issue'] ?? null) === 'DUPLICATE_BATCH_ID'));
        if ($duplicate) {
            $links = array_merge($body['links'] ?? [], ...array_map(fn ($detail) => $detail['links'] ?? [], $body['details'] ?? []));
            foreach ($links as $link) {
                if (preg_match('~/v1/payments/payouts/([A-Z0-9]{5,64})(?:\?|$)~', $link['href'] ?? '', $matches)) {
                    return ['batch_header' => ['payout_batch_id' => $matches[1]]];
                }
            }
        }
        throw new RuntimeException('PayPal payout submission requires reconciliation.');
    }

    public function payoutBatch(string $id): array
    {
        if (! preg_match('/^[A-Z0-9]{5,64}$/', $id)) {
            throw new RuntimeException('Invalid PayPal payout reference.');
        }

        return $this->request('GET', '/v1/payments/payouts/'.$id.'?page_size=1000');
    }

    public function order(string $id): array
    {
        if (! preg_match('/^[A-Z0-9]{5,64}$/', $id)) {
            throw new RuntimeException('Invalid PayPal reference.');
        }

        return $this->request('GET', '/v2/checkout/orders/'.$id);
    }

    public function create(object $payment, string $amount, string $currency): array
    {
        return $this->request('POST', '/v2/checkout/orders', [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'reference_id' => (string) $payment->id,
                'custom_id' => (string) $payment->id,
                'amount' => ['currency_code' => $currency, 'value' => $amount],
                'payee' => ['merchant_id' => config('services.paypal.merchant_id')],
            ]],
        ], $payment->paypal_create_key);
    }

    public function capture(object $payment): array
    {
        return $this->request('POST', '/v2/checkout/orders/'.$payment->paypal_order_id.'/capture', [], $payment->paypal_capture_key);
    }

    /** Official verification API validates the transmission against the configured webhook ID. */
    public function verify(array $event, array $headers): bool
    {
        if (! config('services.paypal.webhook_id')) {
            return false;
        }
        foreach (['auth_algo', 'cert_url', 'transmission_id', 'transmission_sig', 'transmission_time'] as $name) {
            if (empty($headers[$name])) {
                return false;
            }
        }
        $result = $this->request('POST', '/v1/notifications/verify-webhook-signature', array_merge($headers, [
            'webhook_id' => config('services.paypal.webhook_id'), 'webhook_event' => $event,
        ]));

        return ($result['verification_status'] ?? null) === 'SUCCESS';
    }

    /** Exact cents; reject unsupported precision rather than round browser/provider values. */
    public function cents(mixed $amount): int
    {
        if (! is_scalar($amount) || ! preg_match('/^([0-9]{1,10})(?:\.([0-9]{1,2}))?$/', (string) $amount, $matches)) {
            throw new RuntimeException('Invalid payment amount.');
        }

        return ((int) $matches[1]) * 100 + (int) str_pad($matches[2] ?? '', 2, '0');
    }

    public function currency(object $payment): string
    {
        $currency = strtoupper($payment->currency ?: config('services.paypal.currency', 'CAD'));
        // Only explicitly supported two-decimal currencies; never silently convert a payment.
        if (! in_array($currency, ['CAD', 'USD', 'AUD', 'EUR', 'GBP', 'NZD'], true)) {
            abort(422, 'This payment currency is not supported by PayPal checkout.');
        }

        return $currency;
    }

    /** Bind the complete provider order to one database payment and the receiving merchant. */
    public function validateOrder(object $payment, array $order): array
    {
        $units = $order['purchase_units'] ?? [];
        if (($order['id'] ?? null) !== $payment->paypal_order_id || ($order['intent'] ?? null) !== 'CAPTURE' || count($units) !== 1) {
            throw new RuntimeException('PayPal order mismatch.');
        }
        $unit = $units[0];
        if (($unit['reference_id'] ?? null) !== (string) $payment->id || ($unit['custom_id'] ?? null) !== (string) $payment->id
            || ($unit['payee']['merchant_id'] ?? null) !== config('services.paypal.merchant_id')
            || ($unit['amount']['currency_code'] ?? null) !== $this->currency($payment)
            || $this->cents($unit['amount']['value'] ?? null) !== $this->cents($payment->total_amount)) {
            throw new RuntimeException('PayPal payment mismatch.');
        }

        return $unit;
    }
}
