<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use RuntimeException;
use Throwable;

class ApprovalEmailDelivery
{
    public function deliverNext(): ?string
    {
        $mail = DB::transaction(function () {
            $row = DB::table('approval_email_outbox')->whereIn('status', ['pending', 'retry'])
                ->where('attempts', '<', 3)->where(function ($q) {
                    $q->whereNull('next_attempt_at')->orWhere('next_attempt_at', '<=', now());
                })->orderBy('id')->lockForUpdate()->first();
            if (!$row) return null;
            $user = DB::table('users')->where('id', $row->user_id)->first();
            $eligible = $user && $user->email === $row->recipient && $user->status === 'active';
            if ($eligible && $row->event_type === 'helper_verified') {
                $eligible = DB::table('profiles')->where('user_id', $row->user_id)->value('verification_status') === 'verified';
            }
            if (!$eligible) {
                DB::table('approval_email_outbox')->where('id', $row->id)->update([
                    'status' => 'skipped', 'last_error' => 'Approval or recipient is no longer current.', 'updated_at' => now(),
                ]);
                return (object) ['skipped' => true];
            }
            DB::table('approval_email_outbox')->where('id', $row->id)->update([
                'status' => 'sending', 'attempts' => $row->attempts + 1, 'started_at' => now(), 'updated_at' => now(),
            ]);
            return $row;
        }, 3);
        if (!$mail) return null;
        if (isset($mail->skipped)) return 'skipped';
        try {
            $accepted = Mail::raw($mail->body, function ($message) use ($mail) {
                $message->to($mail->recipient)->subject($mail->subject);
            });
            if ($accepted === null) throw new RuntimeException('The configured mailer did not accept the message.');
            DB::table('approval_email_outbox')->where('id', $mail->id)->update([
                'status' => 'sent', 'sent_at' => now(), 'last_error' => null, 'updated_at' => now(),
            ]);
            return 'sent';
        } catch (Throwable $error) {
            $attempts = $mail->attempts + 1;
            DB::table('approval_email_outbox')->where('id', $mail->id)->update([
                'status' => $attempts >= 3 ? 'failed' : 'retry',
                'next_attempt_at' => $attempts >= 3 ? null : now()->addMinutes($attempts === 1 ? 10 : 60),
                'last_error' => mb_substr($error->getMessage(), 0, 2000), 'updated_at' => now(),
            ]);
            return 'failed';
        }
    }
}
