<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Http;

class PayPalClient
{
    public function request(string $method, string $path, array $data = [], ?string $requestId = null): array
    {
        $id = config('services.paypal.client_id');
        $secret = config('services.paypal.client_secret');
        if (! $id || ! $secret) {
            throw new HttpResponseException(response()->json(['message' => 'PayPal credentials are not configured.'], 503));
        }
        $mode = config('services.paypal.mode');
        if (! in_array($mode, ['sandbox', 'live'], true)) {
            throw new HttpResponseException(response()->json(['message' => 'Invalid PayPal environment.'], 503));
        }
        $base = $mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
        try {
            $token = Http::timeout(30)->asForm()->withBasicAuth($id, $secret)
                ->post($base.'/v1/oauth2/token', ['grant_type' => 'client_credentials'])->throw()->json('access_token');
            if (! $token) {
                throw new HttpResponseException(response()->json(['message' => 'PayPal authentication failed.'], 502));
            }
            $http = Http::timeout(30)->acceptJson()->withToken($token);
            if ($requestId) {
                $http = $http->withHeaders(['PayPal-Request-Id' => $requestId]);
            }

            return $http->send($method, $base.'/'.$path, $data ? ['json' => $data] : [])->throw()->json() ?? [];
        } catch (RequestException|ConnectionException $exception) {
            report($exception);
            throw new HttpResponseException(response()->json(['message' => 'PayPal could not confirm this request. Refresh its status before retrying; contact support if it remains unresolved.'], 502));
        }
    }
}
