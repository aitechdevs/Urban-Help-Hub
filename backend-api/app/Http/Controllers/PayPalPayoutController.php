<?php

namespace App\Http\Controllers;

use App\Services\PayPalPayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class PayPalPayoutController extends Controller
{
    public function __construct(private readonly PayPalPayoutService $payouts) {}

    public function account(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'helper' && $request->user()->status === 'active', 403);
        $account = DB::table('paypal_payout_accounts')->where('helper_id', $request->user()->id)->first();

        return response()->json(['success' => true, 'data' => ['email' => $account ? Crypt::decryptString($account->recipient) : null]])->header('Cache-Control', 'no-store');
    }

    public function saveAccount(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'helper' && $request->user()->status === 'active', 403);
        $input = $request->validate(['email' => ['required', 'email:rfc', 'max:254'], 'password' => ['required', 'string', 'max:1024']]);
        if (! Hash::check($input['password'], $request->user()->password)) {
            throw ValidationException::withMessages(['password' => 'The account password is incorrect.']);
        }
        DB::transaction(function () use ($request, $input) {
            DB::table('users')->where('id', $request->user()->id)->lockForUpdate()->first();
            $existing = DB::table('paypal_payout_accounts')->where('helper_id', $request->user()->id)->lockForUpdate()->first();
            $values = ['recipient' => Crypt::encryptString(strtolower(trim($input['email']))), 'updated_at' => now()];
            if ($existing) {
                DB::table('paypal_payout_accounts')->where('id', $existing->id)->update($values);
            } else {
                DB::table('paypal_payout_accounts')->insert($values + ['helper_id' => $request->user()->id, 'created_at' => now()]);
            }
        });

        return response()->json(['success' => true, 'message' => 'PayPal payout email saved. Existing approved transfers retain their original recipient.']);
    }

    public function approve(Request $request, int $payoutId): JsonResponse
    {
        $input = $request->validate(['account_version' => ['required', 'string', 'regex:/^[a-f0-9]{64}$/']]);

        return $this->safe($payoutId, fn () => $this->payouts->approve($payoutId, (int) $request->user()->id, $input['account_version']));
    }

    public function reconcile(Request $request, int $payoutId): JsonResponse
    {
        return $this->safe($payoutId, fn () => $this->payouts->reconcile($payoutId));
    }

    private function safe(int $payoutId, callable $action): JsonResponse
    {
        try {
            return response()->json(['success' => true, 'data' => $action()])->header('Cache-Control', 'no-store');
        } catch (HttpExceptionInterface $exception) {
            return response()->json(['success' => false, 'message' => $exception->getMessage()], $exception->getStatusCode());
        } catch (Throwable) {
            Log::warning('paypal.payout_reconciliation_required', ['payout_id' => $payoutId]);

            return response()->json(['success' => false, 'message' => 'Transfer is not confirmed. Check its existing status; do not send a replacement.'], 503);
        }
    }
}
