<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_status_history', function (Blueprint $table) {
            $table->id();

            $table->foreignId('task_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('changed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('from_status', 30)->nullable();
            $table->string('to_status', 30);

            $table->text('reason')->nullable();
            $table->text('notes')->nullable();

            $table->timestamp('changed_at')->useCurrent();

            $table->timestamps();

            $table->index('task_id');
            $table->index('to_status');
            $table->index('changed_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_status_history');
    }
};