<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class StripeClient
{
    public function request(string $method, string $path, array $data = [], ?string $idempotencyKey = null): array
    {
        $secret = (string) config('services.stripe.secret');
        if ($secret === '') {
            throw new RuntimeException('Stripe is not configured. Add STRIPE_SECRET_KEY to the server environment.');
        }

        $request = Http::asForm()
            ->acceptJson()
            ->withToken($secret)
            ->withHeaders(['Stripe-Version' => (string) config('services.stripe.api_version')]);

        if ($idempotencyKey) {
            $request = $request->withHeaders(['Idempotency-Key' => $idempotencyKey]);
        }

        $url = 'https://api.stripe.com/v1/'.ltrim($path, '/');
        $response = $this->send($request, strtoupper($method), $url, $data);

        if (!$response->successful()) {
            $message = $response->json('error.message') ?: 'Stripe rejected the request.';
            throw new RuntimeException($message);
        }

        return $response->json();
    }

    private function send(PendingRequest $request, string $method, string $url, array $data)
    {
        return match ($method) {
            'GET' => $request->get($url, $data),
            'POST' => $request->post($url, $data),
            default => throw new RuntimeException('Unsupported Stripe request method.'),
        };
    }
}
