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
        array $data = []
    ): void {
        DB::table('notifications')->insert([
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
    }

    public static function sendToAdmins(
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = '/admin',
        array $data = []
    ): void {
        DB::table('users')
            ->where('role', 'admin')
            ->where('status', 'active')
            ->pluck('id')
            ->each(fn ($adminId) => self::send((int) $adminId, $type, $title, $message, $actionUrl, $data));
    }
}
