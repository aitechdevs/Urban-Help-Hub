<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ReusableHelperIdentity
{
    public const TYPES = ['identity', 'identity_document', 'government_id', 'photo_id', 'passport'];
    public const DRIVING_TYPES = ['drivers_licence', 'drivers_license'];

    public static function usable($document): bool
    {
        $doc = (array) $document;
        return (!array_key_exists('is_active', $doc) || (bool) $doc['is_active'])
            && in_array($doc['verification_status'] ?? '', ['pending', 'verified'], true)
            && (empty($doc['expires_at']) || substr((string) $doc['expires_at'], 0, 10) >= now()->toDateString());
    }

    public static function primary(array $documents): ?array
    {
        $identities = array_values(array_filter($documents, fn ($doc) => in_array(strtolower((string) ($doc['document_type'] ?? '')), array_merge(self::TYPES, self::DRIVING_TYPES), true)));
        usort($identities, function ($a, $b) {
            $rank = fn ($d) => self::usable($d) ? (($d['verification_status'] ?? '') === 'verified' ? 0 : 1) : 2;
            return ($rank($a) <=> $rank($b)) ?: ((int) ($b['id'] ?? 0) <=> (int) ($a['id'] ?? 0));
        });
        return $identities[0] ?? null;
    }

    public static function existing(int $userId, bool $drivingOnly = false): ?array
    {
        $types = $drivingOnly ? self::DRIVING_TYPES : array_merge(self::TYPES, self::DRIVING_TYPES);
        $documents = DB::table('helper_documents')->where('user_id', $userId)->where('is_active', true)
            ->whereIn('document_type', $types)->get()->map(fn ($doc) => (array) $doc)->all();
        $primary = self::primary($documents);
        return $primary && self::usable($primary) ? $primary : null;
    }

    public static function visible(array $documents): array
    {
        // Keep one current general identity in the normal view, without deleting legacy uploads.
        // A driving licence remains visible separately when required for driving services.
        $general = array_values(array_filter($documents, fn ($doc) => in_array(strtolower((string) ($doc['document_type'] ?? '')), self::TYPES, true)));
        $primary = self::primary($general);
        return array_values(array_filter($documents, fn ($doc) => !in_array(strtolower((string) ($doc['document_type'] ?? '')), self::TYPES, true)
            || ($primary && (int) $doc['id'] === (int) $primary['id'])
            || ($doc['verification_status'] ?? '') === 'pending'));
    }
}
