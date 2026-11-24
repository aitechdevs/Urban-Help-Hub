<?php

namespace App\Console\Commands;

use App\Services\PayPalPayoutService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReconcilePayPalPayouts extends Command
{
    protected $signature = 'paypal:payouts-reconcile';

    protected $description = 'Reconcile previously admin-approved PayPal transfers without creating new approvals';

    public function handle(PayPalPayoutService $payouts): int
    {
        $failed = false;
        DB::table('payouts')->whereNotNull('approved_at')->whereNotNull('paypal_sender_batch_id')
            ->whereIn('status', ['processing', 'unclaimed'])->orderBy('id')->chunkById(100, function ($rows) use ($payouts, &$failed) {
                foreach ($rows as $row) {
                    try {
                        $payouts->reconcile((int) $row->id);
                    } catch (Throwable) {
                        $failed = true;
                        Log::warning('paypal.payout_poll_failed', ['payout_id' => $row->id]);
                    }
                }
            });

        return $failed ? self::FAILURE : self::SUCCESS;
    }
}
