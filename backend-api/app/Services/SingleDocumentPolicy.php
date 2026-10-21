<?php
namespace App\Services;
use Illuminate\Support\Facades\DB;
class SingleDocumentPolicy
{
    public static function readiness(int $userId): array
    {
        $approved = DB::table('helper_documents')->where('user_id', $userId)
            ->where('is_active', true)->where('verification_status', 'verified')
            ->whereIn('document_type', array_merge(ReusableHelperIdentity::TYPES, ReusableHelperIdentity::DRIVING_TYPES))
            ->where(function ($query) { $query->whereNull('expires_at')->orWhereDate('expires_at', '>=', now()->toDateString()); })
            ->count();
        return ['ready' => $approved > 0,
            'missing_requirements' => $approved > 0 ? [] : ['One approved government photo ID (shared across all services)'],
            'approved_documents' => $approved];
    }
}
