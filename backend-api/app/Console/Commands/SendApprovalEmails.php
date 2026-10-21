<?php

namespace App\Console\Commands;

use App\Services\ApprovalEmailDelivery;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class SendApprovalEmails extends Command
{
    protected $signature = 'approvals:send-emails {--limit=20 : Maximum messages processed per run} {--check : Check configuration without sending}';
    protected $description = 'Send pending final approval emails with limited retries and no duplicate successful deliveries.';

    public function handle(ApprovalEmailDelivery $delivery): int
    {
        $mailer = (string) config('mail.default');
        $driver = (string) config('mail.mailers.'.$mailer.'.transport');
        if (!$mailer || in_array($mailer, ['log', 'array'], true) || in_array($driver, ['log', 'array'], true)) {
            $this->error('Email delivery is not enabled: the default mailer is log/array or unset. Configure your existing SMTP/sendmail service. No email was sent.');
            return self::FAILURE;
        }
        if (!config('mail.from.address')) {
            $this->error('MAIL_FROM_ADDRESS is missing. No email was sent.');
            return self::FAILURE;
        }
        if ($this->option('check')) {
            $this->info('Sending mailer selected: '.$mailer.'. No email sent. This checks configuration only, not SMTP connectivity.');
            return self::SUCCESS;
        }
        if (!Schema::hasTable('approval_email_outbox')) {
            $this->error('Run the approval email outbox migration first.');
            return self::FAILURE;
        }
        $limit = max(1, min(100, (int) $this->option('limit')));
        $counts = ['sent' => 0, 'failed' => 0, 'skipped' => 0];
        for ($i = 0; $i < $limit; $i++) {
            $result = $delivery->deliverNext();
            if ($result === null) break;
            $counts[$result]++;
        }
        $this->info("Accepted by mail transport: {$counts['sent']}; failed attempts: {$counts['failed']}; skipped: {$counts['skipped']}.");
        return $counts['failed'] ? self::FAILURE : self::SUCCESS;
    }
}
