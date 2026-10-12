<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('task_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('reviewer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('reviewee_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('rating');

            $table->string('title', 150)->nullable();
            $table->text('comment')->nullable();

            $table->string('status', 30)
                ->default('published');

            $table->boolean('is_visible')
                ->default(true);

            $table->timestamps();

            $table->unique([
                'task_id',
                'reviewer_id',
                'reviewee_id'
            ]);

            $table->index('reviewee_id');
            $table->index('rating');
            $table->index('status');
            $table->index('is_visible');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};