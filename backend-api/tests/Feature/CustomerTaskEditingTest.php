<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;
use Illuminate\Support\Facades\Route;

class CustomerTaskEditingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Route::prefix('api')->group(base_path('routes/customer-task-details.php'));
    }

    private function booking(string $status = 'open'): array
    {
        $owner = User::factory()->create(['role' => 'customer']);
        $category = DB::table('service_categories')->where('slug', 'mobile-salon')->value('id')
            ?? DB::table('service_categories')->insertGetId([
            'name' => 'Mobile Salon', 'slug' => 'mobile-salon', 'is_active' => true,
        ]);
        $payload = [
            'service_category_id' => $category, 'title' => 'Haircut at home',
            'description' => 'Please provide a haircut and styling at home.',
            'address_line_1' => '1 Test Road', 'city' => 'Toronto', 'province' => 'Ontario',
            'postal_code' => 'M1B 1B1', 'country' => 'Canada',
            'scheduled_date' => now()->addDays(5)->toDateString(),
            'scheduled_start_time' => '10:00', 'scheduled_end_time' => '11:00',
            'is_time_flexible' => false, 'pricing_type' => 'fixed', 'budget_min' => 40, 'budget_max' => 60,
        ];
        $task = DB::table('tasks')->insertGetId([
            'customer_id' => $owner->id, 'service_category_id' => $category,
            'title' => 'Original title', 'description' => 'Original task description',
            'status' => $status, 'currency' => 'CAD', 'created_at' => now(), 'updated_at' => now(),
        ]);
        return [$owner, $task, $payload];
    }

    public function test_guests_and_other_customers_cannot_edit_a_booking(): void
    {
        [$owner, $task, $payload] = $this->booking();
        $this->putJson("/api/customer/tasks/{$task}/details", $payload)->assertUnauthorized();
        Sanctum::actingAs(User::factory()->create(['role' => 'customer']));
        $this->putJson("/api/customer/tasks/{$task}/details", $payload)->assertNotFound();
        $this->assertDatabaseHas('tasks', ['id' => $task, 'title' => 'Original title']);
    }

    public function test_helper_cannot_edit_customer_tasks(): void
    {
        [$owner, $task, $payload] = $this->booking();
        Sanctum::actingAs(User::factory()->create(['role' => 'helper']));
        $this->putJson("/api/customer/tasks/{$task}/details", $payload)->assertForbidden();
    }

    public function test_owner_can_edit_unassigned_task_and_it_requires_approval_again(): void
    {
        [$owner, $task, $payload] = $this->booking();
        Sanctum::actingAs($owner);
        $this->putJson("/api/customer/tasks/{$task}/details", $payload)->assertOk()->assertJsonPath('success', true);
        $this->assertDatabaseHas('tasks', ['id' => $task, 'title' => $payload['title'], 'status' => 'pending_approval', 'currency' => 'CAD']);
        $this->assertDatabaseHas('task_status_history', ['task_id' => $task, 'from_status' => 'open', 'to_status' => 'pending_approval']);
    }

    public function test_editing_scheduled_task_withdraws_old_confirmation_and_notifies_helper(): void
    {
        [$owner, $task, $payload] = $this->booking('scheduled');
        $helper = User::factory()->create(['role' => 'helper']);
        DB::table('task_assignments')->insert(['task_id' => $task, 'helper_id' => $helper->id, 'status' => 'confirmed']);
        Sanctum::actingAs($owner);
        $this->putJson("/api/customer/tasks/{$task}/details", $payload)->assertOk();
        $this->assertDatabaseHas('task_assignments', ['task_id' => $task, 'helper_id' => $helper->id, 'status' => 'not_selected']);
        $this->assertDatabaseHas('notifications', ['user_id' => $helper->id, 'type' => 'task_updated']);
    }

    public function test_started_and_completed_tasks_are_locked(): void
    {
        [$owner, $task, $payload] = $this->booking('in_progress');
        Sanctum::actingAs($owner);
        foreach (['in_progress', 'awaiting_completion', 'completed', 'cancelled'] as $status) {
            DB::table('tasks')->where('id', $task)->update(['status' => $status]);
            $this->putJson("/api/customer/tasks/{$task}/details", $payload)->assertConflict();
        }
        $this->assertDatabaseHas('tasks', ['id' => $task, 'title' => 'Original title']);
    }

    public function test_stale_edit_is_rejected(): void
    {
        [$owner, $task, $payload] = $this->booking();
        Sanctum::actingAs($owner);
        $this->putJson("/api/customer/tasks/{$task}/details", array_merge($payload, ['expected_updated_at' => '2000-01-01 00:00:00']))->assertConflict();
        $this->assertDatabaseHas('tasks', ['id' => $task, 'title' => 'Original title']);
    }

    public function test_started_assignment_blocks_edit_even_if_task_status_is_stale(): void
    {
        [$owner, $task, $payload] = $this->booking();
        $helper = User::factory()->create(['role' => 'helper']);
        DB::table('task_assignments')->insert(['task_id' => $task, 'helper_id' => $helper->id, 'status' => 'in_progress']);
        Sanctum::actingAs($owner);
        $this->putJson("/api/customer/tasks/{$task}/details", $payload)->assertConflict();
        $this->assertDatabaseHas('tasks', ['id' => $task, 'title' => 'Original title']);
    }

    public function test_invalid_schedule_does_not_change_the_booking(): void
    {
        [$owner, $task, $payload] = $this->booking();
        Sanctum::actingAs($owner);
        $this->putJson("/api/customer/tasks/{$task}/details", array_merge($payload, ['scheduled_end_time' => '09:00']))
            ->assertUnprocessable()->assertJsonValidationErrors('scheduled_end_time');
        $this->assertDatabaseHas('tasks', ['id' => $task, 'title' => 'Original title', 'status' => 'open']);
    }
}
