<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->string('paypal_email')->nullable());
        Schema::table('payments', function (Blueprint $table) {
            $table->timestamp('customer_confirmed_at')->nullable();
            $table->decimal('provider_fees', 12, 2)->default(0);
        });
        Schema::table('payouts', function (Blueprint $table) {
            $table->foreignId('released_by')->nullable()->constrained('users');
            $table->timestamp('released_at')->nullable();
            $table->string('paypal_recipient')->nullable();
            $table->string('paypal_item_id')->nullable()->unique();
            $table->decimal('provider_fee', 12, 2)->default(0);
        });
        Schema::create('payment_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->string('stage');
            $table->unsignedBigInteger('amount_minor');
            $table->string('status')->default('pending');
            $table->string('paypal_order_id')->nullable()->unique();
            $table->string('paypal_capture_id')->nullable()->unique();
            $table->uuid('request_id')->unique();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
            $table->unique(['payment_id', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_installments');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('paypal_email'));
        Schema::table('payouts', fn (Blueprint $table) => $table->dropConstrainedForeignId('released_by'));
        Schema::table('payouts', fn (Blueprint $table) => $table->dropColumn(['released_at', 'paypal_recipient', 'paypal_item_id', 'provider_fee']));
        Schema::table('payments', fn (Blueprint $table) => $table->dropColumn(['customer_confirmed_at', 'provider_fees']));
    }
};
