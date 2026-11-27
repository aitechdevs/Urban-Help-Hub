<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ClearTestMarketplaceAccountsTest extends TestCase
{
    use RefreshDatabase;

    private const COMMAND = 'marketplace:clear-test-accounts';

    public function test_preview_and_deletion_keep_both_administrator_roles_and_other_users(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $helper = User::factory()->create(['role' => 'helper']);
        $admin = User::factory()->create(['role' => 'admin']);
        $owner = User::factory()->create(['role' => 'super_admin']);
        $otherCustomer = User::factory()->create(['role' => 'customer']);
        $customer->createToken('test');
        $task = $this->paymentTask($customer);
        $payment = $this->payment($task, $customer, $helper, 'sandbox');
        DB::table('payouts')->insert([
            'task_id' => $task, 'payment_id' => $payment, 'helper_id' => $helper->id, 'provider' => 'paypal',
            'gross_amount' => '10.00', 'net_amount' => '6.00',
        ]);
        $ids = [$customer->id, $helper->id];

        $this->artisan(self::COMMAND)->assertSuccessful();
        $this->artisan(self::COMMAND, ['ids' => [...$ids, $admin->id]])->assertFailed();
        $this->artisan(self::COMMAND, ['ids' => $ids])->assertSuccessful();
        $this->assertDatabaseHas('users', ['id' => $customer->id]);
        $this->assertDatabaseCount('payouts', 1);

        $this->artisan(self::COMMAND, ['ids' => $ids, '--apply' => true])
            ->expectsConfirmation("Permanently delete the confirmed test accounts #{$customer->id}, #{$helper->id} and their eligible linked records?", 'yes')
            ->assertSuccessful();

        foreach ([$admin, $owner, $otherCustomer] as $account) {
            $this->assertDatabaseHas('users', ['id' => $account->id, 'role' => $account->role]);
        }
        foreach (['tasks', 'payments', 'payouts', 'personal_access_tokens'] as $table) {
            $this->assertDatabaseCount($table, 0);
        }
        $this->assertDatabaseMissing('users', ['id' => $customer->id]);
        $this->assertDatabaseMissing('users', ['id' => $helper->id]);
    }

    public function test_live_payment_and_unselected_participants_block_cleanup(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $helper = User::factory()->create(['role' => 'helper']);
        $task = $this->paymentTask($customer);
        $payment = $this->payment($task, $customer, $helper, 'live');

        $this->artisan(self::COMMAND, ['ids' => [$customer->id, $helper->id]])->assertFailed();
        DB::table('payments')->where('id', $payment)->update(['paypal_mode' => 'sandbox']);
        $this->artisan(self::COMMAND, ['ids' => [$customer->id]])->assertFailed();
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseCount('users', 2);
    }

    private function paymentTask(User $customer): int
    {
        $category = DB::table('service_categories')->insertGetId(['name' => 'Test service', 'slug' => 'test-service']);

        return DB::table('tasks')->insertGetId([
            'customer_id' => $customer->id, 'service_category_id' => $category, 'description' => 'Test task',
        ]);
    }

    private function payment(int $task, User $customer, User $helper, string $mode): int
    {
        return DB::table('payments')->insertGetId([
            'task_id' => $task, 'customer_id' => $customer->id, 'helper_id' => $helper->id,
            'provider' => 'paypal', 'paypal_mode' => $mode, 'subtotal_amount' => '10.00', 'total_amount' => '10.00',
        ]);
    }
}
