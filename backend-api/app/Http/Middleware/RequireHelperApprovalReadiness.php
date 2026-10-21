<?php
namespace App\Http\Middleware;
use App\Services\SingleDocumentPolicy;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RequireHelperApprovalReadiness
{
    public function handle(Request $request, Closure $next): Response
    {
        $action = $request->route()->getActionName();
        $serviceApproval = str_ends_with($action, '@updateService') && $request->input('approval_status') === 'approved';
        $verification = str_ends_with($action, '@updateVerification') && $request->input('verification_status') === 'verified';
        if (!$serviceApproval && !$verification) return $next($request);
        return DB::transaction(function () use ($request, $next, $serviceApproval) {
            $id = (int) $request->route('userId');
            $helper = DB::table('users')->where('id', $id)->where('role', 'helper')->lockForUpdate()->first();
            if (!$helper) return response()->json(['success' => false, 'message' => 'Helper not found.'], 404);
            if ($helper->status !== 'active') return response()->json(['success' => false,
                'message' => 'This account cannot sign in because it is not active. Reactivate the account explicitly before verifying or approving services.'], 422);
            $ready = SingleDocumentPolicy::readiness($id);
            if (!$ready['ready']) return response()->json(['success' => false,
                'message' => 'Approve the helper identity document before final verification or service approval.', 'data' => $ready], 422);
            if ($serviceApproval && DB::table('profiles')->where('user_id', $id)->value('verification_status') !== 'verified') {
                return response()->json(['success' => false, 'message' => 'Complete Verify Helper first, then approve this service.'], 422);
            }
            return $next($request);
        }, 3);
    }
}
