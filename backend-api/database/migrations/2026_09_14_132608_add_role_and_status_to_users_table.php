<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)
                ->default('customer')
                ->after('password');

            $table->string('status', 20)
                ->default('active')
                ->after('role');

            $table->timestamp('phone_verified_at')
                ->nullable()
                ->after('status');

            $table->timestamp('last_login_at')
                ->nullable()
                ->after('phone_verified_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role',
                'status',
                'phone_verified_at',
                'last_login_at',
            ]);
        });
    }
};