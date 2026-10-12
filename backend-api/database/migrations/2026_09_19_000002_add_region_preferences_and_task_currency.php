<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->char('country_code', 2)->default('CA')->after('phone');
            $table->char('currency_code', 3)->default('CAD')->after('country_code');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->char('currency', 3)->default('CAD')->after('pricing_type');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('currency');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['country_code', 'currency_code']);
        });
    }
};
