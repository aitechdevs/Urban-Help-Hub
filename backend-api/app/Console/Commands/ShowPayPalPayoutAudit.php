<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ShowPayPalPayoutAudit extends Command
{
    protected $signature = 'paypal:payout-audit {payout : Internal payout ID}';

    protected $description = 'Show administrator actions for a PayPal payout';

    public function handle(): int
    {
        $payoutId = (string) $this->argument('payout');
        if (!ctype_digit($payoutId) || (int) $payoutId < 1) {
            $this->error('Enter a positive internal payout ID.');

            return self::INVALID;
        }

        $events = DB::table('paypal_payout_audit_events')
            ->where('payout_id', $payoutId)
            ->orderBy('id')
            ->get(['created_at', 'actor_user_id', 'actor_role', 'action']);

        if ($events->isEmpty()) {
            $this->info('No administrator actions have been recorded for this payout.');

            return self::SUCCESS;
        }

        $this->table(['Time', 'Administrator user ID', 'Role', 'Action'], $events->map(fn ($event) => (array) $event));

        return self::SUCCESS;
    }
}
