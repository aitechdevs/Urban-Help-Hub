<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paypal_payout_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('helper_id')->unique()->constrained('users');
            $table->text('recipient');
            $table->timestamps();
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('commission_percent', 5, 2)->nullable();
        });
        Schema::table('payouts', function (Blueprint $table) {
            $table->uuid('paypal_sender_batch_id')->nullable()->unique();
            $table->string('paypal_batch_id')->nullable()->unique();
            $table->string('paypal_item_id')->nullable()->unique();
            $table->string('paypal_mode', 10)->nullable();
            $table->text('paypal_recipient')->nullable();
            $table->string('paypal_transaction_status')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('approval_notified_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('payouts', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            foreach (['paypal_sender_batch_id', 'paypal_batch_id', 'paypal_item_id'] as $column) {
                $table->dropUnique([$column]);
            }
            $table->dropColumn(['paypal_sender_batch_id', 'paypal_batch_id', 'paypal_item_id', 'paypal_mode', 'paypal_recipient', 'paypal_transaction_status', 'approved_by', 'approved_at', 'approval_notified_at']);
        });
        Schema::table('payments', fn (Blueprint $table) => $table->dropColumn('commission_percent'));
        Schema::dropIfExists('paypal_payout_accounts');
    }
};
