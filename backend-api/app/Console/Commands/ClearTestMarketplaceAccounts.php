<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ClearTestMarketplaceAccounts extends Command
{
    protected $signature = 'marketplace:clear-test-accounts
        {ids?* : Explicit IDs of confirmed test Customers and Helpers}
        {--apply : Permanently remove the selected test accounts}';

    protected $description = 'Preview or remove selected test marketplace accounts while protecting administrators and Live payment records';

    public function handle(): int
    {
        $input = $this->argument('ids');
        if (!$input) {
            if ($this->option('apply')) {
                $this->error('Provide explicit test account IDs before using --apply.');

                return self::FAILURE;
            }
            $accounts = User::query()->whereIn('role', ['customer', 'helper'])->orderBy('id')
                ->get(['id', 'name', 'email', 'role', 'status', 'created_at']);
            $this->table(['ID', 'Name', 'Email', 'Role', 'Status', 'Created'], $accounts->toArray());
            $this->info('Identify the test accounts and run the command again with those IDs to preview their linked records.');

            return self::SUCCESS;
        }
        if (array_filter($input, fn ($id) => !filter_var($id, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]))) {
            $this->error('Account IDs must be positive integers.');

            return self::FAILURE;
        }

        $ids = array_values(array_unique(array_map('intval', $input)));
        sort($ids);
        if ($this->option('apply') && !$this->confirm('Permanently delete the confirmed test accounts #'.implode(', #', $ids).' and their eligible linked records?')) {
            $this->info('No accounts were removed.');

            return self::FAILURE;
        }

        return DB::transaction(function () use ($ids): int {
            $users = User::query()->whereIn('id', $ids)->whereIn('role', ['customer', 'helper'])
                ->orderBy('id')->lockForUpdate()->get();
            if ($users->count() !== count($ids)) {
                $this->error('Every ID must belong to an existing Customer or Helper.');

                return self::FAILURE;
            }

            $tasks = DB::table('tasks')->whereIn('customer_id', $ids)->select('id');
            $payments = DB::table('payments')->where(function ($query) use ($ids, $tasks) {
                $query->whereIn('customer_id', $ids)->orWhereIn('helper_id', $ids)->orWhereIn('task_id', clone $tasks);
            });
            $payouts = DB::table('payouts')->where(function ($query) use ($ids, $tasks, $payments) {
                $query->whereIn('helper_id', $ids)->orWhereIn('task_id', clone $tasks)
                    ->orWhereIn('payment_id', (clone $payments)->select('id'));
            });

            $this->table(['ID', 'Email', 'Role'], $users->map(fn (User $user) => [$user->id, $user->email, $user->role]));
            $this->info(sprintf('Linked records: %d tasks, %d payments, %d payouts.', $tasks->count(), $payments->count(), $payouts->count()));

            $sandboxPayments = DB::table('payments')->where('provider', 'paypal')->where('paypal_mode', 'sandbox')
                ->whereIn('customer_id', $ids)->where(function ($query) use ($ids) {
                    $query->whereNull('helper_id')->orWhereIn('helper_id', $ids);
                })->select('id');
            $unsafePayment = (clone $payments)->whereNotIn('id', clone $sandboxPayments)->exists();
            $unsafePayout = (clone $payouts)->where(function ($query) use ($ids, $sandboxPayments) {
                $query->whereNull('payment_id')->orWhereNotIn('payment_id', clone $sandboxPayments)
                    ->orWhereNotIn('helper_id', $ids)->orWhere('provider', '!=', 'paypal')
                    ->orWhere(function ($query) {
                        $query->whereNotNull('paypal_mode')->where('paypal_mode', '!=', 'sandbox');
                    })->orWhere(function ($query) {
                        $query->whereNull('paypal_mode')->where(function ($legacy) {
                            $legacy->whereNotIn('status', ['pending', 'ready'])
                                ->orWhereNotNull('provider_payout_id')->orWhereNotNull('paypal_sender_batch_id')
                                ->orWhereNotNull('paypal_batch_id')->orWhereNotNull('paypal_item_id')->orWhereNotNull('paid_at');
                        });
                    });
            })->exists();
            $selectedTasksWithOtherPeople = DB::table('task_assignments')->whereIn('task_id', clone $tasks)
                ->whereNotIn('helper_id', $ids)->whereNotIn('status', ['offered', 'declined', 'not_selected'])->exists();
            $selectedHelpersWithOtherBookings = DB::table('task_assignments')->whereIn('helper_id', $ids)
                ->whereNotIn('task_id', clone $tasks)->whereNotIn('status', ['offered', 'declined', 'not_selected'])->exists();
            if ($unsafePayment || $unsafePayout || $selectedTasksWithOtherPeople || $selectedHelpersWithOtherBookings
                || $this->sharedRecords('messages', 'sender_id', 'recipient_id', $ids, $tasks)
                || $this->sharedRecords('reviews', 'reviewer_id', 'reviewee_id', $ids, $tasks)) {
                $this->error('Deletion blocked. The selection includes Live or unclassified financial records, or activity shared with accounts outside the selection.');

                return self::FAILURE;
            }
            if (!$this->option('apply')) {
                $this->info('Preview complete. Re-run with these IDs and --apply after backing up the database.');

                return self::SUCCESS;
            }

            DB::table('password_reset_tokens')->whereIn('email', $users->pluck('email'))->delete();
            DB::table('sessions')->whereIn('user_id', $ids)->delete();
            DB::table('paypal_payout_accounts')->whereIn('helper_id', $ids)->delete();
            // Explicitly remove verified Sandbox finance rows, including the ones held by nullable relations.
            $payouts->delete();
            $payments->delete();
            foreach ($users as $user) {
                $user->tokens()->delete();
                $user->delete();
            }

            $this->info('Selected test accounts removed.');

            return self::SUCCESS;
        }, 3);
    }

    private function sharedRecords(string $table, string $first, string $second, array $ids, $tasks): bool
    {
        return DB::table($table)->where(function ($query) use ($first, $second, $ids, $tasks) {
            $query->whereIn($first, $ids)->orWhereIn($second, $ids)->orWhereIn('task_id', clone $tasks);
        })->where(function ($query) use ($first, $second, $ids) {
            $query->whereNotIn($first, $ids)->orWhereNotIn($second, $ids);
        })->exists();
    }
}
