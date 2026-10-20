<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('service_categories')->insertOrIgnore([
            'name' => 'Mobile Salon', 'slug' => 'mobile-salon',
            'description' => 'Haircuts, hairstyling and salon services at your location.',
            'sort_order' => 12, 'is_active' => true,
            'requires_verification' => true, 'requires_background_check' => false,
            'requires_driving_documents' => false, 'requires_specialist_documents' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // Retain the category to preserve existing tasks and Helper service records.
    }
};
