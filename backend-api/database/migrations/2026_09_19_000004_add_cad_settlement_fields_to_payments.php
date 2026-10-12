<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->char('settlement_currency', 3)->default('CAD')->after('currency');
            $table->decimal('settlement_exchange_rate', 18, 8)->default(1)->after('settlement_currency');
            $table->decimal('settlement_subtotal_amount', 12, 2)->default(0)->after('settlement_exchange_rate');
            $table->decimal('settlement_platform_fee', 12, 2)->default(0)->after('settlement_subtotal_amount');
            $table->decimal('settlement_total_amount', 12, 2)->default(0)->after('settlement_platform_fee');
            $table->decimal('settlement_helper_net', 12, 2)->default(0)->after('settlement_total_amount');
        });

        DB::table('payments')->orderBy('id')->each(function ($payment): void {
            DB::table('payments')->where('id', $payment->id)->update([
                'settlement_currency' => 'CAD',
                'settlement_exchange_rate' => 1,
                'settlement_subtotal_amount' => $payment->subtotal_amount,
                'settlement_platform_fee' => $payment->platform_fee,
                'settlement_total_amount' => $payment->total_amount,
                'settlement_helper_net' => max(0, (float) $payment->subtotal_amount - (float) $payment->platform_fee),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'settlement_currency', 'settlement_exchange_rate',
                'settlement_subtotal_amount', 'settlement_platform_fee',
                'settlement_total_amount', 'settlement_helper_net',
            ]);
        });
    }
};
