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
        abort_if($mode === 'live' && !config('services.paypal.live_direct_model_approved'), 409, 'Live direct collection is disabled.');
        $base = $mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
        try {
            $token = Http::timeout(30)->asForm()->withBasicAuth($id, $secret)
                ->post($base.'/v1/oauth2/token', ['grant_type' => 'client_credentials'])->throw()->json('access_token');
            if (! $token) {
                throw new HttpResponseException(response()->json(['message' => 'PayPal authentication failed.'], 502));
            }
            $http = Http::timeout(30)->asJson()->acceptJson()->withToken($token);
            if ($requestId) {
                $http = $http->withHeaders(['PayPal-Request-Id' => $requestId]);
            }

            $options = $method === 'POST' ? ['json' => $data ?: (object) []] : [];

            return $http->send($method, $base.'/'.$path, $options)->throw()->json() ?? [];
        } catch (RequestException|ConnectionException) {
            throw new HttpResponseException(response()->json(['message' => 'PayPal could not confirm this request. Refresh its status before retrying; contact support if it remains unresolved.'], 502));
        }
    }
}
