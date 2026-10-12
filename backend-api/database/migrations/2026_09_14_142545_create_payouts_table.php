<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('payment_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->foreignId('task_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('helper_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('provider', 50)->default('stripe');
            $table->string('provider_payout_id')->nullable();
            $table->string('provider_account_id')->nullable();

            $table->string('currency', 3)->default('CAD');

            $table->decimal('gross_amount', 10, 2);
            $table->decimal('platform_deduction', 10, 2)->default(0);
            $table->decimal('other_deductions', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2);

            $table->string('status', 30)->default('pending');

            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();

            $table->text('failure_reason')->nullable();

            $table->timestamps();

            $table->index('payment_id');
            $table->index('task_id');
            $table->index('helper_id');
            $table->index('status');
            $table->index('provider_payout_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};