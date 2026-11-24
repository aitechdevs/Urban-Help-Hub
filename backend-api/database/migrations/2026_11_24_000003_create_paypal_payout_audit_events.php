<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('paypal_payout_audit_events', function (Blueprint $table) {
            $table->id();
            // Keep identifiers available even if an administrator or payout is removed later.
            $table->unsignedBigInteger('payout_id');
            $table->unsignedBigInteger('actor_user_id');
            $table->string('actor_role', 20);
            $table->string('action', 30);
            $table->timestamp('created_at');
            $table->index(['payout_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('paypal_payout_audit_events');
    }
};
