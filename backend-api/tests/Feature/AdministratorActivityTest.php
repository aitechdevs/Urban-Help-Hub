<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdministratorActivityTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/api/admin/activity';

    public function test_active_super_admins_can_review_activity_and_credentials_are_not_logged(): void
    {
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active', 'password' => 'example password']);
        $owner = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);
        $customer = User::factory()->create(['role' => 'customer', 'status' => 'active']);

        $this->getJson(self::URL)->assertUnauthorized();
        $this->withToken($customer->createToken('test')->plainTextToken)->getJson(self::URL)->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();

        $token = $this->postJson('/api/login', ['email' => $admin->email, 'password' => 'example password'])
            ->assertOk()->json('data.token');
        $this->withToken($token)->getJson('/api/admin/dashboard?hidden=private-query')->assertOk();
        $this->getJson('/api/admin/helpers/987654')->assertNotFound();
        $this->postJson('/api/admin/administrators', ['password' => 'private-payload'])->assertForbidden();
        $this->getJson(self::URL)->assertForbidden();
        $this->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('administrator_request_events', 6);
        $this->assertDatabaseHas('administrator_request_events', [
            'actor_user_id' => $admin->id,
            'route' => 'api/admin/helpers/{userId}',
            'target_ids' => 'userId=987654',
            'response_status' => 404,
        ]);
        $this->assertDatabaseHas('administrator_request_events', [
            'actor_user_id' => $admin->id,
            'route' => 'api/admin/administrators',
            'method' => 'POST',
            'response_status' => 403,
        ]);
        $this->assertDatabaseHas('administrator_request_events', ['route' => 'api/login', 'actor_user_id' => $admin->id]);
        $this->assertDatabaseHas('administrator_request_events', ['route' => 'api/logout', 'actor_user_id' => $admin->id]);

        $this->app['auth']->forgetGuards();
        $this->withToken($owner->createToken('test')->plainTextToken);
        $result = $this->getJson(self::URL.'?actor='.$admin->id)
            ->assertOk()->assertJsonCount(6, 'data')
            ->assertJsonFragment(['actor_role' => 'admin', 'actor_name' => $admin->name]);
        foreach (['private-query', 'private-payload', 'example password', $token] as $privateValue) {
            $this->assertStringNotContainsString($privateValue, $result->getContent());
        }
    }

    public function test_existing_account_and_paypal_audit_events_are_filterable_and_paged(): void
    {
        $owner = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);
        $admin = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $time = '2026-11-01 10:01:00';
        DB::table('administrator_audit_events')->insert([
            'actor_user_id' => $owner->id, 'actor_name' => $owner->name,
            'administrator_user_id' => $admin->id, 'administrator_name' => $admin->name,
            'action' => 'created', 'new_status' => 'suspended', 'created_at' => $time,
        ]);
        DB::table('paypal_payout_audit_events')->insert(array_fill(0, 50, [
            'payout_id' => 8, 'actor_user_id' => $admin->id,
            'actor_role' => 'admin', 'action' => 'refreshed', 'created_at' => $time,
        ]));

        $this->withToken($owner->createToken('test')->plainTextToken);
        $first = $this->getJson(self::URL)->assertOk()->assertJsonCount(50, 'data');
        $next = $first->json('next_cursor');
        $this->assertIsString($next);

        $this->getJson(self::URL.'?cursor='.urlencode($next))
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.source', 'account')
            ->assertJsonPath('data.0.action', 'created');

        $this->getJson(self::URL.'?source=payout&actor='.$admin->id)
            ->assertOk()->assertJsonCount(50, 'data')
            ->assertJsonPath('data.0.resource', 'PayPal payout')->assertJsonPath('data.0.action', 'refreshed');
        $this->getJson(self::URL.'?cursor=bad')->assertUnprocessable()->assertJsonValidationErrors('cursor');
    }
}
