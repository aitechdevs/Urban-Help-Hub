<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('helper_availability', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');

            $table->boolean('is_available')->default(true);

            $table->string('timezone', 100)
                ->default('America/Toronto');

            $table->timestamps();

            $table->index(['user_id', 'day_of_week']);
            $table->index('is_available');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('helper_availability');
    }
};