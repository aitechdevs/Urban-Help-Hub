<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdministratorManagementTest extends TestCase
{
    use RefreshDatabase;

    private const URL = '/api/admin/administrators';

    private const OWNER_PASSWORD = 'Example owner password';

    private const ADMIN_PASSWORD = 'Example admin password';

    public function test_only_active_super_admins_can_access_account_management(): void
    {
        $target = User::factory()->create(['role' => 'admin']);
        $this->getJson(self::URL)->assertUnauthorized();
        $this->postJson(self::URL)->assertUnauthorized();
        $this->putJson(self::URL.'/'.$target->id)->assertUnauthorized();

        foreach ([['admin', 'active'], ['super_admin', 'suspended'], ['customer', 'active']] as [$role, $status]) {
            $actor = User::factory()->create(compact('role', 'status'));
            $this->withToken($actor->createToken('test')->plainTextToken);

            $this->getJson(self::URL)->assertForbidden();
            $this->postJson(self::URL)->assertForbidden();
            $this->putJson(self::URL.'/'.$target->id)->assertForbidden();
            $this->app['auth']->forgetGuards();
        }

        $this->assertDatabaseCount('administrator_audit_events', 0);
    }

    public function test_operational_dashboard_requires_an_active_administrator(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();

        foreach ([['admin', 'suspended'], ['super_admin', 'suspended'], ['customer', 'active'], ['helper', 'active']] as [$role, $status]) {
            $this->app['auth']->forgetGuards();
            $actor = User::factory()->create(compact('role', 'status'));
            $this->withToken($actor->createToken('test')->plainTextToken);
            $this->getJson('/api/admin/dashboard')->assertForbidden();
        }

        $this->app['auth']->forgetGuards();
        $owner = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);
        $this->withToken($owner->createToken('test')->plainTextToken);

        $this->getJson('/api/admin/dashboard')->assertOk()->assertJsonPath('data.admin.id', $owner->id);
        $this->getJson('/api/admin/helpers?status=pending')->assertOk();
        $this->getJson('/api/admin/payments')->assertOk();
        $this->getJson('/api/admin/tasks?status=pending_approval')->assertOk();
    }

    public function test_super_admin_lifecycle_is_password_protected_and_audited(): void
    {
        $owner = User::factory()->create([
            'role' => 'super_admin',
            'status' => 'active',
            'password' => self::OWNER_PASSWORD,
        ]);
        $ownerToken = $owner->createToken('test')->plainTextToken;
        $this->withToken($ownerToken);

        $input = [
            'name' => 'Operations Admin',
            'email' => 'OPS@EXAMPLE.TEST',
            'password' => self::ADMIN_PASSWORD,
            'password_confirmation' => self::ADMIN_PASSWORD,
            'current_password' => self::OWNER_PASSWORD,
            'role' => 'super_admin',
            'status' => 'active',
        ];
        $this->postJson(self::URL, array_replace($input, ['current_password' => 'invalid']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors('current_password');

        $id = $this->postJson(self::URL, $input)->assertCreated()
            ->assertJsonPath('data.role', 'admin')
            ->assertJsonPath('data.status', 'suspended')
            ->assertJsonMissingPath('data.password')
            ->json('data.id');

        $admin = User::findOrFail($id);
        $this->assertSame('ops@example.test', $admin->email);
        $this->assertTrue(Hash::check(self::ADMIN_PASSWORD, $admin->password));
        $this->postJson(self::URL, $input)->assertUnprocessable()->assertJsonValidationErrors('email');

        $credentials = ['email' => $admin->email, 'password' => self::ADMIN_PASSWORD];
        $this->postJson('/api/login', $credentials)->assertForbidden();
        $update = ['current_password' => self::OWNER_PASSWORD, 'status' => 'active'];
        $this->putJson(self::URL.'/'.$id, array_replace($update, ['current_password' => 'invalid']))
            ->assertUnprocessable()->assertJsonValidationErrors('current_password');
        $this->putJson(self::URL.'/'.$id, $update + ['role' => 'super_admin'])
            ->assertUnprocessable()->assertJsonValidationErrors('role');
        $this->putJson(self::URL.'/'.$owner->id, $update)->assertNotFound();
        $this->putJson(self::URL.'/'.$id, $update)->assertOk()->assertJsonPath('data.status', 'active');
        $this->putJson(self::URL.'/'.$id, $update)->assertOk();

        $adminToken = $this->postJson('/api/login', $credentials)->assertOk()->json('data.token');
        $this->assertSame(1, $admin->tokens()->count());

        $this->app['auth']->forgetGuards();
        $this->withToken($adminToken);
        $this->getJson('/api/admin/dashboard')->assertOk()->assertJsonPath('data.admin.id', $id);
        $this->getJson('/api/admin/helpers?status=pending')->assertOk();
        $this->getJson('/api/admin/payments')->assertOk();
        $this->getJson('/api/admin/tasks?status=pending_approval')->assertOk();
        $this->postJson(self::URL, $input)->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->withToken($ownerToken);
        $this->putJson(self::URL.'/'.$id, array_replace($update, ['status' => 'suspended']))
            ->assertOk()->assertJsonPath('data.status', 'suspended');
        $this->assertSame(0, $admin->tokens()->count());
        $this->postJson('/api/login', $credentials)->assertForbidden();

        $this->getJson(self::URL)->assertOk()
            ->assertJsonCount(3, 'audit_events')
            ->assertJsonPath('audit_events.0.action', 'suspended')
            ->assertJsonPath('audit_events.0.previous_status', 'active')
            ->assertJsonPath('audit_events.0.new_status', 'suspended')
            ->assertJsonPath('audit_events.0.actor_user_id', $owner->id)
            ->assertJsonPath('audit_events.0.administrator_user_id', $id)
            ->assertJsonPath('audit_events.1.action', 'activated')
            ->assertJsonPath('audit_events.2.action', 'created')
            ->assertJsonMissingPath('audit_events.0.password');
    }
}
