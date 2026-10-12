<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'stripe_account_id')) {
            Schema::table('users', fn (Blueprint $table) =>
                $table->string('stripe_account_id')->nullable()->unique()->after('status')
            );
        }
        if (!Schema::hasColumn('users', 'stripe_details_submitted')) {
            Schema::table('users', fn (Blueprint $table) =>
                $table->boolean('stripe_details_submitted')->default(false)->after('stripe_account_id')
            );
        }
        if (!Schema::hasColumn('users', 'stripe_charges_enabled')) {
            Schema::table('users', fn (Blueprint $table) =>
                $table->boolean('stripe_charges_enabled')->default(false)->after('stripe_details_submitted')
            );
        }
        if (!Schema::hasColumn('users', 'stripe_payouts_enabled')) {
            Schema::table('users', fn (Blueprint $table) =>
                $table->boolean('stripe_payouts_enabled')->default(false)->after('stripe_charges_enabled')
            );
        }

        if (!Schema::hasColumn('payments', 'stripe_checkout_session_id')) {
            Schema::table('payments', fn (Blueprint $table) =>
                $table->string('stripe_checkout_session_id')->nullable()->unique()->after('provider_customer_id')
            );
        }
        if (!Schema::hasColumn('payments', 'checkout_idempotency_key')) {
            Schema::table('payments', fn (Blueprint $table) =>
                $table->string('checkout_idempotency_key')->nullable()->unique()->after('stripe_checkout_session_id')
            );
        }

        if (!Schema::hasTable('stripe_webhook_events')) {
            Schema::create('stripe_webhook_events', function (Blueprint $table) {
                $table->id();
                $table->string('stripe_event_id')->unique();
                $table->string('type');
                $table->string('status')->default('processing');
                $table->text('failure_reason')->nullable();
                $table->timestamp('processed_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('stripe_webhook_events');

        foreach (['stripe_checkout_session_id', 'checkout_idempotency_key'] as $column) {
            if (Schema::hasColumn('payments', $column)) {
                Schema::table('payments', fn (Blueprint $table) => $table->dropColumn($column));
            }
        }

        foreach (['stripe_details_submitted', 'stripe_charges_enabled', 'stripe_payouts_enabled'] as $column) {
            if (Schema::hasColumn('users', $column)) {
                Schema::table('users', fn (Blueprint $table) => $table->dropColumn($column));
            }
        }
    }
};
