<?php

namespace App\Console\Commands;

use App\Services\AccountEmailConfirmation;
use Illuminate\Console\Command;

class QueueSuperAdminEmailConfirmation extends Command
{
    protected $signature = 'accounts:confirm-super-admin-email {email : Email of a newly provisioned active Super Admin}';

    protected $description = 'Queue an email confirmation for an existing Super Admin account';

    public function handle(AccountEmailConfirmation $confirmation): int
    {
        $email = trim((string) $this->argument('email'));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !$confirmation->resend($email, enrollSuperAdmin: true)) {
            $this->error('No confirmation was queued. Check the address, account status, and whether a recent link was already requested.');

            return self::FAILURE;
        }

        $this->info('Confirmation email queued. The account holder must confirm the address before signing in.');

        return self::SUCCESS;
    }
}
