<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->text('paypal_email')->nullable()->change());
        Schema::table('payouts', fn (Blueprint $table) => $table->text('paypal_recipient')->nullable()->change());

        foreach (['users' => 'paypal_email', 'payouts' => 'paypal_recipient'] as $table => $column) {
            DB::table($table)->whereNotNull($column)->select('id', $column)
                ->eachById(function (object $row) use ($table, $column): void {
                    if (filter_var($row->{$column}, FILTER_VALIDATE_EMAIL)) {
                        DB::table($table)->where('id', $row->id)->where($column, $row->{$column})
                            ->update([$column => Crypt::encryptString($row->{$column})]);
                    }
                });
        }
    }

    public function down(): void
    {
        // Retain ciphertext and its column capacity on rollback.
    }
};
