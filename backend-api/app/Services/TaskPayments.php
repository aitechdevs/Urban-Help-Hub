<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class TaskPayments
{
    public const CURRENCIES = ['AUD', 'BRL', 'CAD', 'CHF', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'ILS', 'MXN', 'MYR', 'NOK', 'NZD', 'PHP', 'PLN', 'SEK', 'SGD', 'THB', 'USD'];

    public static function minor(string|float|int $amount): int
    {
        if (!preg_match('/^(\d+)(?:\.(\d{1,2}))?$/D', (string) $amount, $parts)) {
            return 0;
        }
        return ((int) $parts[1] * 100) + (int) str_pad($parts[2] ?? '', 2, '0');
    }

    public static function money(int $minor): string
    {
        return sprintf('%d.%02d', intdiv($minor, 100), $minor % 100);
    }

    public function commitmentVerified(object $payment): bool
    {
        return in_array($payment->status, ['partially_paid', 'paid'], true)
            && DB::table('payment_installments')->where('payment_id', $payment->id)
                ->whereIn('stage', ['commitment', 'full'])->where('status', 'completed')
                ->whereNotNull('paypal_capture_id')->exists();
    }

    public function create(object $task, object $assignment): int
    {
        // The task row is locked by the quotation confirmation transaction.
        abort_if(DB::table('payments')->where('task_id', $task->id)->exists()
            || DB::table('payouts')->where('task_id', $task->id)->exists(),
            409, 'A payment or payout already exists for this task.');

        $currency = $task->currency ?: 'CAD';
        $total = self::minor($assignment->agreed_fixed_price ?? 0);
        if (! in_array($currency, self::CURRENCIES, true) || $total < 2) {
            throw ValidationException::withMessages(['assignment_id' => 'A fixed quote of at least 0.02 in a supported PayPal currency is required.']);
        }
        $fee = intdiv($total * 40 + 50, 100);
        $helper = $total - $fee;
        $rate = (float) config("currency.rates_to_cad.{$currency}", 0);
        if ($rate <= 0) {
            throw ValidationException::withMessages(['currency' => 'A CAD reporting exchange rate is required for this currency.']);
        }
        $now = now();
        $paymentId = DB::table('payments')->insertGetId([
            'task_id' => $task->id, 'customer_id' => $task->customer_id, 'helper_id' => $assignment->helper_id,
            'provider' => 'paypal', 'paypal_mode' => config('services.paypal.mode'), 'commission_percent' => 40, 'currency' => $currency, 'subtotal_amount' => self::money($total),
            'total_amount' => self::money($total), 'platform_fee' => self::money($fee), 'tax_amount' => 0,
            'settlement_currency' => 'CAD', 'settlement_exchange_rate' => $rate,
            'settlement_subtotal_amount' => round($total / 100 * $rate, 2),
            'settlement_total_amount' => round($total / 100 * $rate, 2),
            'settlement_platform_fee' => round($fee / 100 * $rate, 2),
            'settlement_helper_net' => round($helper / 100 * $rate, 2),
            'status' => 'pending', 'created_at' => $now, 'updated_at' => $now,
        ]);
        $deposit = intdiv($total + 1, 2);
        foreach (['commitment' => $deposit, 'balance' => $total - $deposit] as $stage => $amount) {
            DB::table('payment_installments')->insert([
                'payment_id' => $paymentId, 'stage' => $stage, 'amount_minor' => $amount,
                'request_id' => (string) Str::uuid(), 'created_at' => $now, 'updated_at' => $now,
            ]);
        }
        DB::table('payouts')->insert([
            'payment_id' => $paymentId, 'task_id' => $task->id, 'helper_id' => $assignment->helper_id,
            'provider' => 'paypal', 'currency' => $currency, 'gross_amount' => self::money($total),
            'platform_deduction' => self::money($fee), 'other_deductions' => 0, 'net_amount' => self::money($helper),
            'status' => 'pending', 'created_at' => $now, 'updated_at' => $now,
        ]);

        return $paymentId;
    }
}
