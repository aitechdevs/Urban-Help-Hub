<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HelperReviewQueueController extends Controller
{
    private function pendingIds(): array
    {
        return DB::table('users')->where('role', 'helper')->where(function ($query) {
            $query->whereExists(function ($q) {
                $q->select(DB::raw(1))->from('helper_services')->whereColumn('helper_services.user_id', 'users.id')->where('approval_status', 'pending');
            })->orWhereExists(function ($q) {
                $q->select(DB::raw(1))->from('profiles')->whereColumn('profiles.user_id', 'users.id')->where('verification_status', 'pending');
            })->orWhereExists(function ($q) {
                $q->select(DB::raw(1))->from('helper_documents')->whereColumn('helper_documents.user_id', 'users.id')
                    ->where('is_active', true)->where('verification_status', 'pending');
            });
        })->orWhere(function ($query) { $query->where('role', 'helper')->where(function ($status) { $status->where('status', '!=', 'active')->orWhereNull('status'); }); })->pluck('id')->all();
    }

    public function summary(Request $request): JsonResponse
    {
        $response = app(AdminController::class)->dashboard($request);
        $data = $response->getData(true);
        if ($response->isSuccessful() && ($data['success'] ?? false)) {
            $data['data']['stats']['pending_helpers'] = count($this->pendingIds());
            $data['data']['stats']['inactive_helpers'] = DB::table('users')->where('role', 'helper')->where(function ($q) { $q->where('status', '!=', 'active')->orWhereNull('status'); })->count();
            $data['data']['stats']['active_helpers'] = DB::table('users')->where('role', 'helper')->where('status', 'active')
                ->whereExists(function ($q) { $q->select(DB::raw(1))->from('profiles')->whereColumn('profiles.user_id', 'users.id')->where('verification_status', 'verified'); })
                ->whereExists(function ($q) { $q->select(DB::raw(1))->from('helper_services')->whereColumn('helper_services.user_id', 'users.id')->where('approval_status', 'approved')->where('is_active', true); })->count();
            $data['data']['stats']['pending_customer_profiles'] = DB::table('customer_profile_changes')->where('status', 'pending')->count();
        }
        return response()->json($data, $response->getStatusCode());
    }

    public function helpers(Request $request): JsonResponse
    {
        if ($request->query('status') === 'inactive') {
            $copy = $request->duplicate(array_merge($request->query(), ['status' => 'all']));
            $copy->setUserResolver(fn () => $request->user());
            $response = app(AdminController::class)->helpers($copy);
            $data = $response->getData(true);
            if ($response->isSuccessful() && ($data['success'] ?? false)) {
                $data['data'] = array_values(array_filter($data['data'], fn ($helper) => ($helper['status'] ?? '') !== 'active'));
            }
            return response()->json($data, $response->getStatusCode());
        }
        if ($request->query('status') !== 'pending') {
            $response = app(AdminController::class)->helpers($request);
            if ($request->query('status') !== 'active') return $response;
            $data = $response->getData(true);
            if ($response->isSuccessful() && ($data['success'] ?? false)) {
                $data['data'] = array_values(array_filter($data['data'], fn ($helper) => ($helper['status'] ?? '') === 'active' && ($helper['verification_status'] ?? '') === 'verified' && ($helper['approved_services'] ?? 0) > 0));
            }
            return response()->json($data, $response->getStatusCode());
        }
        $copy = $request->duplicate(array_merge($request->query(), ['status' => 'all']));
        $copy->setUserResolver(fn () => $request->user());
        $response = app(AdminController::class)->helpers($copy);
        $data = $response->getData(true);
        if ($response->isSuccessful() && ($data['success'] ?? false)) {
            $ids = $this->pendingIds();
            $data['data'] = array_values(array_filter($data['data'], fn ($helper) => in_array((int) $helper['id'], array_map('intval', $ids), true)));
        }
        return response()->json($data, $response->getStatusCode());
    }
}
