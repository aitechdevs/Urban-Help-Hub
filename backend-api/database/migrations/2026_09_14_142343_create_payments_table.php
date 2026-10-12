<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('task_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('helper_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('provider', 50)->default('stripe');
            $table->string('provider_payment_id')->nullable();
            $table->string('provider_customer_id')->nullable();

            $table->string('currency', 3)->default('CAD');

            $table->decimal('subtotal_amount', 10, 2);
            $table->decimal('platform_fee', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);

            $table->decimal('refunded_amount', 10, 2)->default(0);

            $table->string('status', 30)->default('pending');

            $table->timestamp('authorized_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            $table->text('failure_reason')->nullable();

            $table->timestamps();

            $table->index('task_id');
            $table->index('customer_id');
            $table->index('helper_id');
            $table->index('status');
            $table->index('provider_payment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};