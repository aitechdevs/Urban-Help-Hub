<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->string('phone', 30)->nullable();
            $table->string('profile_photo')->nullable();

            $table->string('headline')->nullable();
            $table->text('bio')->nullable();

            $table->date('date_of_birth')->nullable();

            $table->string('city')->nullable();
            $table->string('province', 100)->nullable();
            $table->string('country', 100)->default('Canada');
            $table->string('postal_code', 20)->nullable();

            $table->string('verification_status', 30)
                ->default('unverified');

            $table->timestamps();

            $table->index('phone');
            $table->index(['province', 'city']);
            $table->index('verification_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};