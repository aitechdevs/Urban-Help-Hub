<?php

namespace App\Http\Controllers;

use App\Services\PayPalPayoutService;
use App\Services\PayPalService;
use App\Support\InAppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class PayPalController extends Controller
{
    public function __construct(private readonly PayPalService $paypal) {}

    public function configuration(Request $request, int $paymentId): JsonResponse
    {
        $payment = $this->ownedPayment($request, $paymentId);

        return $this->safe($paymentId, function () use ($payment) {
            $this->payable($payment);
            $this->paypal->mode();

            return ['client_id' => config('services.paypal.client_id'), 'currency' => $this->paypal->currency($payment), 'mode' => $this->paypal->mode()];
        });
    }

    public function createOrder(Request $request, int $paymentId): JsonResponse
    {
        $this->ownedPayment($request, $paymentId);

        return $this->safe($paymentId, function () use ($paymentId) {
            // Commit the request keys BEFORE contacting PayPal: a timeout must not generate a new charge intent.
            DB::transaction(function () use ($paymentId) {
                $payment = DB::table('payments')->where('id', $paymentId)->lockForUpdate()->first();
                $this->payable($payment);
                if (! $payment->paypal_create_key) {
                    DB::table('payments')->where('id', $paymentId)->update([
                        'paypal_mode' => $this->paypal->mode(), 'paypal_create_key' => (string) Str::uuid(),
                        'paypal_capture_key' => (string) Str::uuid(), 'paypal_started_at' => now(), 'updated_at' => now(),
                    ]);
                }
            });

            return DB::transaction(function () use ($paymentId) {
                $payment = DB::table('payments')->where('id', $paymentId)->lockForUpdate()->first();
                $this->payable($payment);
                if ($payment->paypal_order_id) {
                    $order = $this->paypal->order($payment->paypal_order_id);
                } else {
                    // Default PayPal idempotency retention is finite. Never retry an ambiguous old create.
                    abort_if(now()->diffInMinutes($payment->paypal_started_at, true) >= 300, 409, 'Payment requires reconciliation. Please contact support.');
                    $order = $this->paypal->create($payment, number_format($this->paypal->cents($payment->total_amount) / 100, 2, '.', ''), $this->paypal->currency($payment));
                    if (! preg_match('/^[A-Z0-9]{5,64}$/', $order['id'] ?? '')) {
                        throw new RuntimeException('Invalid PayPal order.');
                    }
                    $payment->paypal_order_id = $order['id'];
                }
                $this->paypal->validateOrder($payment, $order);
                abort_unless(in_array($order['status'] ?? null, ['CREATED', 'APPROVED', 'PAYER_ACTION_REQUIRED'], true), 409, 'Payment requires reconciliation. Please contact support.');
                DB::table('payments')->where('id', $paymentId)->update(['provider' => 'paypal', 'paypal_order_id' => $payment->paypal_order_id, 'updated_at' => now()]);

                return ['order_id' => $payment->paypal_order_id];
            });
        });
    }

    public function capture(Request $request, int $paymentId): JsonResponse
    {
        $input = $request->validate(['order_id' => ['required', 'string', 'regex:/^[A-Z0-9]{5,64}$/']]);
        $this->ownedPayment($request, $paymentId);

        return $this->safe($paymentId, fn () => DB::transaction(function () use ($paymentId, $input) {
            $payment = DB::table('payments')->where('id', $paymentId)->lockForUpdate()->first();
            abort_unless($payment->provider === 'paypal' && $payment->paypal_order_id === $input['order_id'] && $payment->paypal_mode === $this->paypal->mode(), 409, 'Payment order does not match.');
            if ($payment->status === 'paid' && $payment->paypal_capture_id) {
                return ['status' => 'paid'];
            }
            abort_unless(in_array($payment->status, ['pending', 'failed'], true), 409, 'Payment cannot be captured.');
            $order = $this->paypal->order($payment->paypal_order_id);
            $this->paypal->validateOrder($payment, $order);
            if (($order['status'] ?? null) !== 'COMPLETED') {
                abort_unless(($order['status'] ?? null) === 'APPROVED', 409, 'Approve the payment with PayPal first.');
                // Reconcile a previous ambiguous capture via GET before retrying its stable key.
                abort_if(now()->diffInMinutes($payment->paypal_started_at, true) >= 300, 409, 'Payment requires reconciliation. Please contact support.');
                $this->paypal->capture($payment);
                $order = $this->paypal->order($payment->paypal_order_id);
            }
            $this->applyOrder($payment, $order);
            $status = DB::table('payments')->where('id', $paymentId)->value('status');

            return ['status' => $status];
        }));
    }

    public function webhook(Request $request): JsonResponse
    {
        $event = $request->json()->all();
        if (! is_string($event['id'] ?? null) || strlen($event['id']) > 255 || ! is_string($event['event_type'] ?? null) || strlen($event['event_type']) > 255) {
            return response()->json(['received' => false], 400);
        }
        try {
            $headers = [];
            foreach (['auth_algo', 'cert_url', 'transmission_id', 'transmission_sig', 'transmission_time'] as $name) {
                $headers[$name] = (string) $request->header('paypal-'.str_replace('_', '-', $name));
            }
            if (! $this->paypal->verify($event, $headers)) {
                return response()->json(['received' => false], 400);
            }
            DB::transaction(function () use ($event) {
                // A unique insert and all state updates commit together. Failed events remain retryable.
                if (! DB::table('paypal_webhook_events')->insertOrIgnore(['paypal_event_id' => $event['id'], 'type' => $event['event_type'], 'processed_at' => now()])) {
                    return;
                }
                $this->processEvent($event);
            });

            return response()->json(['received' => true]);
        } catch (Throwable) {
            Log::warning('paypal.webhook_failed', ['event_id' => $event['id'], 'type' => $event['event_type']]);

            return response()->json(['received' => false], 503);
        }
    }

    private function processEvent(array $event): void
    {
        $type = $event['event_type'];
        if (str_starts_with($type, 'PAYMENT.PAYOUTS')) {
            app(PayPalPayoutService::class)->processWebhook($event);

            return;
        }
        if (! str_starts_with($type, 'PAYMENT.CAPTURE.') && ! str_starts_with($type, 'CUSTOMER.DISPUTE.')) {
            return;
        }
        $resource = $event['resource'] ?? [];
        $orderId = data_get($resource, 'supplementary_data.related_ids.order_id');
        $captureId = str_starts_with($type, 'CUSTOMER.DISPUTE.') ? data_get($resource, 'disputed_transactions.0.seller_transaction_id') : ($type === 'PAYMENT.CAPTURE.REFUNDED' ? data_get($resource, 'supplementary_data.related_ids.capture_id') : ($resource['id'] ?? null));
        if (! $captureId && $type === 'PAYMENT.CAPTURE.REFUNDED') {
            foreach ($resource['links'] ?? [] as $link) {
                if (($link['rel'] ?? null) === 'up' && preg_match('~/v2/payments/captures/([A-Z0-9]+)$~', $link['href'] ?? '', $matches)) {
                    $captureId = $matches[1];
                }
            }
        }
        $query = DB::table('payments')->where('provider', 'paypal')->where('paypal_mode', $this->paypal->mode());
        if (is_string($orderId)) {
            $query->where('paypal_order_id', $orderId);
        } elseif (is_string($captureId)) {
            $query->where('paypal_capture_id', $captureId);
        } else {
            throw new RuntimeException('PayPal event cannot be reconciled.');
        }
        $payment = $query->lockForUpdate()->first();
        if (! $payment) {
            throw new RuntimeException('PayPal payment not yet linked.');
        }
        $order = $this->paypal->order($payment->paypal_order_id);
        $this->applyOrder($payment, $order);
        if (str_starts_with($type, 'CUSTOMER.DISPUTE.')) {
            if ($captureId !== DB::table('payments')->where('id', $payment->id)->value('paypal_capture_id')) {
                throw new RuntimeException('PayPal dispute mismatch.');
            }
            // A dispute flag never declares a refund or releases a helper payout.
            $existing = $payment->paypal_dispute_status;
            $disputeId = $resource['id'] ?? null;
            if (! is_string($disputeId) || strlen($disputeId) > 255 || $disputeId === '') {
                throw new RuntimeException('Invalid PayPal dispute reference.');
            }
            if ($type === 'CUSTOMER.DISPUTE.RESOLVED' && $payment->paypal_dispute_id && $payment->paypal_dispute_id !== $disputeId) {
                return;
            }
            if ($type === 'CUSTOMER.DISPUTE.RESOLVED' || $existing !== 'RESOLVED' || $payment->paypal_dispute_id !== $disputeId) {
                DB::table('payments')->where('id', $payment->id)->update(['paypal_dispute_id' => $disputeId, 'paypal_dispute_status' => $type === 'CUSTOMER.DISPUTE.RESOLVED' ? 'RESOLVED' : 'OPEN', 'updated_at' => now()]);
                if ($type !== 'CUSTOMER.DISPUTE.RESOLVED' && $existing !== 'OPEN') {
                    app(PayPalPayoutService::class)->notifyPaymentRisk((int) $payment->id);
                }
            }
        }
        if ($type === 'PAYMENT.CAPTURE.REVERSED') {
            if ($captureId !== DB::table('payments')->where('id', $payment->id)->value('paypal_capture_id')) {
                throw new RuntimeException('PayPal reversal mismatch.');
            }
            DB::table('payments')->where('id', $payment->id)->update(['status' => 'reversed', 'failure_reason' => 'PayPal capture reversed; reconcile any helper payout.', 'updated_at' => now()]);
            if ($payment->status !== 'reversed') {
                app(PayPalPayoutService::class)->notifyPaymentRisk((int) $payment->id);
            }
        }
    }

    /** Reconcile current provider state, not webhook delivery order; caller holds the payment lock. */
    private function applyOrder(object $payment, array $order): void
    {
        $unit = $this->paypal->validateOrder($payment, $order);
        $captures = $unit['payments']['captures'] ?? [];
        if (count($captures) !== 1) {
            throw new RuntimeException('PayPal capture is not yet available.');
        }
        $capture = $captures[0];
        $captureId = $capture['id'] ?? '';
        if (! preg_match('/^[A-Z0-9]{5,64}$/', $captureId) || ($payment->paypal_capture_id && $captureId !== $payment->paypal_capture_id)
            || ($capture['amount']['currency_code'] ?? null) !== $this->paypal->currency($payment)
            || $this->paypal->cents($capture['amount']['value'] ?? null) !== $this->paypal->cents($payment->total_amount)) {
            throw new RuntimeException('PayPal capture mismatch.');
        }
        $state = $capture['status'] ?? '';
        if ($state === 'COMPLETED' && ($order['status'] ?? null) !== 'COMPLETED') {
            throw new RuntimeException('PayPal order is not complete.');
        }
        $update = ['paypal_capture_id' => $captureId, 'updated_at' => now()];
        if ($state === 'COMPLETED' && ! in_array($payment->status, ['refunded', 'partially_refunded', 'reversed'], true)) {
            $update += ['status' => 'paid', 'paid_at' => $payment->paid_at ?: now(), 'failed_at' => null, 'failure_reason' => null];
            $payer = data_get($order, 'payer.payer_id');
            if (is_string($payer) && strlen($payer) <= 255) {
                $update['paypal_payer_id'] = $payer;
            }
            if (! $payment->paid_at) {
                InAppNotification::send((int) $payment->customer_id, 'payment_paid', 'Payment received', 'Your task payment was completed securely.', '/dashboard', ['payment_id' => $payment->id, 'task_id' => $payment->task_id]);
            }
            // Customer collection does not transfer helper earnings. Retain the existing pending payout.
            DB::table('payouts')->where('payment_id', $payment->id)->where('status', 'pending')->whereNull('provider_payout_id')->update(['provider' => 'manual', 'updated_at' => now()]);
        } elseif (in_array($state, ['DECLINED', 'DENIED', 'FAILED'], true) && ! $payment->paid_at) {
            $update += ['status' => 'failed', 'failed_at' => now(), 'failure_reason' => 'PayPal capture declined.'];
        } elseif (in_array($state, ['REFUNDED', 'PARTIALLY_REFUNDED'], true)) {
            $refunded = 0;
            foreach ($unit['payments']['refunds'] ?? [] as $refund) {
                if (($refund['status'] ?? null) === 'COMPLETED') {
                    if (($refund['amount']['currency_code'] ?? null) !== $this->paypal->currency($payment)) {
                        throw new RuntimeException('PayPal refund currency mismatch.');
                    }
                    $refunded += $this->paypal->cents($refund['amount']['value'] ?? null);
                }
            }
            $total = $this->paypal->cents($payment->total_amount);
            if ($refunded <= 0 || $refunded > $total || ($state === 'REFUNDED' && $refunded !== $total)) {
                throw new RuntimeException('PayPal refund requires reconciliation.');
            }
            $refunded = max($refunded, $this->paypal->cents($payment->refunded_amount));
            $update += ['status' => $payment->status === 'reversed' ? 'reversed' : ($refunded === $total ? 'refunded' : 'partially_refunded'), 'refunded_amount' => number_format($refunded / 100, 2, '.', ''), 'refunded_at' => now()];
        } elseif ($state === 'REVERSED') {
            $update += ['status' => 'reversed', 'failure_reason' => 'PayPal capture reversed; reconcile any helper payout.'];
        } elseif ($state !== 'COMPLETED') {
            throw new RuntimeException('PayPal capture is not complete.');
        }
        DB::table('payments')->where('id', $payment->id)->update($update);
        if (in_array($update['status'] ?? null, ['refunded', 'partially_refunded', 'reversed'], true) && (($update['status'] ?? null) !== $payment->status || ($update['refunded_amount'] ?? $payment->refunded_amount) != $payment->refunded_amount)) {
            app(PayPalPayoutService::class)->notifyPaymentRisk((int) $payment->id);
        }
        if (($update['status'] ?? null) === 'paid') {
            app(PayPalPayoutService::class)->notifyEligible((int) $payment->id);
        }
    }

    private function ownedPayment(Request $request, int $paymentId): object
    {
        abort_unless($request->user()->role === 'customer', 403, 'Only customers may pay.');
        $payment = DB::table('payments')->where('id', $paymentId)->where('customer_id', $request->user()->id)->first();
        abort_unless($payment, 404, 'Payment not found.');

        return $payment;
    }

    private function payable(object $payment): void
    {
        abort_unless(in_array($payment->status, ['pending', 'failed'], true) && ! $payment->paid_at && ! $payment->paypal_capture_id, 409, 'Payment is not payable.');
        abort_if($payment->stripe_checkout_session_id || $payment->provider_payment_id, 409, 'An existing checkout requires reconciliation before switching providers.');
        abort_if($payment->paypal_mode && $payment->paypal_mode !== $this->paypal->mode(), 409, 'Payment environment mismatch.');
        abort_unless(DB::table('tasks')->where('id', $payment->task_id)->where('customer_id', $payment->customer_id)->where('status', 'completed')->exists(), 409, 'Task is not ready for payment.');
        abort_unless($this->paypal->cents($payment->total_amount) > 0, 422, 'Invalid payment amount.');
        $this->paypal->currency($payment);
    }

    private function safe(int $paymentId, callable $action): JsonResponse
    {
        try {
            $data = $action();
            if (isset($data['status']) && $data['status'] !== 'paid') {
                return response()->json(['success' => false, 'message' => 'Payment was not completed. Please contact support.'], 409);
            }

            return response()->json(['success' => true, 'data' => $data])->header('Cache-Control', 'no-store');
        } catch (HttpExceptionInterface $exception) {
            return response()->json(['success' => false, 'message' => $exception->getMessage()], $exception->getStatusCode());
        } catch (Throwable) {
            Log::warning('paypal.checkout_failed', ['payment_id' => $paymentId]);

            return response()->json(['success' => false, 'message' => 'Payment could not be confirmed. Please retry or contact support.'], 502);
        }
    }
}
