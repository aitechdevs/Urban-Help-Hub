<?php

namespace App\Http\Controllers;

use App\Support\InAppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CustomerTaskDetailsController extends Controller
{
    public function __invoke(Request $request, int $taskId): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'customer') {
            return response()->json(['success' => false, 'message' => 'Only Customer accounts can edit tasks.'], 403);
        }
        $validated = $request->validate([
            'service_category_id' => [
                'required',
                'integer',
                Rule::exists('service_categories', 'id')->where('is_active', true),
            ],
            'expected_updated_at' => ['nullable', 'string', 'max:40'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'address_line_1' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'province' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:20'],
            'country' => ['required', 'string', 'max:100'],
            'scheduled_date' => ['required', 'date', 'after_or_equal:today'],
            'scheduled_start_time' => ['required', 'date_format:H:i'],
            'scheduled_end_time' => ['nullable', 'date_format:H:i', 'after:scheduled_start_time'],
            'is_time_flexible' => ['sometimes', 'boolean'],
            'pricing_type' => ['required', Rule::in(['hourly', 'fixed', 'flexible'])],
            'budget_min' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'budget_max' => ['nullable', 'numeric', 'gte:budget_min', 'max:99999999'],
        ]);
        $outcome = DB::transaction(function () use ($user, $taskId, $validated) {
            $task = DB::table('tasks')->where('id', $taskId)->lockForUpdate()->first();
            if (!$task || (int) $task->customer_id !== (int) $user->id) {
                return ['error' => 'Task not found.', 'status' => 404];
            }
            if (!in_array($task->status, ['draft', 'pending_approval', 'open', 'awaiting_confirmation', 'scheduled'], true)
                || DB::table('task_assignments')->where('task_id', $taskId)->whereIn('status', ['in_progress', 'awaiting_completion', 'completed'])->exists()
                || DB::table('payments')->where('task_id', $taskId)->exists()) {
                return ['error' => 'This task can no longer be edited. Work has started or payment is recorded.', 'status' => 409];
            }
            if (!empty($validated['expected_updated_at']) && $validated['expected_updated_at'] !== (string) $task->updated_at) {
                return ['error' => 'This task has changed since you opened it. Reload the task before saving.', 'status' => 409];
            }
            unset($validated['expected_updated_at']);
            $now = now();
            // New address record avoids altering addresses used by other bookings.
            $addressId = DB::table('addresses')->insertGetId([
                'user_id' => $user->id, 'label' => 'Task location', 'address_type' => 'task',
                'address_line_1' => $validated['address_line_1'],
                'city' => $validated['city'], 'province' => $validated['province'],
                'postal_code' => strtoupper($validated['postal_code']), 'country' => $validated['country'],
                'created_at' => $now, 'updated_at' => $now,
            ]);
            $details = $validated;
            unset($details['address_line_1']);
            DB::table('tasks')->where('id', $taskId)->update(array_merge($details, [
                'address_id' => $addressId, 'postal_code' => strtoupper($validated['postal_code']),
                'status' => 'pending_approval', 'published_at' => null, 'updated_at' => $now,
                'latitude' => null, 'longitude' => null,
            ]));
            $assignments = DB::table('task_assignments')->where('task_id', $taskId)
                ->whereIn('status', ['offered', 'accepted', 'confirmed'])->get();
            foreach ($assignments as $assignment) {
                InAppNotification::send((int) $assignment->helper_id, 'task_updated', 'Task details changed',
                    'The Customer edited “'.$task->title.'”. Any previous offer or booking is withdrawn pending review.',
                    '/helper/dashboard', ['task_id' => $taskId]);
            }
            DB::table('task_assignments')->where('task_id', $taskId)
                ->whereIn('status', ['offered', 'accepted', 'confirmed'])
                ->update(['status' => 'not_selected', 'accepted_at' => null, 'updated_at' => $now]);
            DB::table('task_status_history')->insert([
                'task_id' => $taskId, 'changed_by' => $user->id, 'from_status' => $task->status,
                'to_status' => 'pending_approval', 'notes' => 'Customer edited task; renewed approval and Helper confirmation required.',
                'changed_at' => $now, 'created_at' => $now, 'updated_at' => $now,
            ]);
            InAppNotification::sendToAdmins('task_updated', 'Updated task awaiting approval',
                $user->name.' edited “'.$validated['title'].'”.', '/admin', ['task_id' => $taskId]);
            return ['success' => true];
        }, 3);
        if (isset($outcome['error'])) {
            return response()->json(['success' => false, 'message' => $outcome['error']], $outcome['status']);
        }
        return response()->json(['success' => true, 'message' => 'Task updated and submitted for approval. Helpers must confirm the updated details.']);
    }

}
