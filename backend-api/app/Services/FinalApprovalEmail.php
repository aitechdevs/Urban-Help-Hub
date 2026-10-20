<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class FinalApprovalEmail
{
    public static function helper(int $userId): void
    {
        $user = DB::table('users')->where('id', $userId)->first();
        $profile = DB::table('profiles')->where('user_id', $userId)->first();
        if (!$user || $user->role !== 'helper' || !$profile || $profile->verification_status !== 'verified') return;
        $services = DB::table('helper_services')->join('service_categories', 'helper_services.service_category_id', '=', 'service_categories.id')
            ->where('helper_services.user_id', $userId)->where('helper_services.approval_status', 'approved')
            ->where('helper_services.is_active', true)->orderBy('service_categories.name')->pluck('service_categories.name')->all();
        $location = implode(', ', array_filter([$profile->city, $profile->province, $profile->country, $profile->postal_code]));
        $body = "Hello {$user->name},\n\nUrbanHelpHub Admin has completed your final Helper verification.\n\nVerification status: Verified\n";
        $body .= 'Approved active services: '.($services ? implode(', ', $services) : 'None active yet')."\n";
        if ($location !== '') $body .= 'Service location: '.$location."\n";
        $body .= 'Account status: '.ucfirst($user->status)."\n";
        $body .= $user->status === 'active' && $services
            ? "You can now receive matching job opportunities for the active approved services above, subject to your location and availability.\n"
            : "Verification is complete, but receiving job opportunities still requires an active account and at least one active approved service.\n";
        $body .= "\nOpen your dashboard: https://urbanhelphub.com/helper/dashboard/\n\nUrbanHelpHub\n";
        self::store('helper_verified:'.$userId.':'.Str::uuid(), $userId, 'helper_verified', $user->email,
            'UrbanHelpHub: Your Helper verification is complete', $body);
    }

    public static function customer(int $changeId): void
    {
        $change = DB::table('customer_profile_changes')->where('id', $changeId)->where('status', 'approved')->first();
        if (!$change) return;
        $user = DB::table('users')->where('id', $change->user_id)->where('role', 'customer')->first();
        if (!$user) return;
        $before = json_decode($change->baseline, true);
        $after = json_decode($change->proposed, true);
        $labels = ['name' => 'Name', 'email' => 'Email', 'phone' => 'Phone', 'address_line_1' => 'Street address',
            'address_line_2' => 'Address line 2', 'city' => 'City', 'province' => 'Province / state', 'country' => 'Country',
            'postal_code' => 'Postal code', 'headline' => 'Headline', 'bio' => 'About you', 'date_of_birth' => 'Date of birth'];
        $body = "Hello {$user->name},\n\nUrbanHelpHub Admin has approved your Customer profile change request #{$changeId}.\nThe approved changes are now active:\n\n";
        foreach ($labels as $key => $label) {
            if (($before[$key] ?? '') === ($after[$key] ?? '')) continue;
            $value = $key === 'date_of_birth' ? 'Updated (view securely in your profile)' : (($after[$key] ?? null) ?: 'Cleared');
            $body .= $label.': '.$value."\n";
        }
        if ($change->review_note) $body .= "\nAdmin note: {$change->review_note}\n";
        $body .= "\nExisting task and payment details have not been changed.\n";
        $body .= "View your profile: https://urbanhelphub.com/customer/profile/\n\nUrbanHelpHub\n";
        self::store('customer_profile_approved:'.$changeId, (int) $user->id, 'customer_profile_approved', $user->email,
            'UrbanHelpHub: Your profile changes have been approved', $body);
    }

    private static function store(string $key, int $userId, string $type, string $recipient, string $subject, string $body): void
    {
        if (DB::table('approval_email_outbox')->where('event_key', $key)->exists()) return;
        // Coalesce unsent approvals of the same kind for this account to reduce email volume.
        DB::table('approval_email_outbox')->where('user_id', $userId)->where('event_type', $type)
            ->whereIn('status', ['pending', 'retry'])->update(['status' => 'superseded', 'updated_at' => now()]);
        DB::table('approval_email_outbox')->insertOrIgnore([
            'event_key' => $key, 'user_id' => $userId, 'event_type' => $type, 'recipient' => $recipient,
            'subject' => $subject, 'body' => $body, 'status' => 'pending', 'attempts' => 0,
            'next_attempt_at' => now(), 'created_at' => now(), 'updated_at' => now(),
        ]);
    }
}
