<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('helper_services', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('service_category_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->decimal('hourly_rate', 10, 2)->nullable();

            $table->unsignedInteger('years_experience')
                ->default(0);

            $table->text('experience_summary')
                ->nullable();

            $table->string('approval_status', 30)
                ->default('pending');

            $table->boolean('is_active')
                ->default(false);

            $table->timestamps();

            $table->unique([
                'user_id',
                'service_category_id'
            ]);

            $table->index('approval_status');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('helper_services');
    }
};