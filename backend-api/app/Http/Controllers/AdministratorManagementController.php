<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdministratorManagementController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => User::query()
                ->whereIn('role', ['admin', 'super_admin'])
                ->orderBy('name')
                ->orderBy('id')
                ->get(['id', 'name', 'email', 'role', 'status']),
            'audit_events' => DB::table('administrator_audit_events')
                ->latest('id')
                ->limit(25)
                ->get()
                ->map(function (object $event): object {
                    $event->created_at = Carbon::parse($event->created_at)->toIso8601String();

                    return $event;
                }),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        if (is_string($request->input('email'))) {
            $request->merge(['email' => strtolower(trim($request->input('email')))]);
        }

        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'string', 'email:rfc', 'max:254', Rule::unique('users', 'email')],
            'password' => [
                'required', 'string', 'min:14', 'confirmed',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if (is_string($value) && (strlen($value) > 72 || str_contains($value, "\0"))) {
                        $fail('The temporary password must fit within 72 bytes and contain no null characters.');
                    }
                },
            ],
        ]);

        $admin = DB::transaction(function () use ($request, $validated) {
            $admin = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'admin',
                'status' => 'suspended',
            ]);
            $this->record($request->user(), $admin, 'created');

            return $admin;
        });

        return response()->json([
            'success' => true,
            'data' => $admin->only(['id', 'name', 'email', 'role', 'status']),
        ], 201);
    }

    public function update(Request $request, int $administrator): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string', 'current_password'],
            'role' => ['sometimes', Rule::in(['admin'])],
            'status' => ['required', Rule::in(['active', 'suspended'])],
        ]);

        $admin = DB::transaction(function () use ($request, $administrator, $validated) {
            $admin = User::query()->where('role', 'admin')->lockForUpdate()->findOrFail($administrator);
            $previousStatus = $admin->status;
            $admin->status = $validated['status'];

            if ($admin->isDirty('status')) {
                $admin->save();
                if ($admin->status === 'suspended') {
                    $admin->tokens()->delete();
                }
                $this->record($request->user(), $admin, $admin->status === 'active' ? 'activated' : 'suspended', $previousStatus);
            }

            return $admin;
        });

        return response()->json([
            'success' => true,
            'data' => $admin->only(['id', 'name', 'email', 'role', 'status']),
        ]);
    }

    private function record(User $actor, User $admin, string $action, ?string $previousStatus = null): void
    {
        DB::table('administrator_audit_events')->insert([
            'actor_user_id' => $actor->id,
            'actor_name' => $actor->name,
            'administrator_user_id' => $admin->id,
            'administrator_name' => $admin->name,
            'action' => $action,
            'previous_status' => $previousStatus,
            'new_status' => $admin->status,
            'created_at' => now(),
        ]);
    }
}
