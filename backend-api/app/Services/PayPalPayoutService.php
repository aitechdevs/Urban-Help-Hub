<?php

namespace App\Services;

use App\Support\InAppNotification;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

/** One immutable sender batch per payout. No automatic replacement of failed transfers. */
class PayPalPayoutService
{
    public function __construct(private readonly PayPalService $paypal) {}

    public function accountVersion(int $helperId, string $encrypted): string
    {
        return hash('sha256', $helperId.':'.$encrypted);
    }

    public function eligible(object $payment, object $payout): void
    {
        abort_if(DB::table('payment_installments')->where('payment_id', $payment->id)->exists(), 409, 'Use installment payout authorization.');
        abort_unless($payment->provider === 'paypal' && $payment->paypal_capture_id && $payment->status === 'paid' && $payment->paid_at, 409, 'Customer payment must be verified first.');
        abort_unless($payment->paypal_mode === $this->paypal->mode(), 409, 'Payment environment mismatch.');
        abort_if($payment->paypal_dispute_status === 'OPEN' || $this->paypal->cents($payment->refunded_amount) > 0, 409, 'Refunded or disputed payments require reconciliation.');
        abort_unless(DB::table('tasks')->where('id', $payment->task_id)->where('customer_id', $payment->customer_id)->where('status', 'completed')->exists(), 409, 'Customer completion confirmation is required.');
        abort_unless((int) $payout->helper_id === (int) $payment->helper_id && (int) $payout->task_id === (int) $payment->task_id, 409, 'Payout does not match the job.');
        $gross = $this->paypal->cents($payment->subtotal_amount);
        $fee = intdiv($gross * 30 + 50, 100);
        abort_unless($gross > 0 && $this->paypal->cents($payment->platform_fee) === $fee
            && $this->paypal->cents($payout->gross_amount) === $gross
            && $this->paypal->cents($payout->platform_deduction) === $fee
            && $this->paypal->cents($payout->other_deductions) === 0
            && $this->paypal->cents($payout->net_amount) === $gross - $fee
            && $payout->currency === $payment->currency, 409, 'The stored 30/70 amounts require review.');
        $this->paypal->currency($payment);
    }

    public function notifyEligible(int $paymentId): void
    {
        $payment = DB::table('payments')->where('id', $paymentId)->first();
        $payout = DB::table('payouts')->where('payment_id', $paymentId)->lockForUpdate()->first();
        if (! $payout || $payout->approval_notified_at || $payout->status !== 'pending') {
            return;
        }
        // Preserve valid payment capture even when historical payout accounting needs review.
        try {
            $this->eligible($payment, $payout);
        } catch (HttpExceptionInterface) {
            return;
        }
        DB::table('payouts')->where('id', $payout->id)->update(['approval_notified_at' => now(), 'updated_at' => now()]);
        InAppNotification::sendToAdmins('payout_approval_required', 'Helper payout awaiting approval',
            'Customer payment is verified for task #'.$payment->task_id.'. Platform commission: '.number_format((float) $payment->platform_fee, 2).' '.$payment->currency.'. Helper payout: '.number_format((float) $payout->net_amount, 2).' '.$payout->currency.'. Review the recipient before approving.',
            '/admin#payments', ['payment_id' => $paymentId, 'payout_id' => $payout->id, 'task_id' => $payment->task_id]);
    }

    public function notifyPaymentRisk(int $paymentId): void
    {
        $payout = DB::table('payouts')->where('payment_id', $paymentId)->whereNotNull('approved_at')->first();
        if ($payout) {
            InAppNotification::sendToAdmins('payout_attention', 'Customer payment changed after payout approval',
                'Payout #'.$payout->id.' has an approved transfer and its Customer payment was refunded, reversed or disputed. Review the existing PayPal transfer; funds already sent are not automatically recovered.',
                '/admin#payments', ['payment_id' => $paymentId, 'payout_id' => $payout->id]);
        }
    }

    private function enabled(): void
    {
        abort_unless(config('services.paypal.payouts_enabled', false), 409, 'PayPal Payouts is not enabled.');
        abort_if($this->paypal->mode() === 'live' && ! config('services.paypal.live_payouts_enabled', false), 409, 'Live payouts are not enabled.');
    }

    /** Lock payment before payout, matching capture/refund lock order. */
    private function locked(int $payoutId): array
    {
        $paymentId = DB::table('payouts')->where('id', $payoutId)->value('payment_id');
        abort_unless($paymentId, 404, 'Payout not found.');
        $payment = DB::table('payments')->where('id', $paymentId)->lockForUpdate()->first();
        $payout = DB::table('payouts')->where('id', $payoutId)->lockForUpdate()->first();
        abort_unless($payment && $payout, 404, 'Payout not found.');

        return [$payment, $payout];
    }

    private function verifyCurrentCapture(object $payment): void
    {
        $order = $this->paypal->order($payment->paypal_order_id);
        $unit = $this->paypal->validateOrder($payment, $order);
        $captures = $unit['payments']['captures'] ?? [];
        abort_unless(($order['status'] ?? null) === 'COMPLETED' && count($captures) === 1
            && ($captures[0]['id'] ?? null) === $payment->paypal_capture_id
            && ($captures[0]['status'] ?? null) === 'COMPLETED'
            && data_get($captures[0], 'amount.currency_code') === $payment->currency
            && $this->paypal->cents(data_get($captures[0], 'amount.value')) === $this->paypal->cents($payment->total_amount), 409, 'Current PayPal capture is not eligible for payout.');
    }

    public function approve(int $payoutId, int $adminId, string $version): array
    {
        $this->enabled();
        DB::transaction(function () use ($payoutId, $adminId, $version) {
            [$payment, $payout] = $this->locked($payoutId);
            if ($payout->approved_at) {
                return;
            }
            $this->eligible($payment, $payout);
            $this->verifyCurrentCapture($payment);
            abort_unless($payout->status === 'pending' && ! $payout->provider_payout_id && ! $payout->paid_at, 409, 'Payout is not awaiting approval.');
            $account = DB::table('paypal_payout_accounts')->where('helper_id', $payout->helper_id)->lockForUpdate()->first();
            abort_unless($account, 409, 'Helper must save a PayPal payout account first.');
            abort_unless(hash_equals($this->accountVersion((int) $payout->helper_id, $account->recipient), $version), 409, 'Payout account changed. Reload and review it before approval.');
            $recipient = Crypt::decryptString($account->recipient);
            abort_unless(filter_var($recipient, FILTER_VALIDATE_EMAIL), 409, 'Invalid payout account.');
            DB::table('payouts')->where('id', $payoutId)->update([
                'provider' => 'paypal', 'status' => 'processing', 'approved_by' => $adminId, 'approved_at' => now(),
                'paypal_mode' => $this->paypal->mode(), 'paypal_sender_batch_id' => (string) Str::uuid(),
                'paypal_recipient' => $account->recipient, 'failure_reason' => null, 'updated_at' => now(),
            ]);
        });

        // Approval and sender ID survive an ambiguous network response.
        return $this->reconcile($payoutId);
    }

    public function reconcile(int $payoutId): array
    {
        return DB::transaction(function () use ($payoutId) {
            [$payment, $payout] = $this->locked($payoutId);
            abort_unless($payout->approved_at && $payout->paypal_sender_batch_id && $payout->paypal_mode === $this->paypal->mode(), 409, 'No matching approved payout to reconcile.');
            if (! $payout->paypal_batch_id) {
                $this->enabled();
                $this->eligible($payment, $payout);
                $this->verifyCurrentCapture($payment);
                abort_if(now()->diffInDays($payout->approved_at, true) >= 29, 409, 'Old ambiguous payout requires manual PayPal reconciliation. Do not create a replacement.');
                $response = $this->paypal->submitPayout([
                    'sender_batch_header' => ['sender_batch_id' => $payout->paypal_sender_batch_id, 'email_subject' => 'UrbanHelpHub helper earnings'],
                    'items' => [[
                        'recipient_type' => 'EMAIL', 'receiver' => Crypt::decryptString($payout->paypal_recipient),
                        'amount' => ['value' => number_format($this->paypal->cents($payout->net_amount) / 100, 2, '.', ''), 'currency' => $payout->currency],
                        'sender_item_id' => 'payout-'.$payout->id,
                    ]],
                ], $payout->paypal_sender_batch_id);
                $batchId = data_get($response, 'batch_header.payout_batch_id');
                if (! is_string($batchId) || ! preg_match('/^[A-Z0-9]{5,64}$/', $batchId)) {
                    throw new RuntimeException('Payout batch reference unavailable.');
                }
                // Validate the fetched batch before binding an ID from a duplicate-response link.
                $batch = $this->paypal->payoutBatch($batchId);
            } else {
                $batch = $this->paypal->payoutBatch($payout->paypal_batch_id);
            }
            $this->applyBatch($payment, $payout, $batch);

            return $this->result($payoutId);
        });
    }

    public function processWebhook(array $event): void
    {
        $resource = $event['resource'] ?? [];
        $batchId = $resource['payout_batch_id'] ?? data_get($resource, 'batch_header.payout_batch_id');
        if (! is_string($batchId)) {
            throw new RuntimeException('Payout event lacks batch reference.');
        }
        $batch = $this->paypal->payoutBatch($batchId);
        $sender = data_get($batch, 'batch_header.sender_batch_header.sender_batch_id');
        $payoutId = DB::table('payouts')->where('paypal_sender_batch_id', $sender)->where('paypal_mode', $this->paypal->mode())->value('id');
        if (! $payoutId) {
            throw new RuntimeException('Payout event is not linked to an approved transfer.');
        }
        [$payment, $payout] = $this->locked((int) $payoutId);
        $this->applyBatch($payment, $payout, $batch);
    }

    private function applyBatch(object $payment, object $payout, array $batch): void
    {
        $header = $batch['batch_header'] ?? [];
        $id = $header['payout_batch_id'] ?? '';
        if (! preg_match('/^[A-Z0-9]{5,64}$/', $id) || ($payout->paypal_batch_id && $id !== $payout->paypal_batch_id)
            || data_get($header, 'sender_batch_header.sender_batch_id') !== $payout->paypal_sender_batch_id) {
            throw new RuntimeException('Payout batch mismatch.');
        }
        $items = $batch['items'] ?? [];
        if (count($items) > 1) {
            throw new RuntimeException('Unexpected payout item count.');
        }
        $update = ['paypal_batch_id' => $id, 'provider_payout_id' => $id, 'updated_at' => now()];
        if (! $items) {
            if (in_array($header['batch_status'] ?? '', ['DENIED', 'CANCELED'], true)) {
                $update += ['status' => 'failed', 'failed_at' => now(), 'failure_reason' => 'PayPal declined the payout batch. Reconcile before any replacement.'];
            }
            DB::table('payouts')->where('id', $payout->id)->update($update);

            return;
        }
        $item = $items[0];
        $detail = $item['payout_item'] ?? [];
        if (($detail['sender_item_id'] ?? null) !== 'payout-'.$payout->id
            || strtoupper($detail['recipient_type'] ?? '') !== 'EMAIL'
            || strtolower($detail['receiver'] ?? '') !== strtolower(Crypt::decryptString($payout->paypal_recipient))
            || data_get($detail, 'amount.currency') !== $payout->currency
            || $this->paypal->cents(data_get($detail, 'amount.value')) !== $this->paypal->cents($payout->net_amount)
            || ! preg_match('/^[A-Z0-9]{5,64}$/', $item['payout_item_id'] ?? '')
            || ($payout->paypal_item_id && $payout->paypal_item_id !== $item['payout_item_id'])) {
            throw new RuntimeException('Payout recipient or amount mismatch.');
        }
        $state = $item['transaction_status'] ?? '';
        $status = match ($state) {
            'SUCCESS' => 'paid', 'UNCLAIMED' => 'unclaimed',
            'FAILED', 'BLOCKED', 'DENIED', 'CANCELED' => 'failed',
            'RETURNED' => 'returned', 'REFUNDED' => 'refunded',
            'PENDING', 'ONHOLD' => 'processing',
            default => throw new RuntimeException('Unknown payout state.'),
        };
        if (in_array($payout->status, ['returned', 'refunded'], true) && $status === 'paid') {
            $status = $payout->status;
        }
        $update += ['status' => $status, 'paypal_item_id' => $item['payout_item_id'], 'paypal_transaction_status' => $state,
            'processed_at' => now(), 'failure_reason' => in_array($status, ['failed', 'returned', 'refunded'], true) ? 'PayPal payout requires administrator reconciliation.' : null];
        if ($status === 'paid') {
            $update['paid_at'] = $payout->paid_at ?: now();
        }
        if ($status === 'failed') {
            $update['failed_at'] = now();
        }
        DB::table('payouts')->where('id', $payout->id)->update($update);
        if ($payout->status !== $status && $status === 'paid' && ! $payout->paid_at) {
            InAppNotification::send((int) $payout->helper_id, 'payout_paid', 'Helper payout completed', 'PayPal confirmed your '.number_format((float) $payout->net_amount, 2).' '.$payout->currency.' payout.', '/helper/earnings/', ['payout_id' => $payout->id, 'task_id' => $payout->task_id]);
            InAppNotification::sendToAdmins('payout_paid', 'Helper payout completed', 'PayPal confirmed payout #'.$payout->id.'.', '/admin#payments', ['payout_id' => $payout->id]);
        } elseif ($payout->status !== $status && in_array($status, ['failed', 'unclaimed', 'returned', 'refunded'], true)) {
            InAppNotification::sendToAdmins('payout_attention', 'Helper payout needs attention', 'Payout #'.$payout->id.' is '.$status.'. Reconcile the existing transfer before any replacement.', '/admin#payments', ['payout_id' => $payout->id]);
        }
    }

    public function result(int $payoutId): array
    {
        $payout = DB::table('payouts')->where('id', $payoutId)->first();

        return ['id' => $payout->id, 'status' => $payout->status, 'approved_at' => $payout->approved_at, 'provider_status' => $payout->paypal_transaction_status];
    }
}
