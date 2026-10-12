<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('label', 100)->nullable();
            $table->string('address_type', 30)->default('saved');

            $table->string('address_line_1');
            $table->string('address_line_2')->nullable();

            $table->string('city', 120);
            $table->string('province', 100);
            $table->string('postal_code', 20);
            $table->string('country', 100)->default('Canada');

            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            $table->boolean('is_default')->default(false);

            $table->timestamps();

            $table->index('user_id');
            $table->index(['province', 'city']);
            $table->index('postal_code');
            $table->index('is_default');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};