<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(ServiceCategorySeeder::class);

        $adminEmail = env('MVP_ADMIN_EMAIL');
        $adminPassword = env('MVP_ADMIN_PASSWORD');

        if ($adminEmail && $adminPassword) {
            User::updateOrCreate(
                ['email' => $adminEmail],
                [
                    'name' => env('MVP_ADMIN_NAME', 'UrbanHelpHub Administrator'),
                    'password' => $adminPassword,
                    'country_code' => 'CA',
                    'currency_code' => 'CAD',
                    'language_code' => 'en',
                    'role' => 'admin',
                    'status' => 'active',
                ]
            );
        }
    }
}
