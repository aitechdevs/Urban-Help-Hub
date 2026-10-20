<?php

namespace App\Http\Middleware;

use App\Services\ReusableHelperIdentity;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class OneHelperIdentity
{
    public function handle(Request $request, Closure $next): Response
    {
        $action = $request->route()->getActionName();
        $type = strtolower((string) $request->input('document_type', ''));
        $identity = in_array($type, ReusableHelperIdentity::TYPES, true);
        $driving = in_array($type, ReusableHelperIdentity::DRIVING_TYPES, true);
        if (str_ends_with($action, '@uploadDocument')
            && $request->user() && $request->user()->role === 'helper') {
            if (!$identity && !$driving) return response()->json(['success' => false, 'message' => 'Upload one government photo ID. Separate service documents are no longer requested.'], 422);
            return DB::transaction(function () use ($request, $next) {
                DB::table('users')->where('id', $request->user()->id)->lockForUpdate()->first();
                $existing = ReusableHelperIdentity::existing((int) $request->user()->id);
                if ($existing) return response()->json(['success' => false,
                    'message' => 'Your identity document is already provided and reused across all services. A replacement is allowed after rejection or expiry.',
                ], 409);
                $request->merge(['document_type' => 'identity_document', 'service_category_id' => null]);
                $response = $next($request);
                if ($response->isSuccessful() && method_exists($response, 'getData') && method_exists($response, 'setData')) {
                    $json = $response->getData(true);
                    if ($json['success'] ?? false) {
                        $json['message'] = 'Identity document submitted for Admin review. Your profile, service approvals and availability have been kept; no application resubmission is needed.';
                        $response->setData($json);
                    }
                }
                return $response;
            }, 3);
        }
        $response = $next($request);
        if ($request->isMethod('GET') && $response->isSuccessful()) {
            $json = json_decode((string) $response->getContent(), true);
            if (($json['success'] ?? false) && isset($json['data']['documents']) && is_array($json['data']['documents'])) {
                $primary = ReusableHelperIdentity::primary($json['data']['documents']);
                $json['data']['documents'] = ReusableHelperIdentity::visible($json['data']['documents']);
                $json['data']['identity_upload'] = [
                    'provided' => $primary && ReusableHelperIdentity::usable($primary),
                    'status' => $primary['verification_status'] ?? null,
                    'document_id' => $primary['id'] ?? null,
                ];
                if (method_exists($response, 'setData')) $response->setData($json);
                else $response->setContent(json_encode($json));
            }
        }
        return $response;
    }
}
