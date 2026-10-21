<?php

namespace App\Http\Middleware;

use App\Services\FinalApprovalEmail;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class QueueFinalApprovalEmail
{
    public function handle(Request $request, Closure $next): Response
    {
        // This middleware is added after the existing authentication and Admin guards.
        if (!$request->user() || $request->user()->role !== 'admin' || $request->user()->status !== 'active') return $next($request);
        $action = $request->route()->getActionName();
        $isHelper = str_ends_with($action, 'AdminController@updateVerification');
        $changeId = (int) $request->route('changeId');
        $userId = $isHelper ? (int) $request->route('userId')
            : (int) DB::table('customer_profile_changes')->where('id', $changeId)->value('user_id');
        if (!$userId) return $next($request);
        return DB::transaction(function () use ($request, $next, $isHelper, $changeId, $userId) {
            // Serialize approval transitions to avoid duplicate emails from repeated clicks.
            DB::table('users')->where('id', $userId)->lockForUpdate()->first();
            $before = $isHelper
                ? DB::table('profiles')->where('user_id', $userId)->value('verification_status')
                : DB::table('customer_profile_changes')->where('id', $changeId)->value('status');
            $response = $next($request);
            $json = json_decode((string) $response->getContent(), true);
            if (!$response->isSuccessful() || !($json['success'] ?? false)) return $response;
            if ($isHelper && $before !== 'verified'
                && DB::table('profiles')->where('user_id', $userId)->value('verification_status') === 'verified') {
                FinalApprovalEmail::helper($userId);
            } elseif (!$isHelper && $before === 'pending'
                && DB::table('customer_profile_changes')->where('id', $changeId)->value('status') === 'approved') {
                FinalApprovalEmail::customer($changeId);
            }
            return $response;
        }, 3);
    }
}
