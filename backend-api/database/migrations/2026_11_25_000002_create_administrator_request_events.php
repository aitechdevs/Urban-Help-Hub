<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('administrator_request_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('actor_user_id');
            $table->string('actor_name');
            $table->string('actor_role', 20);
            $table->string('method', 10);
            $table->string('route');
            $table->string('target_ids')->nullable();
            $table->unsignedSmallInteger('response_status');
            $table->timestamp('created_at');
            $table->index(['actor_user_id', 'created_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('administrator_request_events');
    }
};
