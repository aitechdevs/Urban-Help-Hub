<?php

namespace App\Http\Controllers;

use App\Support\NotificationDestination;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $userId = $user->id;
        $notifications = DB::table('notifications')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->limit(30)
            ->get()
            ->map(function (object $notification) use ($user): object {
                $data = json_decode($notification->data ?? '', true);
                $notification->action_url = NotificationDestination::for(
                    $user->role, $notification->type, is_array($data) ? $data : [], $notification->action_url
                );

                return $notification;
            });

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => DB::table('notifications')
                    ->where('user_id', $userId)
                    ->whereNull('read_at')
                    ->count(),
            ],
        ]);
    }

    public function markRead(Request $request, int $notificationId): JsonResponse
    {
        $updated = DB::table('notifications')
            ->where('id', $notificationId)
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        if (!$updated && !DB::table('notifications')->where('id', $notificationId)->where('user_id', $request->user()->id)->exists()) {
            return response()->json(['success' => false, 'message' => 'Notification not found.'], 404);
        }

        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        DB::table('notifications')
            ->where('user_id', $request->user()->id)
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);

        return response()->json(['success' => true]);
    }
}
