<?php

namespace App\Http\Controllers;

use App\Services\AccountEmailConfirmation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountEmailConfirmationController extends Controller
{
    public function confirm(Request $request, AccountEmailConfirmation $confirmation): JsonResponse
    {
        $input = $request->validate(['token' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/D']]);
        $user = $confirmation->confirm($input['token']);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'This confirmation link is invalid, expired, or already used. You can request a new link below or sign in if you already confirmed your email.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email confirmed.',
            'activation_pending' => $user->role === 'admin' && $user->status !== 'active',
        ]);
    }

    public function resend(Request $request, AccountEmailConfirmation $confirmation): JsonResponse
    {
        $input = $request->validate(['email' => ['required', 'email', 'max:255']]);
        $confirmation->resend($input['email']);

        return response()->json([
            'success' => true,
            'message' => 'If a matching account is waiting for confirmation, check your inbox and spam folder. Allow a few minutes for delivery.',
        ]);
    }
}
