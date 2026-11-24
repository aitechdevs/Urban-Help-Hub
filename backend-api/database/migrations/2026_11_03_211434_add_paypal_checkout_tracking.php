<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('paypal_mode', 10)->nullable();
            $table->string('paypal_order_id')->nullable()->unique();
            $table->string('paypal_capture_id')->nullable()->unique();
            $table->string('paypal_payer_id')->nullable();
            $table->uuid('paypal_create_key')->nullable()->unique();
            $table->uuid('paypal_capture_key')->nullable()->unique();
            $table->timestamp('paypal_started_at')->nullable();
            $table->string('paypal_dispute_status')->nullable();
            $table->string('paypal_dispute_id')->nullable();
        });
        Schema::create('paypal_webhook_events', function (Blueprint $table) {
            $table->id();
            $table->string('paypal_event_id')->unique();
            $table->string('type');
            $table->timestamp('processed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paypal_webhook_events');
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['paypal_order_id']);
            $table->dropUnique(['paypal_capture_id']);
            $table->dropUnique(['paypal_create_key']);
            $table->dropUnique(['paypal_capture_key']);
            $table->dropColumn(['paypal_mode', 'paypal_order_id', 'paypal_capture_id', 'paypal_payer_id', 'paypal_create_key', 'paypal_capture_key', 'paypal_started_at', 'paypal_dispute_status', 'paypal_dispute_id']);
        });
    }
};
