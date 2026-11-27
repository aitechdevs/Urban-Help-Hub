<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HelperProfileEditTest extends TestCase
{
    use RefreshDatabase;

    public function test_partial_edits_preserve_unrelated_approval_and_respect_ownership(): void
    {
        $owner = User::factory()->create(['role' => 'helper', 'status' => 'active', 'phone' => '555-0100']);
        $other = User::factory()->create(['role' => 'helper', 'status' => 'active']);
        DB::table('profiles')->insert([
            'user_id' => $owner->id, 'city' => 'Toronto', 'province' => 'ON', 'postal_code' => 'M5V 2T6',
            'bio' => 'Keep this biography', 'verification_status' => 'verified', 'phone' => '555-0100',
        ]);
        DB::table('service_categories')->insert([['name' => 'A service', 'slug' => 'first'], ['name' => 'B service', 'slug' => 'second']]);
        $first = DB::table('helper_services')->insertGetId(['user_id' => $owner->id, 'service_category_id' => 1,
            'hourly_rate' => 30, 'years_experience' => 4, 'approval_status' => 'approved', 'is_active' => true]);
        $second = DB::table('helper_services')->insertGetId(['user_id' => $owner->id, 'service_category_id' => 2,
            'approval_status' => 'approved', 'is_active' => true]);

        Sanctum::actingAs($other);
        $this->patchJson('/api/helper/profile/services/'.$first, ['hourly_rate' => 80])->assertNotFound();
        Sanctum::actingAs($owner);
        $this->patchJson('/api/helper/profile', ['headline' => 'Updated headline'])->assertOk();
        $this->assertDatabaseHas('profiles', ['user_id' => $owner->id, 'bio' => 'Keep this biography', 'verification_status' => 'verified']);
        $this->patchJson('/api/helper/profile/services/'.$first, ['hourly_rate' => 30])->assertOk();
        $this->assertDatabaseHas('helper_services', ['id' => $first, 'approval_status' => 'approved', 'is_active' => true]);
        $this->patchJson('/api/helper/profile/services/'.$first, ['hourly_rate' => 45])->assertOk();
        $this->assertDatabaseHas('helper_services', ['id' => $first, 'approval_status' => 'pending', 'years_experience' => 4, 'hourly_rate' => 45]);
        $this->assertDatabaseHas('helper_services', ['id' => $second, 'approval_status' => 'approved', 'is_active' => true]);
        $this->patchJson('/api/helper/profile', ['postal_code' => 'm5v2t6'])->assertOk();
        $this->assertDatabaseHas('profiles', ['user_id' => $owner->id, 'verification_status' => 'verified']);
        $this->patchJson('/api/helper/profile', ['postal_code' => 'm5v-2t7'])->assertOk();
        $this->assertDatabaseHas('profiles', ['user_id' => $owner->id, 'postal_code' => 'M5V 2T7', 'verification_status' => 'pending']);
        $this->assertDatabaseHas('helper_services', ['id' => $second, 'approval_status' => 'approved', 'is_active' => false]);
    }

    public function test_customer_cannot_edit_helper_profile(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'customer', 'status' => 'active']));
        $this->patchJson('/api/helper/profile', ['headline' => 'Rejected'])->assertForbidden();
    }
}
