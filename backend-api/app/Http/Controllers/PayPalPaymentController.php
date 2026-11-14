<?php

namespace App\Http\Controllers;

use App\Services\PayPalClient;
use App\Services\TaskPayments;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PayPalPaymentController extends Controller
{
    public function __construct(private readonly PayPalClient $paypal) {}

    public function checkout(Request $request, int $paymentId): JsonResponse
    {
        $validated = $request->validate(['stage' => ['required', 'in:commitment,balance']]);

        return DB::transaction(function () use ($request, $paymentId, $validated) {
            $payment = $this->customerPayment($request, $paymentId);
            abort_if(in_array($payment->status, ['blocked', 'refunded', 'failed'], true), 409, 'This payment requires administrator review.');
            $installment = DB::table('payment_installments')->where('payment_id', $paymentId)->where('stage', $validated['stage'])->lockForUpdate()->first();
            abort_unless($installment, 404);
            abort_if($installment->status === 'completed', 409, 'This installment has already been paid.');
            if ($installment->stage === 'balance') {
                abort_unless($payment->customer_confirmed_at && DB::table('payment_installments')->where('payment_id', $paymentId)->where('stage', 'commitment')->where('status', 'completed')->exists(), 409, 'Confirm completion before paying the remaining balance.');
            }
            if ($installment->paypal_order_id) {
                $order = $this->paypal->request('GET', 'v2/checkout/orders/'.$installment->paypal_order_id);
            } else {
                $merchant = config('services.paypal.merchant_id');
                abort_unless($merchant, 503, 'PayPal merchant account is not configured.');
                $frontend = rtrim(config('services.paypal.frontend_url'), '/');
                $order = $this->paypal->request('POST', 'v2/checkout/orders', [
                    'intent' => 'CAPTURE',
                    'purchase_units' => [[
                        'custom_id' => (string) $installment->id,
                        'invoice_id' => 'urban-'.$installment->request_id,
                        'description' => 'Task #'.$payment->task_id.' '.$installment->stage,
                        'payee' => ['merchant_id' => $merchant],
                        'amount' => ['currency_code' => $payment->currency, 'value' => TaskPayments::money($installment->amount_minor)],
                    ]],
                    'payment_source' => ['paypal' => ['experience_context' => [
                        'user_action' => 'PAY_NOW', 'shipping_preference' => 'NO_SHIPPING',
                        'return_url' => $frontend.'/payments/?paypal_payment='.$paymentId,
                        'cancel_url' => $frontend.'/payments/?paypal_cancelled=1',
                    ]]],
                ], $installment->request_id);
                abort_unless(! empty($order['id']), 502, 'PayPal did not return an order.');
                DB::table('payment_installments')->where('id', $installment->id)->update(['paypal_order_id' => $order['id'], 'updated_at' => now()]);
                $installment->paypal_order_id = $order['id'];
            }
            if (in_array($order['status'] ?? '', ['APPROVED', 'COMPLETED'], true)) {
                if ($order['status'] === 'APPROVED') {
                    $order = $this->paypal->request('POST', 'v2/checkout/orders/'.$installment->paypal_order_id.'/capture', [], 'capture-'.$installment->request_id);
                    $order = $this->paypal->request('GET', 'v2/checkout/orders/'.$installment->paypal_order_id);
                }
                $this->recordCapture($payment, $installment, $order);

                return response()->json(['success' => true, 'data' => ['confirmed' => true]]);
            }
            $url = collect($order['links'] ?? [])->first(fn ($link) => in_array($link['rel'], ['payer-action', 'approve'], true))['href'] ?? null;
            abort_unless($url && filter_var($url, FILTER_VALIDATE_URL) && preg_match('~^https://(?:www\.)?(?:sandbox\.)?paypal\.com/~', $url), 409, 'This order is awaiting capture or needs administrator review.');

            return response()->json(['success' => true, 'data' => ['url' => $url]]);
        });
    }

    public function capture(Request $request, int $paymentId): JsonResponse
    {
        $data = $request->validate(['order_id' => ['required', 'string', 'max:100']]);
        DB::transaction(function () use ($request, $paymentId, $data) {
            $payment = $this->customerPayment($request, $paymentId);
            $installment = DB::table('payment_installments')->where('payment_id', $paymentId)->where('paypal_order_id', $data['order_id'])->lockForUpdate()->first();
            abort_unless($installment, 404, 'Order not found.');
            abort_if($payment->status === 'blocked', 409, 'This payment requires administrator review.');
            $order = $this->paypal->request('GET', 'v2/checkout/orders/'.$data['order_id']);
            if (($order['status'] ?? '') === 'APPROVED') {
                $order = $this->paypal->request('POST', 'v2/checkout/orders/'.$data['order_id'].'/capture', [], 'capture-'.$installment->request_id);
                $order = $this->paypal->request('GET', 'v2/checkout/orders/'.$data['order_id']);
            }
            $this->recordCapture($payment, $installment, $order);
        });

        return response()->json(['success' => true, 'message' => 'PayPal payment verified. Helper earnings remain held until administrator release.']);
    }

    private function customerPayment(Request $request, int $paymentId): object
    {
        abort_unless($request->user()->role === 'customer', 403);
        $payment = DB::table('payments')->where('id', $paymentId)->where('customer_id', $request->user()->id)->where('provider', 'paypal')->lockForUpdate()->first();
        abort_unless($payment, 404, 'Payment not found.');

        return $payment;
    }

    private function recordCapture(object $payment, object $installment, array $order): void
    {
        $units = $order['purchase_units'] ?? [];
        $captures = $units[0]['payments']['captures'] ?? [];
        $capture = $captures[0] ?? [];
        if (! empty($capture['id'])) {
            $capture = $this->paypal->request('GET', 'v2/payments/captures/'.$capture['id']);
        }
        $valid = count($units) === 1 && count($captures) === 1
            && ($order['id'] ?? '') === $installment->paypal_order_id
            && ($order['status'] ?? '') === 'COMPLETED'
            && ($capture['status'] ?? '') === 'COMPLETED'
            && ($units[0]['custom_id'] ?? '') === (string) $installment->id
            && ! empty(config('services.paypal.merchant_id'))
            && ($units[0]['payee']['merchant_id'] ?? '') === config('services.paypal.merchant_id')
            && ($capture['amount']['currency_code'] ?? '') === $payment->currency
            && TaskPayments::minor($capture['amount']['value'] ?? 0) === (int) $installment->amount_minor
            && ! empty($capture['id']);
        abort_unless($valid, 409, 'PayPal has not confirmed an exact, completed payment to this platform.');
        if ($installment->status === 'completed') {
            return;
        }
        abort_unless($installment->status === 'pending', 409, 'This installment requires review.');
        $fee = $capture['seller_receivable_breakdown']['paypal_fee'] ?? null;
        abort_unless($fee && ($fee['currency_code'] ?? '') === $payment->currency, 409, 'PayPal fee details require review.');
        DB::table('payment_installments')->where('id', $installment->id)->update([
            'paypal_capture_id' => $capture['id'], 'status' => 'completed', 'paid_at' => now(), 'updated_at' => now(),
        ]);
        $allPaid = ! DB::table('payment_installments')->where('payment_id', $payment->id)->where('status', '!=', 'completed')->exists();
        DB::table('payments')->where('id', $payment->id)->update([
            'status' => $payment->status === 'blocked' ? 'blocked' : ($allPaid ? 'paid' : 'partially_paid'),
            'provider_fees' => (float) $payment->provider_fees + (float) $fee['value'],
            'paid_at' => $allPaid ? now() : null, 'updated_at' => now(),
        ]);
    }

    public function release(Request $request, int $payoutId): JsonResponse
    {
        abort_unless($request->user()->role === 'admin' && $request->user()->status === 'active', 403);
        $data = $request->validate([
            'customer_verified' => ['required', 'accepted'],
            'tax_amount' => ['required', 'numeric', 'min:0', 'max:99999999', 'decimal:0,2'],
        ]);

        return DB::transaction(function () use ($request, $payoutId, $data) {
            $initial = DB::table('payouts')->where('id', $payoutId)->first();
            abort_unless($initial, 404);
            $payment = DB::table('payments')->where('id', $initial->payment_id)->lockForUpdate()->first();
            $payout = DB::table('payouts')->where('id', $payoutId)->lockForUpdate()->first();
            abort_unless($payment && $payout->provider === 'paypal' && $payment->provider === 'paypal', 409);
            abort_unless($payment->status === 'paid' && $payment->customer_confirmed_at && DB::table('tasks')->where('id', $payment->task_id)->where('status', 'completed')->exists()
                && DB::table('payment_installments')->where('payment_id', $payment->id)->where('status', 'completed')->count() === 2, 409, 'Both payments and customer completion confirmation are required.');
            abort_if($payout->status !== 'pending', 409, 'This payout has already been submitted. Refresh its PayPal status instead.');
            $recipient = DB::table('users')->where('id', $payout->helper_id)->value('paypal_email');
            if (! $recipient) {
                throw ValidationException::withMessages(['paypal_email' => 'The Helper must save a PayPal payout email first.']);
            }
            DB::table('payments')->where('id', $payment->id)->update(['tax_amount' => $data['tax_amount'], 'updated_at' => now()]);
            DB::table('payouts')->where('id', $payoutId)->update([
                'status' => 'processing', 'paypal_recipient' => $recipient,
                'released_by' => $request->user()->id, 'released_at' => now(), 'updated_at' => now(),
            ]);

            return response()->json(['success' => true, 'message' => 'Release authorized. Submit the PayPal payout.', 'data' => ['payout_id' => $payoutId]]);
        });
    }

    public function sendPayout(Request $request, int $payoutId): JsonResponse
    {
        abort_unless($request->user()->role === 'admin' && $request->user()->status === 'active', 403);
        // Commit submission intent before contacting PayPal: an ambiguous response must never cause a second payout.
        $payout = DB::transaction(function () use ($payoutId) {
            $initial = DB::table('payouts')->where('id', $payoutId)->first();
            abort_unless($initial, 404);
            $payment = DB::table('payments')->where('id', $initial->payment_id)->lockForUpdate()->first();
            $row = DB::table('payouts')->where('id', $payoutId)->lockForUpdate()->first();
            abort_unless($row->provider === 'paypal' && $row->status === 'processing' && ! $row->processed_at && $payment->status === 'paid' && $payment->customer_confirmed_at, 409, 'Payout already submitted or requires review.');
            foreach (DB::table('payment_installments')->where('payment_id', $payment->id)->get() as $installment) {
                abort_unless($installment->status === 'completed' && $installment->paypal_capture_id, 409, 'Both installments must be paid.');
                $capture = $this->paypal->request('GET', 'v2/payments/captures/'.$installment->paypal_capture_id);
                abort_unless(($capture['status'] ?? '') === 'COMPLETED'
                    && ($capture['amount']['currency_code'] ?? '') === $payment->currency
                    && TaskPayments::minor($capture['amount']['value'] ?? 0) === (int) $installment->amount_minor,
                    409, 'A customer payment is no longer completed. Reconcile it before releasing earnings.');
            }
            DB::table('payouts')->where('id', $payoutId)->update(['processed_at' => now()]);

            return $row;
        });
        $result = $this->paypal->request('POST', 'v1/payments/payouts', [
            'sender_batch_header' => ['sender_batch_id' => 'urban-payout-'.$payout->id, 'email_subject' => 'Your UrbanHelpHub earnings'],
            'items' => [[
                'recipient_type' => 'EMAIL', 'receiver' => $payout->paypal_recipient,
                'amount' => ['value' => number_format((float) $payout->net_amount, 2, '.', ''), 'currency' => $payout->currency],
                'sender_item_id' => 'urban-payout-'.$payout->id,
            ]],
        ], 'urban-payout-'.$payout->id);
        $batchId = $result['batch_header']['payout_batch_id'] ?? null;
        abort_unless($batchId, 502, 'Submission outcome needs PayPal reconciliation. Do not resubmit.');
        DB::table('payouts')->where('id', $payoutId)->update(['provider_payout_id' => $batchId, 'updated_at' => now()]);

        return response()->json(['success' => true, 'message' => 'PayPal payout submitted. Payment is not marked paid until PayPal confirms success.']);
    }

    public function payoutStatus(Request $request, int $payoutId): JsonResponse
    {
        abort_unless($request->user()->role === 'admin' && $request->user()->status === 'active', 403);
        $payout = DB::table('payouts')->where('id', $payoutId)->where('provider', 'paypal')->first();
        abort_unless($payout && $payout->provider_payout_id, 409, 'No PayPal batch recorded. Await webhook reconciliation or check the PayPal dashboard; do not resubmit.');
        $batch = $this->paypal->request('GET', 'v1/payments/payouts/'.$payout->provider_payout_id.'?page_size=1000');
        foreach ($batch['items'] ?? [] as $item) {
            $this->recordPayout($item);
        }

        return response()->json(['success' => true, 'message' => 'PayPal payout status refreshed.']);
    }

    private function recordPayout(array $item): void
    {
        $senderId = $item['payout_item']['sender_item_id'] ?? '';
        if (! preg_match('/^urban-payout-(\d+)$/', $senderId, $match)) {
            return;
        }
        DB::transaction(function () use ($item, $match) {
            $payout = DB::table('payouts')->where('id', $match[1])->where('provider', 'paypal')->lockForUpdate()->first();
            if (! $payout || ! $payout->released_by || ! $payout->processed_at) {
                return;
            }
            $amount = $item['payout_item']['amount'] ?? [];
            abort_unless(($item['payout_item']['receiver'] ?? '') === $payout->paypal_recipient
                && ($amount['currency'] ?? '') === $payout->currency
                && TaskPayments::minor($amount['value'] ?? 0) === TaskPayments::minor($payout->net_amount), 409, 'Payout details do not match the authorized release.');
            $status = $item['transaction_status'] ?? '';
            $state = match ($status) {
                'SUCCESS' => 'paid',
                'FAILED', 'DENIED', 'RETURNED', 'REFUNDED', 'REVERSED', 'BLOCKED', 'CANCELED' => 'failed',
                default => 'processing',
            };
            $fee = $item['payout_item_fee'] ?? [];
            abort_if(isset($fee['currency']) && $fee['currency'] !== $payout->currency, 409, 'Payout fee currency requires reconciliation.');
            DB::table('payouts')->where('id', $payout->id)->update([
                'status' => $state, 'paypal_item_id' => $item['payout_item_id'],
                'provider_payout_id' => $item['payout_batch_id'] ?? $payout->provider_payout_id,
                'provider_fee' => $fee['value'] ?? 0,
                'paid_at' => $state === 'paid' ? ($payout->paid_at ?? now()) : null,
                'failed_at' => $state === 'failed' ? now() : null, 'updated_at' => now(),
            ]);
        });
    }

    public function webhook(Request $request): JsonResponse
    {
        abort_unless(config('services.paypal.webhook_id'), 503);
        $verified = $this->paypal->request('POST', 'v1/notifications/verify-webhook-signature', [
            'auth_algo' => $request->header('PAYPAL-AUTH-ALGO'), 'cert_url' => $request->header('PAYPAL-CERT-URL'),
            'transmission_id' => $request->header('PAYPAL-TRANSMISSION-ID'), 'transmission_sig' => $request->header('PAYPAL-TRANSMISSION-SIG'),
            'transmission_time' => $request->header('PAYPAL-TRANSMISSION-TIME'),
            'webhook_id' => config('services.paypal.webhook_id'), 'webhook_event' => $request->json()->all(),
        ]);
        abort_unless(($verified['verification_status'] ?? '') === 'SUCCESS', 400, 'Invalid PayPal webhook signature.');
        $type = $request->input('event_type', '');
        $resource = $request->input('resource', []);
        if (str_starts_with($type, 'PAYMENT.PAYOUTS-ITEM.') && ! empty($resource['payout_item_id'])) {
            $this->recordPayout($this->paypal->request('GET', 'v1/payments/payouts-item/'.$resource['payout_item_id']));
        } elseif ($type === 'PAYMENT.CAPTURE.COMPLETED') {
            $orderId = data_get($resource, 'supplementary_data.related_ids.order_id');
            $installment = DB::table('payment_installments')->where('paypal_order_id', $orderId)->first();
            if ($orderId && $installment) {
                DB::transaction(function () use ($installment, $orderId) {
                    $payment = DB::table('payments')->where('id', $installment->payment_id)->lockForUpdate()->first();
                    $locked = DB::table('payment_installments')->where('id', $installment->id)->lockForUpdate()->first();
                    $this->recordCapture($payment, $locked, $this->paypal->request('GET', 'v2/checkout/orders/'.$orderId));
                });
            }
        } elseif (in_array($type, ['PAYMENT.CAPTURE.REFUNDED', 'PAYMENT.CAPTURE.REVERSED', 'CUSTOMER.DISPUTE.CREATED'], true)) {
            $captureId = $type === 'CUSTOMER.DISPUTE.CREATED'
                ? data_get($resource, 'disputed_transactions.0.seller_transaction_id')
                : (data_get($resource, 'supplementary_data.related_ids.capture_id') ?: ($type === 'PAYMENT.CAPTURE.REVERSED' ? ($resource['id'] ?? null) : null));
            if (! $captureId && $type === 'PAYMENT.CAPTURE.REFUNDED') {
                foreach ($resource['links'] ?? [] as $link) {
                    if (($link['rel'] ?? '') === 'up' && preg_match('~^https://api(?:-m)?(?:\.sandbox)?\.paypal\.com/v2/payments/captures/([A-Za-z0-9]+)$~', $link['href'] ?? '', $match)) {
                        $captureId = $match[1];
                    }
                }
            }
            if ($captureId) {
                $installment = DB::table('payment_installments')->where('paypal_capture_id', $captureId)->first();
                if (! $installment) {
                    $capture = $this->paypal->request('GET', 'v2/payments/captures/'.$captureId);
                    $orderId = data_get($capture, 'supplementary_data.related_ids.order_id');
                    $installment = $orderId ? DB::table('payment_installments')->where('paypal_order_id', $orderId)->first() : null;
                }
                if ($installment) {
                    DB::table('payments')->where('id', $installment->payment_id)->update(['status' => 'blocked', 'updated_at' => now()]);
                }
            }
        }

        return response()->json(['received' => true]);
    }

    public function payoutEmail(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'helper', 403);
        if ($request->isMethod('put')) {
            $data = $request->validate(['paypal_email' => ['required', 'email:rfc', 'max:254']]);
            DB::table('users')->where('id', $request->user()->id)->update(['paypal_email' => $data['paypal_email'], 'updated_at' => now()]);
        }

        return response()->json(['success' => true, 'data' => ['paypal_email' => DB::table('users')->where('id', $request->user()->id)->value('paypal_email')]]);
    }
}
