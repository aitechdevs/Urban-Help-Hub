<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('account_email_confirmations', function (Blueprint $table) {
            $table->foreignId('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->string('email');
            $table->string('token_digest', 64)->nullable()->unique();
            $table->timestamp('issued_at');
            $table->timestamp('expires_at');
            $table->timestamp('confirmed_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_email_confirmations');
    }
};
