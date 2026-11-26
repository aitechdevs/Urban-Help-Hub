<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class InAppNotification
{
    public static function send(
        int $userId,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        array $data = [],
        bool $email = false
    ): void {
        $recipient = $email ? DB::table('users')->where('id', $userId)
            ->whereIn('role', ['helper', 'customer'])->first(['role', 'email']) : null;
        if ($recipient) {
            $actionUrl = NotificationDestination::for($recipient->role, $type, $data, $actionUrl);
        }

        $id = DB::table('notifications')->insertGetId([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'action_url' => $actionUrl,
            'data' => $data ? json_encode($data) : null,
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if ($recipient && $recipient->email) {
            DB::table('approval_email_outbox')->insertOrIgnore([
                'event_key' => 'notification:'.$id,
                'user_id' => $userId,
                'event_type' => $type,
                'recipient' => $recipient->email,
                'subject' => 'UrbanHelpHub: '.$title,
                'body' => $title."\n\n".$message."\n\nView in UrbanHelpHub: ".NotificationDestination::emailLink($actionUrl)."\n",
                'status' => 'pending',
                'attempts' => 0,
                'next_attempt_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public static function sendToAdmins(
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = '/admin',
        array $data = []
    ): void {
        DB::table('users')
            ->whereIn('role', ['admin', 'super_admin'])
            ->where('status', 'active')
            ->pluck('id')
            ->each(fn ($adminId) => self::send((int) $adminId, $type, $title, $message, $actionUrl, $data));
    }
}
