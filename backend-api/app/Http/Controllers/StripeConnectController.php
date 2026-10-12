<?php

namespace App\Http\Controllers;

use App\Services\StripeClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class StripeConnectController extends Controller
{
    public function __construct(private readonly StripeClient $stripe) {}

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'helper') {
            return response()->json(['success' => false, 'message' => 'Only Helpers can connect a payout account.'], 403);
        }

        if (!$user->stripe_account_id) {
            return $this->statusResponse($user);
        }

        try {
            $account = $this->stripe->request('GET', 'accounts/'.$user->stripe_account_id);
            $this->syncAccount($user->id, $account);
            $user->refresh();
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['success' => false, 'message' => 'Unable to verify the Stripe payout account right now.'], 502);
        }

        return $this->statusResponse($user);
    }

    public function onboardingLink(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'helper') {
            return response()->json(['success' => false, 'message' => 'Only Helpers can connect a payout account.'], 403);
        }

        try {
            $accountId = $user->stripe_account_id;
            if (!$accountId) {
                $country = strtoupper((string) ($user->country_code ?: 'CA'));
                if (!preg_match('/^[A-Z]{2}$/', $country)) $country = 'CA';

                $account = $this->stripe->request('POST', 'accounts', [
                    'type' => 'express',
                    'country' => $country,
                    'email' => $user->email,
                    'capabilities[card_payments][requested]' => 'true',
                    'capabilities[transfers][requested]' => 'true',
                    'business_type' => 'individual',
                    'metadata[user_id]' => (string) $user->id,
                    'metadata[platform]' => 'UrbanHelpHub',
                ], 'connect-account-'.$user->id);
                $accountId = $account['id'];
                DB::table('users')->where('id', $user->id)->update([
                    'stripe_account_id' => $accountId,
                    'updated_at' => now(),
                ]);
            }

            $frontend = (string) config('services.stripe.frontend_url');
            $link = $this->stripe->request('POST', 'account_links', [
                'account' => $accountId,
                'refresh_url' => $frontend.'/helper/dashboard/?stripe=refresh',
                'return_url' => $frontend.'/helper/dashboard/?stripe=return',
                'type' => 'account_onboarding',
            ]);

            return response()->json(['success' => true, 'data' => ['url' => $link['url']]]);
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['success' => false, 'message' => $exception->getMessage()], 502);
        }
    }

    public function dashboardLink(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'helper' || !$user->stripe_account_id) {
            return response()->json(['success' => false, 'message' => 'Connect Stripe before opening the payout dashboard.'], 409);
        }

        try {
            $link = $this->stripe->request('POST', 'accounts/'.$user->stripe_account_id.'/login_links');
            return response()->json(['success' => true, 'data' => ['url' => $link['url']]]);
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['success' => false, 'message' => $exception->getMessage()], 502);
        }
    }

    private function syncAccount(int $userId, array $account): void
    {
        DB::table('users')->where('id', $userId)->update([
            'stripe_details_submitted' => (bool) ($account['details_submitted'] ?? false),
            'stripe_charges_enabled' => (bool) ($account['charges_enabled'] ?? false),
            'stripe_payouts_enabled' => (bool) ($account['payouts_enabled'] ?? false),
            'updated_at' => now(),
        ]);
    }

    private function statusResponse($user): JsonResponse
    {
        $ready = (bool) ($user->stripe_details_submitted && $user->stripe_charges_enabled && $user->stripe_payouts_enabled);
        return response()->json(['success' => true, 'data' => [
            'connected' => (bool) $user->stripe_account_id,
            'details_submitted' => (bool) $user->stripe_details_submitted,
            'charges_enabled' => (bool) $user->stripe_charges_enabled,
            'payouts_enabled' => (bool) $user->stripe_payouts_enabled,
            'ready' => $ready,
        ]]);
    }
}
