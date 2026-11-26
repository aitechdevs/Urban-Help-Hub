<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AccountEmailConfirmation;
use App\Support\TaskMatching;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const COUNTRY_CURRENCIES = [
        'AU' => 'AUD',
        'CA' => 'CAD',
        'GH' => 'GHS',
        'IE' => 'EUR',
        'IN' => 'INR',
        'KE' => 'KES',
        'NG' => 'NGN',
        'NZ' => 'NZD',
        'ZA' => 'ZAR',
        'AE' => 'AED',
        'GB' => 'GBP',
        'US' => 'USD',
    ];

    private const COUNTRY_LANGUAGES = [
        'AU' => ['en'],
        'CA' => ['en', 'fr'],
        'GH' => ['en'],
        'IE' => ['en', 'ga'],
        'IN' => ['en', 'hi'],
        'KE' => ['en', 'sw'],
        'NG' => ['en'],
        'NZ' => ['en'],
        'ZA' => ['en'],
        'AE' => ['ar', 'en'],
        'GB' => ['en'],
        'US' => ['en'],
    ];

    public function register(Request $request, AccountEmailConfirmation $confirmation): JsonResponse
    {
        $email = $request->input('email');
        if (is_string($email)) {
            $request->merge(['email' => strtolower(trim($email))]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],

            'role' => [
                'required',
                Rule::in(['customer', 'helper']),
            ],
        ]);

        $user = DB::transaction(function () use ($validated, $confirmation): User {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'password' => $validated['password'],
                'role' => $validated['role'],
                'status' => 'active',
            ]);
            $confirmation->start($user);

            return $user;
        }, 3);

        return response()->json([
            'success' => true,
            'message' => 'Account created. Check your email to confirm your address before signing in.',
            'data' => ['email_confirmation_required' => true, 'user' => $user],
        ], 201);
    }

    public function login(Request $request, AccountEmailConfirmation $confirmation): JsonResponse
    {
        $validated = $request->validate([
            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = User::where(
            'email',
            strtolower($validated['email'])
        )->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [
                    'The provided email address or password is incorrect.',
                ],
            ]);
        }

        if ($confirmation->isPending($user)) {
            return response()->json([
                'success' => false,
                'code' => 'email_confirmation_required',
                'message' => 'Confirm your email address before signing in.',
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'This account is not currently active.',
            ], 403);
        }

        $user->forceFill([
            'last_login_at' => now(),
        ])->save();

        $token = $user->createToken('urbanhelphub-web')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => $user,
                'token' => $token,
            ],
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'user' => $request->user(),
            ],
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'country_code' => ['required', 'string', Rule::in(array_keys(self::COUNTRY_CURRENCIES))],
            'language_code' => ['nullable', 'string', 'max:10'],
        ]);

        $countryCode = strtoupper($validated['country_code']);
        $allowedLanguages = self::COUNTRY_LANGUAGES[$countryCode];
        $languageCode = strtolower($validated['language_code'] ?? $allowedLanguages[0]);

        if (!in_array($languageCode, $allowedLanguages, true)) {
            throw ValidationException::withMessages([
                'language_code' => ['Please choose a supported official language for this country.'],
            ]);
        }

        $user = $request->user();
        $user->forceFill([
            'country_code' => $countryCode,
            'currency_code' => $user->role === 'admin' ? 'CAD' : self::COUNTRY_CURRENCIES[$countryCode],
            'language_code' => $languageCode,
        ])->save();

        if ($user->role === 'helper' && $user->wasChanged('currency_code')) {
            TaskMatching::offerOpenTasks($user->id);
        }

        return response()->json([
            'success' => true,
            'message' => 'Country and currency preferences updated.',
            'data' => ['user' => $user->fresh()],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }
}
