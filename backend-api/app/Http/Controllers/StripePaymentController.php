<?php

namespace App\Http\Controllers;

use App\Services\StripeClient;
use App\Support\InAppNotification;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class StripePaymentController extends Controller
{
    public function __construct(private readonly StripeClient $stripe) {}

    public function checkout(Request $request, int $paymentId): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'customer') {
            return response()->json(['success' => false, 'message' => 'Only the Customer can pay for a task.'], 403);
        }

        $payment = DB::table('payments')->where('id', $paymentId)->first();
        if (!$payment || (int) $payment->customer_id !== (int) $user->id) {
            return response()->json(['success' => false, 'message' => 'Payment not found.'], 404);
        }
        if ($payment->status === 'paid') {
            return response()->json(['success' => false, 'message' => 'This payment has already been completed.'], 409);
        }

        $helper = DB::table('users')->where('id', $payment->helper_id)->first();
        if (!$helper || !$helper->stripe_account_id || !$helper->stripe_payouts_enabled) {
            return response()->json(['success' => false, 'message' => 'The Helper must finish Stripe payout setup before payment can be collected.'], 409);
        }

        try {
            if ($payment->stripe_checkout_session_id) {
                $existing = $this->stripe->request('GET', 'checkout/sessions/'.$payment->stripe_checkout_session_id);
                if (($existing['status'] ?? null) === 'open' && !empty($existing['url'])) {
                    return response()->json(['success' => true, 'data' => ['url' => $existing['url']]]);
                }
                if (($existing['payment_status'] ?? null) === 'paid') {
                    return response()->json(['success' => false, 'message' => 'Stripe has already received this payment. Confirmation is being processed.'], 409);
                }
            }

            $task = DB::table('tasks')->where('id', $payment->task_id)->first();
            $total = $this->minorUnits($payment->total_amount, $payment->currency);
            $fee = $this->minorUnits($payment->platform_fee, $payment->currency);
            if ($total < 50 || $fee < 0 || $fee >= $total) {
                return response()->json(['success' => false, 'message' => 'The payment amount is not valid for Stripe checkout.'], 422);
            }

            $idempotencyKey = 'checkout-'.$payment->id.'-'.Str::uuid();
            $frontend = (string) config('services.stripe.frontend_url');
            $session = $this->stripe->request('POST', 'checkout/sessions', [
                'mode' => 'payment',
                'success_url' => $frontend.'/dashboard/?payment=success&session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => $frontend.'/dashboard/?payment=cancelled',
                'customer_email' => $user->email,
                'client_reference_id' => (string) $payment->id,
                'line_items[0][quantity]' => 1,
                'line_items[0][price_data][currency]' => strtolower($payment->currency),
                'line_items[0][price_data][unit_amount]' => $total,
                'line_items[0][price_data][product_data][name]' => 'UrbanHelpHub: '.($task->title ?? 'Completed service'),
                'line_items[0][price_data][product_data][description]' => 'Payment for completed task #'.$payment->task_id,
                'metadata[payment_id]' => (string) $payment->id,
                'metadata[task_id]' => (string) $payment->task_id,
                'payment_intent_data[metadata][payment_id]' => (string) $payment->id,
                'payment_intent_data[metadata][task_id]' => (string) $payment->task_id,
                'payment_intent_data[application_fee_amount]' => $fee,
                'payment_intent_data[transfer_data][destination]' => $helper->stripe_account_id,
            ], $idempotencyKey);

            DB::table('payments')->where('id', $payment->id)->update([
                'provider' => 'stripe',
                'stripe_checkout_session_id' => $session['id'],
                'checkout_idempotency_key' => $idempotencyKey,
                'failure_reason' => null,
                'updated_at' => now(),
            ]);

            return response()->json(['success' => true, 'data' => ['url' => $session['url']]]);
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['success' => false, 'message' => $exception->getMessage()], 502);
        }
    }

    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        if (!$this->validSignature($payload, (string) $request->header('Stripe-Signature'))) {
            return response()->json(['received' => false, 'message' => 'Invalid Stripe signature.'], 400);
        }

        $event = json_decode($payload, true);
        if (!is_array($event) || empty($event['id']) || empty($event['type'])) {
            return response()->json(['received' => false, 'message' => 'Invalid Stripe event.'], 400);
        }

        $row = DB::table('stripe_webhook_events')->where('stripe_event_id', $event['id'])->first();
        if ($row && $row->status === 'processed') return response()->json(['received' => true]);

        if (!$row) {
            try {
                DB::table('stripe_webhook_events')->insert([
                    'stripe_event_id' => $event['id'], 'type' => $event['type'],
                    'status' => 'processing', 'created_at' => now(), 'updated_at' => now(),
                ]);
            } catch (QueryException) {
                return response()->json(['received' => true]);
            }
        }

        try {
            $this->processEvent($event['type'], $event['data']['object'] ?? []);
            DB::table('stripe_webhook_events')->where('stripe_event_id', $event['id'])->update([
                'status' => 'processed', 'processed_at' => now(), 'failure_reason' => null, 'updated_at' => now(),
            ]);
            return response()->json(['received' => true]);
        } catch (Throwable $exception) {
            report($exception);
            DB::table('stripe_webhook_events')->where('stripe_event_id', $event['id'])->update([
                'status' => 'failed', 'failure_reason' => Str::limit($exception->getMessage(), 1900), 'updated_at' => now(),
            ]);
            return response()->json(['received' => false], 500);
        }
    }

    private function processEvent(string $type, array $object): void
    {
        if (in_array($type, ['checkout.session.completed', 'checkout.session.async_payment_succeeded'], true)) {
            $paymentId = (int) ($object['metadata']['payment_id'] ?? $object['client_reference_id'] ?? 0);
            if (!$paymentId || ($object['payment_status'] ?? null) !== 'paid') return;
            $intentId = is_string($object['payment_intent'] ?? null) ? $object['payment_intent'] : null;
            $intent = $intentId ? $this->stripe->request('GET', 'payment_intents/'.$intentId, ['expand[]' => 'latest_charge']) : [];
            $charge = is_array($intent['latest_charge'] ?? null) ? $intent['latest_charge'] : [];
            $transferId = is_string($charge['transfer'] ?? null) ? $charge['transfer'] : null;

            DB::transaction(function () use ($paymentId, $intentId, $transferId) {
                $payment = DB::table('payments')->where('id', $paymentId)->lockForUpdate()->first();
                if (!$payment || $payment->status === 'paid') return;
                DB::table('payments')->where('id', $paymentId)->update([
                    'provider' => 'stripe', 'provider_payment_id' => $intentId,
                    'status' => 'paid', 'paid_at' => now(), 'failed_at' => null,
                    'failure_reason' => null, 'updated_at' => now(),
                ]);
                $helper = DB::table('users')->where('id', $payment->helper_id)->first();
                DB::table('payouts')->where('payment_id', $paymentId)->update([
                    'provider' => 'stripe', 'provider_payout_id' => $transferId,
                    'provider_account_id' => $helper->stripe_account_id ?? null,
                    'status' => 'paid', 'processed_at' => now(), 'paid_at' => now(),
                    'failed_at' => null, 'failure_reason' => null, 'updated_at' => now(),
                ]);
                InAppNotification::send((int) $payment->customer_id, 'payment_paid', 'Payment received', 'Your task payment was completed securely.', '/dashboard', ['payment_id' => $paymentId, 'task_id' => $payment->task_id]);
                InAppNotification::send((int) $payment->helper_id, 'payout_paid', 'Earnings transferred', 'Your earnings were transferred to your Stripe balance.', '/helper/earnings/', ['payment_id' => $paymentId, 'task_id' => $payment->task_id]);
            });
            return;
        }

        if (in_array($type, ['checkout.session.async_payment_failed', 'payment_intent.payment_failed'], true)) {
            $paymentId = (int) ($object['metadata']['payment_id'] ?? 0);
            if ($paymentId) DB::table('payments')->where('id', $paymentId)->update([
                'status' => 'failed', 'failed_at' => now(),
                'failure_reason' => data_get($object, 'last_payment_error.message', 'Stripe payment failed.'),
                'updated_at' => now(),
            ]);
            return;
        }

        if ($type === 'checkout.session.expired') {
            $paymentId = (int) ($object['metadata']['payment_id'] ?? 0);
            if ($paymentId) DB::table('payments')->where('id', $paymentId)->where('status', 'pending')->update([
                'stripe_checkout_session_id' => null, 'checkout_idempotency_key' => null, 'updated_at' => now(),
            ]);
            return;
        }

        if ($type === 'account.updated' && !empty($object['id'])) {
            DB::table('users')->where('stripe_account_id', $object['id'])->update([
                'stripe_details_submitted' => (bool) ($object['details_submitted'] ?? false),
                'stripe_charges_enabled' => (bool) ($object['charges_enabled'] ?? false),
                'stripe_payouts_enabled' => (bool) ($object['payouts_enabled'] ?? false),
                'updated_at' => now(),
            ]);
        }
    }

    private function validSignature(string $payload, string $header): bool
    {
        $secret = (string) config('services.stripe.webhook_secret');
        if ($secret === '' || $header === '') return false;
        $parts = [];
        foreach (explode(',', $header) as $part) {
            [$key, $value] = array_pad(explode('=', trim($part), 2), 2, null);
            if ($key && $value) $parts[$key][] = $value;
        }
        $timestamp = (int) ($parts['t'][0] ?? 0);
        if (!$timestamp || abs(time() - $timestamp) > 300) return false;
        $expected = hash_hmac('sha256', $timestamp.'.'.$payload, $secret);
        foreach ($parts['v1'] ?? [] as $signature) if (hash_equals($expected, $signature)) return true;
        return false;
    }

    private function minorUnits(float|string $amount, string $currency): int
    {
        $zeroDecimal = ['BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF'];
        return (int) round((float) $amount * (in_array(strtoupper($currency), $zeroDecimal, true) ? 1 : 100));
    }
}
