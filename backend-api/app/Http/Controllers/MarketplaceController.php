<?php

namespace App\Http\Controllers;

use App\Support\TaskScheduleDate;

use App\Services\TaskPayments;
use App\Support\InAppNotification;
use App\Support\TaskMatching;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MarketplaceController extends Controller
{
    public function customerTasks(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'customer') {
            return $this->forbidden('This area is only available to Customer accounts.');
        }

        $tasks = DB::table('tasks')
            ->join('service_categories', 'tasks.service_category_id', '=', 'service_categories.id')
            ->leftJoin('addresses', 'tasks.address_id', '=', 'addresses.id')
            ->where('tasks.customer_id', $user->id)
            ->select([
                'tasks.*',
                'service_categories.name as service_name',
                'service_categories.slug as service_slug',
                'addresses.address_line_1',
            ])
            ->orderByDesc('tasks.created_at')
            ->get();

        foreach ($tasks as $task) {
            $task->status_note = DB::table('task_status_history')
                ->where('task_id', $task->id)
                ->where('to_status', $task->status)
                ->orderByDesc('changed_at')
                ->value('notes');
            $task->candidates = DB::table('task_assignments')
                ->join('users', 'task_assignments.helper_id', '=', 'users.id')
                ->leftJoin('profiles', 'users.id', '=', 'profiles.user_id')
                ->where('task_assignments.task_id', $task->id)
                ->whereIn('task_assignments.status', [
                    'accepted',
                    'confirmed',
                    'in_progress',
                    'awaiting_completion',
                    'completed',
                ])
                ->select([
                    'task_assignments.id as assignment_id',
                    'task_assignments.status',
                    'task_assignments.agreed_hourly_rate',
                    'task_assignments.agreed_fixed_price',
                    'task_assignments.accepted_at',
                    'task_assignments.started_at',
                    'task_assignments.completed_at',
                    'users.id as helper_id',
                    'users.name as helper_name',
                    'profiles.headline',
                ])
                ->orderBy('task_assignments.accepted_at')
                ->get();

            $task->payment = DB::table('payments')
                ->where('task_id', $task->id)
                ->select([
                    'id',
                    'provider',
                    'customer_confirmed_at',
                    'currency',
                    'subtotal_amount',
                    'platform_fee',
                    'total_amount',
                    'status',
                ])
                ->first();

            if ($task->payment?->provider === 'paypal') {
                $task->payment->installments = DB::table('payment_installments')
                    ->where('payment_id', $task->payment->id)->where('status', '!=', 'superseded')
                    ->get(['stage', 'amount_minor', 'status', DB::raw('CASE WHEN paypal_order_id IS NULL THEN 0 ELSE 1 END AS has_order')]);
            }
            $task->can_edit = !$task->payment && in_array($task->status, [
                'draft', 'pending_approval', 'rejected', 'open', 'awaiting_confirmation', 'scheduled',
            ], true);

            $task->my_review = DB::table('reviews')
                ->where('task_id', $task->id)
                ->where('reviewer_id', $user->id)
                ->select(['id', 'rating', 'title', 'comment'])
                ->first();
        }

        return response()->json(['success' => true, 'data' => $tasks]);
    }

    public function createTask(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'customer') {
            return $this->forbidden('Only Customer accounts can post tasks.');
        }

        $validated = $request->validate([
            'service_category_id' => [
                'required',
                'integer',
                Rule::exists('service_categories', 'id')->where('is_active', true),
            ],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'address_line_1' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'province' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:20'],
            'country' => ['required', 'string', 'max:100'],
            'scheduled_date' => TaskScheduleDate::rules($request),
            'scheduled_start_time' => ['required', 'date_format:H:i'],
            'scheduled_end_time' => ['nullable', 'date_format:H:i', 'after:scheduled_start_time'],
            'is_time_flexible' => ['sometimes', 'boolean'],
            'pricing_type' => ['required', Rule::in(['hourly', 'fixed', 'flexible'])],
            'budget_min' => ['nullable', 'numeric', 'min:0', 'max:99999999'],
            'budget_max' => ['nullable', 'numeric', 'gte:budget_min', 'max:99999999'],
        ]);

        $result = DB::transaction(function () use ($user, $validated) {
            $now = now();

            $addressId = DB::table('addresses')->insertGetId([
                'user_id' => $user->id,
                'label' => 'Task address',
                'address_type' => 'task',
                'address_line_1' => $validated['address_line_1'],
                'city' => $validated['city'],
                'province' => $validated['province'],
                'postal_code' => strtoupper($validated['postal_code']),
                'country' => $validated['country'],
                'is_default' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $taskId = DB::table('tasks')->insertGetId([
                'customer_id' => $user->id,
                'service_category_id' => $validated['service_category_id'],
                'address_id' => $addressId,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'status' => 'pending_approval',
                'pricing_type' => $validated['pricing_type'],
                'currency' => $user->currency_code ?: 'CAD',
                'budget_min' => $validated['budget_min'] ?? null,
                'budget_max' => $validated['budget_max'] ?? null,
                'scheduled_date' => $validated['scheduled_date'],
                'scheduled_start_time' => $validated['scheduled_start_time'],
                'scheduled_end_time' => $validated['scheduled_end_time'] ?? null,
                'is_time_flexible' => $validated['is_time_flexible'] ?? false,
                'city' => $validated['city'],
                'province' => $validated['province'],
                'postal_code' => strtoupper($validated['postal_code']),
                'country' => $validated['country'],
                'published_at' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('task_status_history')->insert([
                'task_id' => $taskId,
                'changed_by' => $user->id,
                'from_status' => null,
                'to_status' => 'pending_approval',
                'notes' => 'Task submitted for Admin approval.',
                'changed_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            InAppNotification::sendToAdmins(
                'task_submitted',
                'New task awaiting approval',
                $user->name.' submitted “'.$validated['title'].'” for review.',
                '/admin',
                ['task_id' => $taskId]
            );

            return ['task_id' => $taskId, 'status' => 'pending_approval'];
        });

        return response()->json([
            'success' => true,
            'message' => 'Task submitted successfully. An Admin will review it before Helpers are notified.',
            'data' => $result,
        ], 201);
    }

    public function updateTask(Request $request, int $taskId): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'customer') {
            return $this->forbidden('Only Customer accounts can edit tasks.');
        }
        $validated = $request->validate([
            'service_category_id' => [
                'required',
                'integer',
                Rule::exists('service_categories', 'id')->where('is_active', true),
            ],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'address_line_1' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'province' => ['required', 'string', 'max:100'],
            'postal_code' => ['required', 'string', 'max:20'],
            'country' => ['required', 'string', 'max:100'],
            'scheduled_date' => TaskScheduleDate::rules($request),
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
            if (!in_array($task->status, ['draft', 'pending_approval', 'rejected', 'open', 'awaiting_confirmation', 'scheduled'], true)
                || DB::table('task_assignments')->where('task_id', $taskId)->whereIn('status', ['in_progress', 'awaiting_completion', 'completed'])->exists()
                || DB::table('payments')->where('task_id', $taskId)->exists()) {
                return ['error' => 'This task can no longer be edited. Work has started or payment is recorded.', 'status' => 409];
            }
            $now = now();
            // New address record avoids altering addresses used by other bookings.
            $addressId = DB::table('addresses')->insertGetId([
                'user_id' => $user->id, 'label' => 'Task location',
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

    public function confirmHelper(Request $request, int $taskId): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'customer') {
            return $this->forbidden('Only the Customer who posted this task can confirm a Helper.');
        }

        $validated = $request->validate([
            'assignment_id' => ['required', 'integer'],
        ]);

        $outcome = DB::transaction(function () use ($user, $taskId, $validated) {
            $task = DB::table('tasks')->where('id', $taskId)->lockForUpdate()->first();

            if (!$task || (int) $task->customer_id !== (int) $user->id) {
                return ['error' => 'Task not found.', 'status' => 404];
            }

            if (!in_array($task->status, ['open', 'awaiting_confirmation'], true)) {
                return ['error' => 'This task can no longer accept a Helper confirmation.', 'status' => 409];
            }

            $assignment = DB::table('task_assignments')
                ->where('id', $validated['assignment_id'])
                ->where('task_id', $taskId)
                ->where('status', 'accepted')
                ->first();

            if (!$assignment) {
                return ['error' => 'That Helper is not awaiting confirmation for this task.', 'status' => 422];
            }

            if (!TaskMatching::helperIsEligible($task, (int) $assignment->helper_id)) {
                return ['error' => 'That Helper no longer meets the eligibility requirements for this task.', 'status' => 409];
            }
            app(TaskPayments::class)->create($task, $assignment);
            $now = now();
            DB::table('task_assignments')->where('id', $assignment->id)->update([
                'status' => 'confirmed',
                'updated_at' => $now,
            ]);
            DB::table('task_assignments')
                ->where('task_id', $taskId)
                ->where('id', '!=', $assignment->id)
                ->whereIn('status', ['offered', 'accepted'])
                ->update(['status' => 'not_selected', 'updated_at' => $now]);
            DB::table('tasks')->where('id', $taskId)->update([
                'status' => 'scheduled',
                'updated_at' => $now,
            ]);
            DB::table('task_status_history')->insert([
                'task_id' => $taskId,
                'changed_by' => $user->id,
                'from_status' => $task->status,
                'to_status' => 'scheduled',
                'notes' => 'Customer confirmed a Helper.',
                'changed_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            InAppNotification::send(
                (int) $assignment->helper_id,
                'helper_confirmed',
                'You were selected for a job',
                'The Customer confirmed you for “'.$task->title.'”.',
                '/helper/dashboard',
                ['task_id' => $taskId, 'assignment_id' => $assignment->id]
            );

            return ['success' => true];
        });

        if (isset($outcome['error'])) {
            return response()->json(['success' => false, 'message' => $outcome['error']], $outcome['status']);
        }

        return response()->json(['success' => true, 'message' => 'Quotation accepted. Pay the PayPal commitment before work starts.']);
    }

    public function helperOpportunities(Request $request): JsonResponse
    {
        return $this->helperAssignments($request, ['offered'], ['open'], false);
    }

    public function helperJobs(Request $request): JsonResponse
    {
        return $this->helperAssignments(
            $request,
            ['accepted', 'confirmed', 'in_progress', 'awaiting_completion', 'completed'],
            ['open', 'awaiting_confirmation', 'scheduled', 'in_progress', 'awaiting_completion', 'completed'],
            true
        );
    }

    public function startJob(Request $request, int $assignmentId): JsonResponse
    {
        return $this->advanceJob($request, $assignmentId, 'start');
    }

    public function completeJob(Request $request, int $assignmentId): JsonResponse
    {
        return $this->advanceJob($request, $assignmentId, 'complete');
    }

    public function confirmCompletion(Request $request, int $taskId): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'customer') {
            return $this->forbidden('Only the Customer can confirm completion.');
        }

        $outcome = DB::transaction(function () use ($user, $taskId) {
            $task = DB::table('tasks')->where('id', $taskId)->lockForUpdate()->first();

            if (!$task || (int) $task->customer_id !== (int) $user->id) {
                return ['error' => 'Task not found.', 'status' => 404];
            }

            if ($task->status !== 'awaiting_completion') {
                return ['error' => 'This task is not awaiting completion approval.', 'status' => 409];
            }

            $assignment = DB::table('task_assignments')
                ->where('task_id', $taskId)
                ->where('status', 'awaiting_completion')
                ->lockForUpdate()
                ->first();

            if (!$assignment || !$assignment->started_at || !$assignment->completed_at) {
                return ['error' => 'The Helper completion record is incomplete.', 'status' => 422];
            }

            $paypal = DB::table('payments')->where('task_id', $taskId)->where('provider', 'paypal')
                ->whereExists(fn ($query) => $query->from('payment_installments')->whereColumn('payment_installments.payment_id', 'payments.id'))
                ->lockForUpdate()->first();
            if ($paypal && !app(TaskPayments::class)->commitmentVerified($paypal)) {
                return ['error' => 'The PayPal commitment payment must be verified before confirming completion.', 'status' => 409];
            }

            $now = now();
            if ($paypal) {
                DB::table('payments')->where('id', $paypal->id)->update(['customer_confirmed_at' => $now, 'updated_at' => $now]);
            }

            $minutes = max(
                15,
                Carbon::parse($assignment->started_at)->diffInMinutes(Carbon::parse($assignment->completed_at))
            );
            $hours = $minutes / 60;
            $subtotal = $assignment->agreed_fixed_price !== null
                ? (float) $assignment->agreed_fixed_price
                : round($hours * (float) ($assignment->agreed_hourly_rate ?? 0), 2);
            $feePercent = max(0, min(100, (float) config('services.marketplace.commission_percent', 30)));
            $platformFee = round($subtotal * ($feePercent / 100), 2);
            $helperNet = round($subtotal - $platformFee, 2);
            $transactionCurrency = $task->currency ?: 'CAD';
            $settlementRate = (float) config("currency.rates_to_cad.{$transactionCurrency}", 1);
            $settlementSubtotal = round($subtotal * $settlementRate, 2);
            $settlementPlatformFee = round($platformFee * $settlementRate, 2);
            $settlementHelperNet = round($helperNet * $settlementRate, 2);

            DB::table('task_assignments')->where('id', $assignment->id)->update([
                'status' => 'completed',
                'updated_at' => $now,
            ]);
            DB::table('tasks')->where('id', $taskId)->update([
                'status' => 'completed',
                'completed_at' => $now,
                'updated_at' => $now,
            ]);

            $paymentId = DB::table('payments')->where('task_id', $taskId)->value('id');
            if (!$paymentId) {
                $paymentId = DB::table('payments')->insertGetId([
                    'task_id' => $taskId,
                    'customer_id' => $user->id,
                    'helper_id' => $assignment->helper_id,
                    'provider' => 'paypal',
                    'commission_percent' => $feePercent,
                    'currency' => $transactionCurrency,
                    'settlement_currency' => 'CAD',
                    'settlement_exchange_rate' => $settlementRate,
                    'settlement_subtotal_amount' => $settlementSubtotal,
                    'settlement_platform_fee' => $settlementPlatformFee,
                    'settlement_total_amount' => $settlementSubtotal,
                    'settlement_helper_net' => $settlementHelperNet,
                    'subtotal_amount' => $subtotal,
                    'platform_fee' => $platformFee,
                    'tax_amount' => 0,
                    'total_amount' => $subtotal,
                    'refunded_amount' => 0,
                    'status' => 'pending',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            if (!DB::table('payouts')->where('task_id', $taskId)->exists()) {
                DB::table('payouts')->insert([
                    'payment_id' => $paymentId,
                    'task_id' => $taskId,
                    'helper_id' => $assignment->helper_id,
                    'provider' => 'paypal',
                    'currency' => $task->currency ?: 'CAD',
                    'gross_amount' => $subtotal,
                    'platform_deduction' => $platformFee,
                    'other_deductions' => 0,
                    'net_amount' => $helperNet,
                    'status' => 'pending',
                    'scheduled_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }

            $this->recordStatusChange(
                $taskId,
                $user->id,
                'awaiting_completion',
                'completed',
                'Customer confirmed that the work was completed.'
            );

            InAppNotification::send(
                (int) $assignment->helper_id,
                'completion_confirmed',
                'Job completion approved',
                $paypal ? 'The Customer approved completion. Earnings remain held until the balance is paid and an administrator approves release.' : 'The Customer approved completion of “'.$task->title.'”. Your payout is being processed.',
                '/helper/dashboard',
                ['task_id' => $taskId, 'payment_id' => $paymentId]
            );
            InAppNotification::sendToAdmins(
                'payment_pending',
                'Payment awaiting processing',
                '“'.$task->title.'” is complete and its payment is pending.',
                '/admin',
                ['task_id' => $taskId, 'payment_id' => $paymentId]
            );

            return [
                'payment_id' => $paymentId,
                'uses_installments' => (bool) $paypal,
                'subtotal' => $paypal->subtotal_amount ?? $subtotal,
                'platform_fee' => $paypal->platform_fee ?? $platformFee,
                'helper_net' => $paypal ? TaskPayments::money(TaskPayments::minor($paypal->subtotal_amount) - TaskPayments::minor($paypal->platform_fee)) : $helperNet,
            ];
        });

        if (isset($outcome['error'])) {
            return response()->json(['success' => false, 'message' => $outcome['error']], $outcome['status']);
        }

        return response()->json([
            'success' => true,
            'message' => $outcome['uses_installments']
                ? 'Completion confirmed. You can now pay the remaining PayPal balance.'
                : 'Completion confirmed. Payment is now pending processing.',
            'data' => $outcome,
        ]);
    }

    public function submitReview(Request $request, int $taskId): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'title' => ['nullable', 'string', 'max:150'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ]);

        $task = DB::table('tasks')->where('id', $taskId)->first();
        if (!$task || $task->status !== 'completed') {
            return response()->json(['success' => false, 'message' => 'Reviews are available after task completion.'], 409);
        }

        $assignment = DB::table('task_assignments')
            ->where('task_id', $taskId)
            ->where('status', 'completed')
            ->first();

        if (!$assignment) {
            return response()->json(['success' => false, 'message' => 'Completed Helper assignment not found.'], 404);
        }

        if ((int) $user->id === (int) $task->customer_id) {
            $revieweeId = $assignment->helper_id;
        } elseif ((int) $user->id === (int) $assignment->helper_id) {
            $revieweeId = $task->customer_id;
        } else {
            return $this->forbidden('You were not part of this task.');
        }

        DB::table('reviews')->updateOrInsert(
            [
                'task_id' => $taskId,
                'reviewer_id' => $user->id,
                'reviewee_id' => $revieweeId,
            ],
            [
                'rating' => $validated['rating'],
                'title' => $validated['title'] ?? null,
                'comment' => $validated['comment'] ?? null,
                'status' => 'published',
                'is_visible' => true,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        InAppNotification::send(
            (int) $revieweeId,
            'review_received',
            'You received a new review',
            $user->name.' left a '.$validated['rating'].'-star review.',
            $user->role === 'helper' ? '/dashboard' : '/helper/dashboard',
            ['task_id' => $taskId, 'rating' => $validated['rating']]
        );

        return response()->json(['success' => true, 'message' => 'Thank you. Your review has been saved.']);
    }

    public function acceptOpportunity(Request $request, int $assignmentId): JsonResponse
    {
        return $this->respondToOpportunity($request, $assignmentId, 'accepted');
    }

    public function declineOpportunity(Request $request, int $assignmentId): JsonResponse
    {
        return $this->respondToOpportunity($request, $assignmentId, 'declined');
    }

    private function respondToOpportunity(Request $request, int $assignmentId, string $decision): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'helper') {
            return $this->forbidden('This action is only available to Helper accounts.');
        }

        $quote = $decision === 'accepted'
            ? $request->validate(['agreed_fixed_price' => ['required', 'numeric', 'decimal:0,2', 'min:0.02', 'max:99999999.99']])['agreed_fixed_price']
            : null;

        $outcome = DB::transaction(function () use ($user, $assignmentId, $decision, $quote) {
            $taskId = DB::table('task_assignments')->where('id', $assignmentId)
                ->where('helper_id', $user->id)->value('task_id');
            $task = $taskId ? DB::table('tasks')->where('id', $taskId)->lockForUpdate()->first() : null;
            $assignment = DB::table('task_assignments')
                ->where('id', $assignmentId)
                ->where('helper_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (!$assignment) {
                return ['error' => 'Opportunity not found.', 'status' => 404];
            }

            if ($assignment->status !== 'offered') {
                return ['error' => 'This opportunity has already been answered.', 'status' => 409];
            }


            if (!$task || $task->status !== 'open') {
                return ['error' => 'This task is no longer accepting responses.', 'status' => 409];
            }

            if ($decision === 'accepted' && !TaskMatching::helperIsEligible($task, $user->id)) {
                return ['error' => 'You no longer meet the eligibility requirements for this task.', 'status' => 409];
            }

            $now = now();
            DB::table('task_assignments')->where('id', $assignmentId)->update([
                'status' => $decision,
                'agreed_fixed_price' => $quote,
                'accepted_at' => $decision === 'accepted' ? $now : null,
                'updated_at' => $now,
            ]);

            if ($decision === 'accepted') {
                DB::table('tasks')->where('id', $task->id)->update([
                    'status' => 'awaiting_confirmation',
                    'updated_at' => $now,
                ]);
                DB::table('task_status_history')->insert([
                    'task_id' => $task->id,
                    'changed_by' => $user->id,
                    'from_status' => 'open',
                    'to_status' => 'awaiting_confirmation',
                    'notes' => 'A matched Helper accepted the opportunity.',
                    'changed_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);

                InAppNotification::send(
                    (int) $task->customer_id,
                    'helper_accepted',
                    'A Helper accepted your task',
                    $user->name.' accepted “'.$task->title.'”. Please review and confirm the Helper.',
                    '/dashboard',
                    ['task_id' => $task->id, 'assignment_id' => $assignmentId]
                );
            }

            return ['success' => true];
        });

        if (isset($outcome['error'])) {
            return response()->json(['success' => false, 'message' => $outcome['error']], $outcome['status']);
        }

        return response()->json([
            'success' => true,
            'message' => $decision === 'accepted'
                ? 'Opportunity accepted. The Customer can now confirm you.'
                : 'Opportunity declined.',
        ]);
    }

    private function advanceJob(Request $request, int $assignmentId, string $action): JsonResponse
    {
        $user = $request->user();
        if ($user->role !== 'helper') {
            return $this->forbidden('This action is only available to Helper accounts.');
        }

        $outcome = DB::transaction(function () use ($user, $assignmentId, $action) {
            $taskId = DB::table('task_assignments')->where('id', $assignmentId)
                ->where('helper_id', $user->id)->value('task_id');
            $task = $taskId ? DB::table('tasks')->where('id', $taskId)->lockForUpdate()->first() : null;
            $assignment = DB::table('task_assignments')
                ->where('id', $assignmentId)
                ->where('helper_id', $user->id)
                ->lockForUpdate()
                ->first();

            if (!$assignment) {
                return ['error' => 'Job not found.', 'status' => 404];
            }

            $now = now();

            if ($action === 'start') {
                if ($assignment->status !== 'confirmed' || !$task || $task->status !== 'scheduled') {
                    return ['error' => 'Only a confirmed, scheduled job can be started.', 'status' => 409];
                }
                $paypal = DB::table('payments')->where('task_id', $task->id)->where('provider', 'paypal')
                    ->whereExists(fn ($query) => $query->from('payment_installments')->whereColumn('payment_installments.payment_id', 'payments.id'))
                    ->lockForUpdate()->first();
                if (($paypal || $assignment->agreed_fixed_price !== null) && (!$paypal || !app(TaskPayments::class)->commitmentVerified($paypal))) {
                    return ['error' => 'The Customer must pay the PayPal commitment before work starts.', 'status' => 409];
                }
                if (Carbon::parse($task->scheduled_date)->isAfter(now()->startOfDay())) {
                    return ['error' => 'This job cannot be started before its scheduled date.', 'status' => 422];
                }
                DB::table('task_assignments')->where('id', $assignmentId)->update([
                    'status' => 'in_progress', 'started_at' => $now, 'updated_at' => $now,
                ]);
                DB::table('tasks')->where('id', $task->id)->update([
                    'status' => 'in_progress', 'updated_at' => $now,
                ]);
                $this->recordStatusChange($task->id, $user->id, 'scheduled', 'in_progress', 'Helper started the job.');
                InAppNotification::send(
                    (int) $task->customer_id,
                    'job_started',
                    'Your job has started',
                    $user->name.' started work on “'.$task->title.'”.',
                    '/dashboard',
                    ['task_id' => $task->id]
                );
                return ['message' => 'Job started. The Customer can now see that work is in progress.'];
            }

            if ($assignment->status !== 'in_progress' || !$task || $task->status !== 'in_progress') {
                return ['error' => 'Only an in-progress job can be marked complete.', 'status' => 409];
            }
            DB::table('task_assignments')->where('id', $assignmentId)->update([
                'status' => 'awaiting_completion', 'completed_at' => $now, 'updated_at' => $now,
            ]);
            DB::table('tasks')->where('id', $task->id)->update([
                'status' => 'awaiting_completion', 'updated_at' => $now,
            ]);
            $this->recordStatusChange($task->id, $user->id, 'in_progress', 'awaiting_completion', 'Helper marked the job complete.');
            InAppNotification::send(
                (int) $task->customer_id,
                'completion_requested',
                'Please confirm job completion',
                $user->name.' marked “'.$task->title.'” complete. Please review the work.',
                '/dashboard',
                ['task_id' => $task->id]
            );
            return ['message' => 'Job marked complete. Waiting for Customer confirmation.'];
        });

        if (isset($outcome['error'])) {
            return response()->json(['success' => false, 'message' => $outcome['error']], $outcome['status']);
        }

        return response()->json(['success' => true, 'message' => $outcome['message']]);
    }

    private function helperAssignments(Request $request, array $assignmentStatuses, array $taskStatuses, bool $includePrivateAddress): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'helper') {
            return $this->forbidden('This area is only available to Helper accounts.');
        }

        $items = DB::table('task_assignments')
            ->join('tasks', 'task_assignments.task_id', '=', 'tasks.id')
            ->join('service_categories', 'tasks.service_category_id', '=', 'service_categories.id')
            ->join('users as customers', 'tasks.customer_id', '=', 'customers.id')
            ->leftJoin('addresses', 'tasks.address_id', '=', 'addresses.id')
            ->where('task_assignments.helper_id', $user->id)
            ->whereIn('task_assignments.status', $assignmentStatuses)
            ->whereIn('tasks.status', $taskStatuses)
            ->select([
                'task_assignments.id as assignment_id',
                'task_assignments.status as assignment_status',
                'task_assignments.agreed_hourly_rate',
                'task_assignments.agreed_fixed_price',
                'task_assignments.started_at',
                'task_assignments.completed_at',
                'tasks.id as task_id',
                'tasks.title',
                'tasks.description',
                'tasks.status as task_status',
                'tasks.pricing_type',
                'tasks.currency',
                'tasks.budget_min',
                'tasks.budget_max',
                'tasks.scheduled_date',
                'tasks.scheduled_start_time',
                'tasks.scheduled_end_time',
                'tasks.is_time_flexible',
                'tasks.city',
                'tasks.province',
                'tasks.country',
                'service_categories.name as service_name',
                'service_categories.slug as service_slug',
                'customers.name as customer_name',
                DB::raw($includePrivateAddress ? 'addresses.address_line_1 as address_line_1' : 'NULL as address_line_1'),
                DB::raw($includePrivateAddress ? 'addresses.address_line_2 as address_line_2' : 'NULL as address_line_2'),
                DB::raw($includePrivateAddress ? 'addresses.postal_code as address_postal_code' : 'NULL as address_postal_code'),
            ])
            ->orderBy('tasks.scheduled_date')
            ->orderBy('tasks.scheduled_start_time')
            ->get();

        foreach ($items as $item) {
            $payPalPayment = DB::table('payments')->where('task_id', $item->task_id)
                ->where('helper_id', $user->id)->where('provider', 'paypal')
                ->whereExists(fn ($query) => $query->from('payment_installments')->whereColumn('payment_installments.payment_id', 'payments.id'))
                ->first();
            $item->commitment_verified = $payPalPayment
                ? app(TaskPayments::class)->commitmentVerified($payPalPayment)
                : ($item->agreed_fixed_price !== null ? false : null);
            $item->payment = DB::table('payouts')
                ->where('task_id', $item->task_id)
                ->where('helper_id', $user->id)
                ->select(['currency', 'gross_amount', 'platform_deduction', 'net_amount', 'status'])
                ->first();
            $item->my_review = DB::table('reviews')
                ->where('task_id', $item->task_id)
                ->where('reviewer_id', $user->id)
                ->select(['id', 'rating', 'title', 'comment'])
                ->first();
        }

        return response()->json(['success' => true, 'data' => $items]);
    }

    private function recordStatusChange(int $taskId, int $userId, string $from, string $to, string $notes): void
    {
        DB::table('task_status_history')->insert([
            'task_id' => $taskId,
            'changed_by' => $userId,
            'from_status' => $from,
            'to_status' => $to,
            'notes' => $notes,
            'changed_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function forbidden(string $message): JsonResponse
    {
        return response()->json(['success' => false, 'message' => $message], 403);
    }
}
