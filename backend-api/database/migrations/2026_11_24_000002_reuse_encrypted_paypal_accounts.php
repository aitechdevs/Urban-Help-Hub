<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Preserve an existing account and its approval version. Only import missing accounts.
        DB::table('users')->whereNotNull('paypal_email')->select('id', 'paypal_email')
            ->eachById(function (object $user): void {
                DB::table('paypal_payout_accounts')->insertOrIgnore([
                    'helper_id' => $user->id,
                    'recipient' => $user->paypal_email,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            });
    }

    public function down(): void
    {
        // Keep encrypted recipient records on rollback.
    }
};
