<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('stripe_account_id')->nullable()->unique()->after('status');
            $table->boolean('stripe_details_submitted')->default(false)->after('stripe_account_id');
            $table->boolean('stripe_charges_enabled')->default(false)->after('stripe_details_submitted');
            $table->boolean('stripe_payouts_enabled')->default(false)->after('stripe_charges_enabled');
            $table->timestamp('stripe_onboarding_completed_at')->nullable()->after('stripe_payouts_enabled');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('provider_checkout_session_id')->nullable()->after('provider_payment_id');
            $table->string('provider_charge_id')->nullable()->after('provider_checkout_session_id');
            $table->string('provider_transfer_id')->nullable()->after('provider_charge_id');
            $table->index('provider_checkout_session_id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['provider_checkout_session_id']);
            $table->dropColumn([
                'provider_checkout_session_id',
                'provider_charge_id',
                'provider_transfer_id',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['stripe_account_id']);
            $table->dropColumn([
                'stripe_account_id',
                'stripe_details_submitted',
                'stripe_charges_enabled',
                'stripe_payouts_enabled',
                'stripe_onboarding_completed_at',
            ]);
        });
    }
};
