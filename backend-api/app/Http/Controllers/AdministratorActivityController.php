<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\Cursor;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AdministratorActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'actor' => ['nullable', 'integer', 'min:1'],
            'source' => ['nullable', 'in:request,account,payout'],
            'cursor' => ['nullable', 'string', 'max:1024'],
        ]);

        $cursor = Cursor::fromEncoded($filters['cursor'] ?? null);
        if (isset($filters['cursor'])) {
            $position = $cursor?->toArray() ?? [];
            if (!is_string($position['created_at'] ?? null)
                || !in_array($position['source'] ?? null, ['request', 'account', 'payout'], true)
                || !filter_var($position['event_id'] ?? null, FILTER_VALIDATE_INT)
                || !is_bool($position['_pointsToNextItems'] ?? null)) {
                throw ValidationException::withMessages(['cursor' => 'The activity page link is invalid.']);
            }
        }

        $requests = DB::table('administrator_request_events')->selectRaw(
            "id as event_id, 'request' as source, actor_user_id, actor_name, actor_role, created_at,
            method as action, route as resource, target_ids as target, response_status"
        );

        $accounts = DB::table('administrator_audit_events')->selectRaw(
            "id as event_id, 'account' as source, actor_user_id, actor_name, 'super_admin' as actor_role, created_at,
            action, administrator_name as resource, administrator_user_id as target, null as response_status"
        );

        $payouts = DB::table('paypal_payout_audit_events as events')
            ->leftJoin('users as actors', 'actors.id', '=', 'events.actor_user_id')
            ->selectRaw(
                "events.id as event_id, 'payout' as source, events.actor_user_id, actors.name as actor_name,
                events.actor_role, events.created_at, events.action, 'PayPal payout' as resource,
                events.payout_id as target, null as response_status"
            );

        $events = DB::query()
            ->fromSub($requests->unionAll($accounts)->unionAll($payouts), 'activity')
            ->when($filters['actor'] ?? null, fn ($query, $actor) => $query->where('actor_user_id', $actor))
            ->when($filters['source'] ?? null, fn ($query, $source) => $query->where('source', $source))
            ->orderByDesc('created_at')
            ->orderByDesc('source')
            ->orderByDesc('event_id')
            ->cursorPaginate(50, ['*'], 'cursor', $cursor);

        $data = array_map(function (object $event): object {
            $event = clone $event;
            $event->created_at = Carbon::parse($event->created_at)->toIso8601String();

            return $event;
        }, $events->items());

        return response()->json([
            'success' => true,
            'data' => $data,
            'next_cursor' => $events->nextCursor()?->encode(),
            'previous_cursor' => $events->previousCursor()?->encode(),
        ])->header('Cache-Control', 'private, no-store');
    }
}
