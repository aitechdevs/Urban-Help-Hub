<?php

namespace Database\Seeders;

use App\Models\ServiceCategory;
use Illuminate\Database\Seeder;

class ServiceCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Cleaning',
                'slug' => 'cleaning',
                'description' => 'Home, apartment, office, and general cleaning services.',
                'sort_order' => 1,
                'requires_verification' => true,
                'requires_background_check' => false,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Moving Help',
                'slug' => 'moving-help',
                'description' => 'Loading, unloading, packing, lifting, and moving assistance.',
                'sort_order' => 2,
                'requires_verification' => true,
                'requires_background_check' => false,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Furniture Assembly',
                'slug' => 'furniture-assembly',
                'description' => 'Assembly and setup of household and office furniture.',
                'sort_order' => 3,
                'requires_verification' => true,
                'requires_background_check' => false,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Delivery & Errands',
                'slug' => 'delivery-errands',
                'description' => 'Local deliveries, shopping, pickups, drop-offs, and personal errands.',
                'sort_order' => 4,
                'requires_verification' => true,
                'requires_background_check' => false,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Home Repairs',
                'slug' => 'home-repairs',
                'description' => 'General household repairs and maintenance tasks.',
                'sort_order' => 5,
                'requires_verification' => true,
                'requires_background_check' => false,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Mounting',
                'slug' => 'mounting',
                'description' => 'TV, shelf, artwork, curtain, and wall mounting services.',
                'sort_order' => 6,
                'requires_verification' => true,
                'requires_background_check' => false,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Yard & Outdoor',
                'slug' => 'yard-outdoor',
                'description' => 'Lawn, garden, outdoor cleanup, and general yard assistance.',
                'sort_order' => 7,
                'requires_verification' => true,
                'requires_background_check' => false,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Personal Help',
                'slug' => 'personal-help',
                'description' => 'General personal assistance and everyday support tasks.',
                'sort_order' => 8,
                'requires_verification' => true,
                'requires_background_check' => false,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Snow Removal',
                'slug' => 'snow-removal',
                'description' => 'Snow clearing and winter outdoor assistance.',
                'sort_order' => 9,
                'requires_verification' => true,
                'requires_background_check' => false,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Personal Driving',
                'slug' => 'personal-driving',
                'description' => 'Local personal driving and transportation assistance.',
                'sort_order' => 10,
                'requires_verification' => true,
                'requires_background_check' => true,
                'requires_driving_documents' => true,
                'requires_specialist_documents' => false,
            ],
            [
                'name' => 'Babysitting',
                'slug' => 'babysitting',
                'description' => 'Childcare and babysitting support from approved Helpers.',
                'sort_order' => 11,
                'requires_verification' => true,
                'requires_background_check' => true,
                'requires_driving_documents' => false,
                'requires_specialist_documents' => false,
            ],
        ];

        foreach ($categories as $category) {
            ServiceCategory::updateOrCreate(
                ['slug' => $category['slug']],
                array_merge($category, [
                    'is_active' => true,
                ])
            );
        }
    }
}