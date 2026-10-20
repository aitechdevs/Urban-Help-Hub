<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('approval_email_outbox', function (Blueprint $table) {
            $table->id();
            $table->string('event_key', 160)->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('event_type', 60);
            $table->string('recipient', 255);
            $table->string('subject', 255);
            $table->text('body');
            $table->string('status', 20)->default('pending');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamp('next_attempt_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->text('last_error')->nullable();
            $table->timestamps();
            $table->index(['status', 'next_attempt_at']);
        });
    }
    public function down(): void { Schema::dropIfExists('approval_email_outbox'); }
};
