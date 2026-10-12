<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_assignments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('task_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('helper_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('status', 30)
                ->default('pending');

            $table->decimal('agreed_hourly_rate', 10, 2)->nullable();
            $table->decimal('agreed_fixed_price', 10, 2)->nullable();

            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->text('cancellation_reason')->nullable();

            $table->timestamps();

            $table->unique(['task_id', 'helper_id']);
            $table->index('status');
            $table->index('helper_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_assignments');
    }
};