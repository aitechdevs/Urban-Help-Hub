<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerProfileApprovalTest extends TestCase
{
    use RefreshDatabase;
    protected function setUp(): void
    {
        parent::setUp();
        Route::prefix('api')->group(base_path('routes/account-review.php'));
    }
    private function payload(): array
    {
        return ['name' => 'New Name', 'email' => 'updated@example.test', 'phone' => '+1234567',
            'city' => 'Ottawa', 'province' => 'Ontario', 'postal_code' => 'K1A 0B1', 'country' => 'Canada',
            'address_line_1' => '1 Test Road'];
    }
    public function test_customer_edits_do_not_take_effect_until_admin_approval(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active', 'name' => 'Original']);
        Sanctum::actingAs($customer);
        $this->putJson('/api/customer/profile', $this->payload())->assertOk();
        $this->assertDatabaseHas('users', ['id' => $customer->id, 'name' => 'Original']);
        $change = DB::table('customer_profile_changes')->first();
        $this->assertDatabaseHas('customer_profile_changes', ['id' => $change->id, 'status' => 'pending']);
        $this->putJson('/api/admin/review/customer-profiles/'.$change->id, ['decision' => 'approved', 'revision' => 1])->assertForbidden();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'status' => 'active']));
        $this->putJson('/api/admin/review/customer-profiles/'.$change->id, ['decision' => 'approved', 'revision' => 1])->assertOk();
        $this->assertDatabaseHas('users', ['id' => $customer->id, 'name' => 'New Name', 'email' => 'updated@example.test']);
        $this->assertDatabaseHas('profiles', ['user_id' => $customer->id, 'province' => 'Ontario', 'postal_code' => 'K1A 0B1']);
    }
    public function test_rejection_keeps_original_profile_and_notifies_customer(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active', 'name' => 'Original']);
        Sanctum::actingAs($customer);
        $this->putJson('/api/customer/profile', $this->payload())->assertOk();
        $change = DB::table('customer_profile_changes')->first();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'status' => 'active']));
        $this->putJson('/api/admin/review/customer-profiles/'.$change->id, ['decision' => 'rejected', 'revision' => 1, 'note' => 'Please confirm your address.'])->assertOk();
        $this->assertDatabaseHas('users', ['id' => $customer->id, 'name' => 'Original']);
        $this->assertDatabaseMissing('profiles', ['user_id' => $customer->id, 'postal_code' => 'K1A 0B1']);
        $this->assertDatabaseHas('notifications', ['user_id' => $customer->id, 'type' => 'customer_profile_reviewed']);
    }
    public function test_changed_pending_request_cannot_be_approved_using_old_revision(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        Sanctum::actingAs($customer);
        $this->putJson('/api/customer/profile', $this->payload())->assertOk();
        $change = DB::table('customer_profile_changes')->first();
        $payload = array_merge($this->payload(), ['city' => 'Toronto', 'expected_revision' => 1]);
        $this->putJson('/api/customer/profile', $payload)->assertOk();
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'status' => 'active']));
        $this->putJson('/api/admin/review/customer-profiles/'.$change->id, ['decision' => 'approved', 'revision' => 1])->assertConflict();
        $this->assertDatabaseHas('customer_profile_changes', ['id' => $change->id, 'status' => 'pending', 'revision' => 2]);
    }
    public function test_role_and_account_status_cannot_be_changed_in_profile_payload(): void
    {
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);
        Sanctum::actingAs($customer);
        $this->putJson('/api/customer/profile', array_merge($this->payload(), ['role' => 'admin', 'status' => 'suspended']))->assertOk();
        $proposed = json_decode(DB::table('customer_profile_changes')->value('proposed'), true);
        $this->assertArrayNotHasKey('role', $proposed);
        $this->assertArrayNotHasKey('status', $proposed);
    }
    public function test_pending_helper_document_is_in_review_queue_without_pending_services(): void
    {
        $helper = User::factory()->create(['role' => 'helper']);
        DB::table('profiles')->insert(['user_id' => $helper->id, 'verification_status' => 'unverified']);
        DB::table('helper_documents')->insert(['user_id' => $helper->id, 'document_type' => 'identity_document',
            'file_path' => 'private/test.pdf', 'is_active' => true, 'verification_status' => 'pending']);
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'status' => 'active']));
        $this->getJson('/api/admin/review/helpers?status=pending')->assertOk()->assertJsonFragment(['id' => $helper->id]);
        $this->getJson('/api/admin/review/summary')->assertOk()->assertJsonPath('data.stats.pending_helpers', 1);
    }
}
