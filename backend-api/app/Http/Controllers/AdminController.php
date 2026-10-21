<?php

namespace App\Http\Controllers;

use App\Support\InAppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminController extends Controller
{
    /**
     * Main Admin dashboard statistics.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $pendingHelpers = DB::table('users')
            ->where('role', 'helper')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('helper_services')
                    ->whereColumn(
                        'helper_services.user_id',
                        'users.id'
                    )
                    ->where(
                        'helper_services.approval_status',
                        'pending'
                    );
            })
            ->count();

        $pendingServices = DB::table('helper_services')
            ->where('approval_status', 'pending')
            ->count();

        $verifiedHelpers = DB::table('profiles')
            ->join(
                'users',
                'profiles.user_id',
                '=',
                'users.id'
            )
            ->where('users.role', 'helper')
            ->where(
                'profiles.verification_status',
                'verified'
            )
            ->count();

        $activeHelpers = DB::table('users')
            ->where('users.role', 'helper')
            ->where('users.status', 'active')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('helper_services')
                    ->whereColumn(
                        'helper_services.user_id',
                        'users.id'
                    )
                    ->where(
                        'helper_services.approval_status',
                        'approved'
                    )
                    ->where(
                        'helper_services.is_active',
                        true
                    );
            })
            ->count();

        $totalCustomers = DB::table('users')
            ->where('role', 'customer')
            ->count();

        $totalHelpers = DB::table('users')
            ->where('role', 'helper')
            ->count();

        $completedTasks = DB::table('tasks')->where('status', 'completed')->count();
        $pendingPayments = DB::table('payments')->where('status', 'pending')->count();
        $pendingPayouts = DB::table('payouts')->where('status', 'pending')->count();
        $grossVolume = (float) DB::table('payments')->sum('settlement_total_amount');
        $platformRevenue = (float) DB::table('payments')->sum('settlement_platform_fee');
        $pendingTasks = DB::table('tasks')->where('status', 'pending_approval')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'admin' => $request->user(),
                'stats' => [
                    'pending_helpers' => $pendingHelpers,
                    'pending_services' => $pendingServices,
                    'verified_helpers' => $verifiedHelpers,
                    'active_helpers' => $activeHelpers,
                    'total_customers' => $totalCustomers,
                    'total_helpers' => $totalHelpers,
                    'completed_tasks' => $completedTasks,
                    'pending_payments' => $pendingPayments,
                    'pending_payouts' => $pendingPayouts,
                    'gross_volume' => $grossVolume,
                    'platform_revenue' => $platformRevenue,
                    'settlement_currency' => 'CAD',
                    'pending_tasks' => $pendingTasks,
                ],
            ],
        ]);
    }

    public function payments(Request $request): JsonResponse
    {
        $payments = DB::table('payments')
            ->join('tasks', 'payments.task_id', '=', 'tasks.id')
            ->join('users as customers', 'payments.customer_id', '=', 'customers.id')
            ->leftJoin('users as helpers', 'payments.helper_id', '=', 'helpers.id')
            ->leftJoin('payouts', 'payments.id', '=', 'payouts.payment_id')
            ->select([
                'payments.id',
                'payments.task_id',
                'payments.currency',
                'payments.subtotal_amount',
                'payments.platform_fee',
                'payments.tax_amount',
                'payments.total_amount',
                'payments.settlement_currency',
                'payments.settlement_exchange_rate',
                'payments.settlement_subtotal_amount',
                'payments.settlement_platform_fee',
                'payments.settlement_total_amount',
                'payments.settlement_helper_net',
                'payments.status',
                'payments.provider',
                'payments.paid_at',
                'payments.created_at',
                'tasks.title as task_title',
                'customers.name as customer_name',
                'helpers.name as helper_name',
                'payouts.id as payout_id',
                'payouts.net_amount as helper_net',
                'payouts.status as payout_status',
                'payouts.paid_at as payout_paid_at',
            ])
            ->orderByDesc('payments.created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $payments]);
    }

    public function tasks(Request $request): JsonResponse
    {
        $status = $request->query('status', 'pending_approval');
        $allowed = ['pending_approval', 'open', 'rejected', 'scheduled', 'in_progress', 'completed', 'all'];
        if (!in_array($status, $allowed, true)) {
            $status = 'pending_approval';
        }

        $query = DB::table('tasks')
            ->join('users as customers', 'tasks.customer_id', '=', 'customers.id')
            ->join('service_categories', 'tasks.service_category_id', '=', 'service_categories.id')
            ->leftJoin('addresses', 'tasks.address_id', '=', 'addresses.id')
            ->select([
                'tasks.id', 'tasks.title', 'tasks.description', 'tasks.status',
                'tasks.pricing_type', 'tasks.budget_min', 'tasks.budget_max',
                'tasks.scheduled_date', 'tasks.scheduled_start_time',
                'tasks.city', 'tasks.province', 'tasks.country', 'tasks.created_at',
                'customers.name as customer_name', 'customers.email as customer_email',
                'service_categories.name as service_name',
                'addresses.address_line_1', 'addresses.postal_code',
            ])
            ->orderByDesc('tasks.created_at');

        if ($status !== 'all') {
            $query->where('tasks.status', $status);
        }

        return response()->json(['success' => true, 'data' => $query->get()]);
    }

    public function updateTaskApproval(Request $request, int $taskId): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validated['decision'] === 'rejected' && empty(trim($validated['reason'] ?? ''))) {
            return response()->json(['success' => false, 'message' => 'Please provide a reason when rejecting a task.'], 422);
        }

        $outcome = DB::transaction(function () use ($request, $taskId, $validated) {
            $task = DB::table('tasks')->where('id', $taskId)->lockForUpdate()->first();
            if (!$task) {
                return ['error' => 'Task not found.', 'status' => 404];
            }
            if ($task->status !== 'pending_approval') {
                return ['error' => 'This task has already been reviewed.', 'status' => 409];
            }

            $now = now();
            if ($validated['decision'] === 'rejected') {
                DB::table('tasks')->where('id', $taskId)->update(['status' => 'rejected', 'updated_at' => $now]);
                $this->recordTaskStatus($taskId, $request->user()->id, 'pending_approval', 'rejected', $validated['reason']);
                InAppNotification::send(
                    (int) $task->customer_id,
                    'task_rejected',
                    'Task requires changes',
                    '“'.$task->title.'” was not approved: '.$validated['reason'],
                    '/dashboard',
                    ['task_id' => $taskId]
                );
                return ['matched_helpers' => 0, 'message' => 'Task rejected. The Customer can see the review reason.'];
            }

            $provinceAliases = $this->provinceAliases($task->country, $task->province);
            $helpers = DB::table('helper_services')
                ->join('users', 'helper_services.user_id', '=', 'users.id')
                ->join('profiles', 'users.id', '=', 'profiles.user_id')
                ->where('helper_services.service_category_id', $task->service_category_id)
                ->where('helper_services.approval_status', 'approved')
                ->where('helper_services.is_active', true)
                ->where('users.role', 'helper')
                ->where('users.status', 'active')
                ->where('users.currency_code', $task->currency ?: 'CAD')
                ->where('profiles.verification_status', 'verified')
                ->whereRaw('LOWER(profiles.country) = LOWER(?)', [$task->country])
                ->whereIn(DB::raw('LOWER(profiles.province)'), $provinceAliases)
                ->whereRaw('LOWER(profiles.city) = LOWER(?)', [$task->city])
                ->select(['users.id', 'helper_services.hourly_rate'])
                ->get();

            foreach ($helpers as $helper) {
                DB::table('task_assignments')->updateOrInsert(
                    ['task_id' => $taskId, 'helper_id' => $helper->id],
                    ['status' => 'offered', 'agreed_hourly_rate' => $helper->hourly_rate, 'assigned_at' => $now, 'updated_at' => $now, 'created_at' => $now]
                );
                InAppNotification::send(
                    (int) $helper->id,
                    'new_opportunity',
                    'New job opportunity',
                    'A new “'.$task->title.'” task matches your services and location.',
                    '/helper/dashboard',
                    ['task_id' => $taskId]
                );
            }

            DB::table('tasks')->where('id', $taskId)->update(['status' => 'open', 'published_at' => $now, 'updated_at' => $now]);
            $this->recordTaskStatus($taskId, $request->user()->id, 'pending_approval', 'open', 'Admin approved and published the task.');
            InAppNotification::send(
                (int) $task->customer_id,
                'task_approved',
                'Your task is now live',
                '“'.$task->title.'” was approved and published to eligible Helpers.',
                '/dashboard',
                ['task_id' => $taskId, 'matched_helpers' => $helpers->count()]
            );
            return [
                'matched_helpers' => $helpers->count(),
                'message' => $helpers->count() > 0
                    ? 'Task approved and eligible Helpers were notified.'
                    : 'Task approved. No eligible Helper currently matches this location and service.',
            ];
        });

        if (isset($outcome['error'])) {
            return response()->json(['success' => false, 'message' => $outcome['error']], $outcome['status']);
        }
        return response()->json(['success' => true, 'message' => $outcome['message'], 'data' => $outcome]);
    }

    private function recordTaskStatus(int $taskId, int $userId, string $from, string $to, string $notes): void
    {
        DB::table('task_status_history')->insert([
            'task_id' => $taskId, 'changed_by' => $userId,
            'from_status' => $from, 'to_status' => $to, 'notes' => $notes,
            'changed_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    private function provinceAliases(?string $country, ?string $province): array
    {
        $normalized = strtolower(trim((string) $province));
        if (strtolower(trim((string) $country)) !== 'canada') return [$normalized];
        $canada = [
            'ab' => 'alberta', 'bc' => 'british columbia', 'mb' => 'manitoba',
            'nb' => 'new brunswick', 'nl' => 'newfoundland and labrador', 'ns' => 'nova scotia',
            'nt' => 'northwest territories', 'nu' => 'nunavut', 'on' => 'ontario',
            'pe' => 'prince edward island', 'qc' => 'quebec', 'sk' => 'saskatchewan', 'yt' => 'yukon',
        ];
        foreach ($canada as $code => $name) {
            if ($normalized === $code || $normalized === $name) return [$code, $name];
        }
        return [$normalized];
    }

    public function updatePaymentStatus(Request $request, int $paymentId): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'paid', 'failed', 'refunded'])],
        ]);

        $payment = DB::table('payments')->where('id', $paymentId)->first();
        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found.'], 404);
        }

        if ($payment->provider === 'stripe') {
            return response()->json([
                'success' => false,
                'message' => 'Stripe payment status is managed by signed webhooks and cannot be changed manually.',
            ], 409);
        }

        $status = $validated['status'];
        DB::table('payments')->where('id', $paymentId)->update([
            'status' => $status,
            'paid_at' => $status === 'paid' ? now() : $payment->paid_at,
            'failed_at' => $status === 'failed' ? now() : null,
            'refunded_at' => $status === 'refunded' ? now() : null,
            'updated_at' => now(),
        ]);

        if ($status === 'paid') {
            InAppNotification::send(
                (int) $payment->customer_id,
                'payment_paid',
                'Payment received',
                'Your task payment has been recorded successfully.',
                '/dashboard',
                ['payment_id' => $paymentId, 'task_id' => $payment->task_id]
            );
        }

        return response()->json(['success' => true, 'message' => 'Payment status updated.']);
    }

    public function updatePayoutStatus(Request $request, int $payoutId): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'paid', 'failed'])],
        ]);

        $payout = DB::table('payouts')->where('id', $payoutId)->first();
        if (!$payout) {
            return response()->json(['success' => false, 'message' => 'Payout not found.'], 404);
        }

        if ($payout->provider === 'stripe') {
            return response()->json([
                'success' => false,
                'message' => 'Stripe payout status is managed automatically and cannot be changed manually.',
            ], 409);
        }

        if ($validated['status'] === 'paid') {
            $paymentPaid = $payout->payment_id && DB::table('payments')
                ->where('id', $payout->payment_id)
                ->where('status', 'paid')
                ->exists();
            if (!$paymentPaid) {
                return response()->json([
                    'success' => false,
                    'message' => 'The Customer payment must be marked paid before releasing the Helper payout.',
                ], 409);
            }
        }

        DB::table('payouts')->where('id', $payoutId)->update([
            'status' => $validated['status'],
            'processed_at' => in_array($validated['status'], ['paid', 'failed'], true) ? now() : null,
            'paid_at' => $validated['status'] === 'paid' ? now() : null,
            'failed_at' => $validated['status'] === 'failed' ? now() : null,
            'updated_at' => now(),
        ]);

        if ($validated['status'] === 'paid') {
            InAppNotification::send(
                (int) $payout->helper_id,
                'payout_paid',
                'Payout released',
                'Your '.number_format((float) $payout->net_amount, 2).' '.$payout->currency.' payout has been released.',
                '/helper/dashboard',
                ['payout_id' => $payoutId, 'task_id' => $payout->task_id]
            );
        }

        return response()->json(['success' => true, 'message' => 'Payout status updated.']);
    }

    /**
     * Return Helpers for the Admin review queue.
     */
    public function helpers(Request $request): JsonResponse
    {
        $status = $request->query('status', 'all');

        $query = DB::table('users')
            ->leftJoin(
                'profiles',
                'users.id',
                '=',
                'profiles.user_id'
            )
            ->where('users.role', 'helper')
            ->select([
                'users.id',
                'users.name',
                'users.email',
                'users.phone',
                'users.status',
                'users.created_at',
                'profiles.headline',
                'profiles.city',
                'profiles.province',
                'profiles.postal_code',
                'profiles.verification_status',
            ]);

        if ($status === 'pending') {
            $query->whereExists(function ($subQuery) {
                $subQuery->select(DB::raw(1))
                    ->from('helper_services')
                    ->whereColumn(
                        'helper_services.user_id',
                        'users.id'
                    )
                    ->where(
                        'helper_services.approval_status',
                        'pending'
                    );
            });
        }

        if ($status === 'verified') {
            $query->where(
                'profiles.verification_status',
                'verified'
            );
        }

        if ($status === 'active') {
            $query->whereExists(function ($subQuery) {
                $subQuery->select(DB::raw(1))
                    ->from('helper_services')
                    ->whereColumn(
                        'helper_services.user_id',
                        'users.id'
                    )
                    ->where(
                        'helper_services.approval_status',
                        'approved'
                    )
                    ->where(
                        'helper_services.is_active',
                        true
                    );
            });
        }

        $helpers = $query
            ->orderByDesc('users.created_at')
            ->get();

        foreach ($helpers as $helper) {
            $helper->pending_services =
                DB::table('helper_services')
                    ->where('user_id', $helper->id)
                    ->where('approval_status', 'pending')
                    ->count();

            $helper->approved_services =
                DB::table('helper_services')
                    ->where('user_id', $helper->id)
                    ->where('approval_status', 'approved')
                    ->where('is_active', true)
                    ->count();
        }

        return response()->json([
            'success' => true,
            'data' => $helpers,
        ]);
    }

    /**
     * Return one Helper's complete application.
     */
    public function helper(
        Request $request,
        int $userId
    ): JsonResponse {
        $helper = DB::table('users')
            ->where('id', $userId)
            ->where('role', 'helper')
            ->first();

        if (!$helper) {
            return response()->json([
                'success' => false,
                'message' => 'Helper not found.',
            ], 404);
        }

        $profile = DB::table('profiles')
            ->where('user_id', $userId)
            ->first();

        $services = DB::table('helper_services')
            ->join(
                'service_categories',
                'helper_services.service_category_id',
                '=',
                'service_categories.id'
            )
            ->where('helper_services.user_id', $userId)
            ->select([
                'helper_services.id',
                'helper_services.service_category_id',
                'service_categories.name',
                'service_categories.slug',
                'service_categories.requires_verification',
                'service_categories.requires_background_check',
                'service_categories.requires_driving_documents',
                'service_categories.requires_specialist_documents',
                'helper_services.hourly_rate',
                'helper_services.years_experience',
                'helper_services.experience_summary',
                'helper_services.approval_status',
                'helper_services.is_active',
                'helper_services.created_at',
                'helper_services.updated_at',
            ])
            ->orderBy('service_categories.name')
            ->get();

        $availability = DB::table('helper_availability')
            ->where('user_id', $userId)
            ->orderBy('day_of_week')
            ->get();

        $documents = DB::table('helper_documents')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $helper,
                'profile' => $profile,
                'services' => $services,
                'availability' => $availability,
                'documents' => $documents,
                'verification_readiness' =>
                    $this->verificationReadiness($userId),
            ],
        ]);
    }

    /**
     * Change the Helper's overall verification status.
     */
    public function updateVerification(
        Request $request,
        int $userId
    ): JsonResponse {
        $validated = $request->validate([
            'verification_status' => [
                'required',
                Rule::in([
                    'pending',
                    'verified',
                    'rejected',
                ]),
            ],
        ]);

        $helper = DB::table('users')
            ->where('id', $userId)
            ->where('role', 'helper')
            ->first();

        if (!$helper) {
            return response()->json([
                'success' => false,
                'message' => 'Helper not found.',
            ], 404);
        }

        $profile = DB::table('profiles')
            ->where('user_id', $userId)
            ->first();

        if (!$profile) {
            return response()->json([
                'success' => false,
                'message' => 'This Helper has not completed a profile.',
            ], 422);
        }

        if ($validated['verification_status'] === 'verified') {
            $readiness = $this->verificationReadiness($userId);

            if (!$readiness['ready']) {
                return response()->json([
                    'success' => false,
                    'message' => 'This Helper cannot be verified until all required documents are uploaded and approved.',
                    'data' => $readiness,
                ], 422);
            }
        }

        DB::table('profiles')
            ->where('user_id', $userId)
            ->update([
                'verification_status' =>
                    $validated['verification_status'],
                'updated_at' => now(),
            ]);

        /*
         * If verification is removed, approved services must not
         * remain publicly active.
         */
        if (
            $validated['verification_status'] !== 'verified'
        ) {
            DB::table('helper_services')
                ->where('user_id', $userId)
                ->update([
                    'is_active' => false,
                    'updated_at' => now(),
                ]);
        }

        /*
         * When a Helper becomes verified, previously approved
         * services may become active.
         */
        if (
            $validated['verification_status'] === 'verified'
        ) {
            DB::table('helper_services')
                ->where('user_id', $userId)
                ->where('approval_status', 'approved')
                ->update([
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Helper verification status updated.',
        ]);
    }

    /**
     * Approve or reject a document submitted by a Helper.
     */
    public function updateDocument(
        Request $request,
        int $userId,
        int $documentId
    ): JsonResponse {
        $validated = $request->validate([
            'verification_status' => [
                'required',
                Rule::in(['pending', 'verified', 'rejected']),
            ],
            'verification_notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $helperExists = DB::table('users')
            ->where('id', $userId)
            ->where('role', 'helper')
            ->exists();

        if (!$helperExists) {
            return response()->json([
                'success' => false,
                'message' => 'Helper not found.',
            ], 404);
        }

        $document = DB::table('helper_documents')
            ->where('id', $documentId)
            ->where('user_id', $userId)
            ->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Helper document not found.',
            ], 404);
        }

        DB::table('helper_documents')
            ->where('id', $documentId)
            ->where('user_id', $userId)
            ->update([
                'verification_status' =>
                    $validated['verification_status'],
                'verification_notes' =>
                    $validated['verification_notes'] ?? null,
                'verified_by' =>
                    $validated['verification_status'] === 'verified'
                        ? $request->user()->id
                        : null,
                'verified_at' =>
                    $validated['verification_status'] === 'verified'
                        ? now()
                        : null,
                'updated_at' => now(),
            ]);

        $readiness = $this->verificationReadiness($userId);

        if (!$readiness['ready']) {
            DB::table('profiles')
                ->where('user_id', $userId)
                ->where('verification_status', 'verified')
                ->update([
                    'verification_status' => 'pending',
                    'updated_at' => now(),
                ]);

            DB::table('helper_services')
                ->where('user_id', $userId)
                ->update([
                    'is_active' => false,
                    'updated_at' => now(),
                ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Document verification status updated.',
            'data' => [
                'verification_readiness' =>
                    $readiness,
            ],
        ]);
    }

    /**
     * Securely download a Helper document for Admin review.
     */
    public function viewDocument(
        Request $request,
        int $userId,
        int $documentId
    ): StreamedResponse|JsonResponse {
        $document = DB::table('helper_documents')
            ->where('id', $documentId)
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Helper document not found.',
            ], 404);
        }

        $disk = $document->file_disk === 'private'
            ? 'local'
            : $document->file_disk;

        if (!Storage::disk($disk)->exists($document->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'The stored document file is unavailable.',
            ], 404);
        }

        return Storage::disk($disk)->download(
            $document->file_path,
            $document->document_name ?: 'verification-document'
        );
    }

    /**
     * Approve or reject an individual Helper service.
     */
    public function updateService(
        Request $request,
        int $userId,
        int $serviceId
    ): JsonResponse {
        $validated = $request->validate([
            'approval_status' => [
                'required',
                Rule::in([
                    'pending',
                    'approved',
                    'rejected',
                ]),
            ],
        ]);

        $helper = DB::table('users')
            ->where('id', $userId)
            ->where('role', 'helper')
            ->first();

        if (!$helper) {
            return response()->json([
                'success' => false,
                'message' => 'Helper not found.',
            ], 404);
        }

        $service = DB::table('helper_services')
            ->where('id', $serviceId)
            ->where('user_id', $userId)
            ->first();

        if (!$service) {
            return response()->json([
                'success' => false,
                'message' => 'Helper service not found.',
            ], 404);
        }

        $verificationStatus = DB::table('profiles')
            ->where('user_id', $userId)
            ->value('verification_status');

        /*
         * A service is publicly active only when:
         *
         * 1. Admin approved the service, AND
         * 2. The Helper is verified.
         */
        $isActive =
            $validated['approval_status'] === 'approved' &&
            $verificationStatus === 'verified' &&
            $this->verificationReadiness($userId)['ready'];

        DB::table('helper_services')
            ->where('id', $serviceId)
            ->where('user_id', $userId)
            ->update([
                'approval_status' =>
                    $validated['approval_status'],
                'is_active' => $isActive,
                'updated_at' => now(),
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Service approval status updated.',
            'data' => [
                'approval_status' =>
                    $validated['approval_status'],
                'is_active' => $isActive,
            ],
        ]);
    }

    /**
     * Suspend or reactivate a Helper account.
     */
    public function updateHelperStatus(
        Request $request,
        int $userId
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in([
                    'active',
                    'suspended',
                ]),
            ],
        ]);

        $helper = DB::table('users')
            ->where('id', $userId)
            ->where('role', 'helper')
            ->first();

        if (!$helper) {
            return response()->json([
                'success' => false,
                'message' => 'Helper not found.',
            ], 404);
        }

        DB::transaction(function () use (
            $userId,
            $validated
        ) {
            DB::table('users')
                ->where('id', $userId)
                ->update([
                    'status' => $validated['status'],
                    'updated_at' => now(),
                ]);

            if ($validated['status'] === 'suspended') {
                DB::table('helper_services')
                    ->where('user_id', $userId)
                    ->update([
                        'is_active' => false,
                        'updated_at' => now(),
                    ]);
            }

            if ($validated['status'] === 'active') {
                $verified =
                    DB::table('profiles')
                        ->where('user_id', $userId)
                        ->value('verification_status')
                    === 'verified';

                if (
                    $verified &&
                    $this->verificationReadiness($userId)['ready']
                ) {
                    DB::table('helper_services')
                        ->where('user_id', $userId)
                        ->where(
                            'approval_status',
                            'approved'
                        )
                        ->update([
                            'is_active' => true,
                            'updated_at' => now(),
                        ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Helper account status updated.',
        ]);
    }

    /**
     * Determine whether the Helper has valid, approved documents for every
     * requirement created by their selected services.
     */
    private function verificationReadiness(int $userId): array
    {
        return \App\Services\SingleDocumentPolicy::readiness($userId);
    }
}
