<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApprovalConsistencyTest extends TestCase
{
    use RefreshDatabase;

    private function helperWithService(string $status = 'active'): array
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'status' => 'active']));
        $helper = User::factory()->create(['role' => 'helper', 'status' => $status]);
        DB::table('profiles')->insert(['user_id' => $helper->id, 'verification_status' => 'pending']);
        $category = DB::table('service_categories')->insertGetId(['name' => 'Test service', 'slug' => 'test-service']);
        $service = DB::table('helper_services')->insertGetId(['user_id' => $helper->id, 'service_category_id' => $category]);

        return [$helper, $service];
    }

    private function identity(User $helper): void
    {
        DB::table('helper_documents')->insert(['user_id' => $helper->id, 'document_type' => 'identity',
            'file_path' => 'test-only-placeholder.pdf', 'verification_status' => 'verified', 'is_active' => true]);
    }

    public function test_service_approval_requires_identity_then_final_verification(): void
    {
        [$helper, $service] = $this->helperWithService();
        $url = "/api/admin/helpers/{$helper->id}/services/{$service}";
        $this->putJson($url, ['approval_status' => 'approved'])->assertStatus(422);
        $this->identity($helper);
        $this->putJson($url, ['approval_status' => 'approved'])->assertStatus(422);
        $this->putJson("/api/admin/helpers/{$helper->id}/verification", ['verification_status' => 'verified'])->assertOk();
        $this->putJson($url, ['approval_status' => 'approved'])->assertOk();
        $this->assertDatabaseHas('helper_services', ['id' => $service, 'approval_status' => 'approved', 'is_active' => true]);
        $this->assertDatabaseCount('approval_email_outbox', 1);
    }

    public function test_suspension_blocks_verification_and_service_approval_without_reactivation(): void
    {
        [$helper, $service] = $this->helperWithService('suspended');
        $this->identity($helper);
        $this->putJson("/api/admin/helpers/{$helper->id}/verification", ['verification_status' => 'verified'])->assertStatus(422);
        $this->putJson("/api/admin/helpers/{$helper->id}/services/{$service}", ['approval_status' => 'approved'])->assertStatus(422);
        $this->assertDatabaseHas('users', ['id' => $helper->id, 'status' => 'suspended']);
        $this->assertDatabaseCount('approval_email_outbox', 0);
    }

    public function test_suspended_helper_without_pending_services_remains_in_attention_queue(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'status' => 'active']));
        $helper = User::factory()->create(['role' => 'helper', 'status' => 'suspended']);
        foreach (['pending', 'inactive'] as $filter) {
            $this->getJson('/api/admin/review/helpers?status='.$filter)->assertOk()
                ->assertJsonFragment(['id' => $helper->id, 'status' => 'suspended']);
        }
    }
}
