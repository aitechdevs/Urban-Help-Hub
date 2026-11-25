<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('administrator_audit_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('actor_user_id')->index();
            $table->string('actor_name');
            $table->unsignedBigInteger('administrator_user_id')->index();
            $table->string('administrator_name');
            $table->string('action', 20);
            $table->string('previous_status', 20)->nullable();
            $table->string('new_status', 20);
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('administrator_audit_events');
    }
};
