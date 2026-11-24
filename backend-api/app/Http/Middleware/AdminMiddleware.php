<?php

namespace App\Http\Middleware;

use App\Http\Controllers\PayPalPaymentController;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Allow only authenticated, active UrbanHelpHub administrators.
     */
    public function handle(
        Request $request,
        Closure $next
    ): Response|JsonResponse {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication is required.',
            ], 401);
        }

        $payoutActions = [
            PayPalPaymentController::class.'@release',
            PayPalPaymentController::class.'@sendPayout',
            PayPalPaymentController::class.'@payoutStatus',
        ];
        $superAdminPayout = $user->role === 'super_admin'
            && in_array($request->route()?->getActionName(), $payoutActions, true);

        if ($user->role !== 'admin' && !$superAdminPayout) {
            return response()->json([
                'success' => false,
                'message' => 'Administrator access is required.',
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'This administrator account is not active.',
            ], 403);
        }

        return $next($request);
    }
}