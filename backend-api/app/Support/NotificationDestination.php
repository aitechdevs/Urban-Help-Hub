<?php

namespace App\Support;

class NotificationDestination
{
    public static function for(string $role, string $type, array $data, ?string $saved = null): string
    {
        $task = self::id($data, 'task_id');
        $payout = self::id($data, 'payout_id');
        $payment = self::id($data, 'payment_id');
        $service = self::id($data, 'service_id');
        $document = self::id($data, 'document_id');

        if (in_array($role, ['admin', 'super_admin'], true)) {
            if ($payout) return "/admin/?section=payments#payout-{$payout}";
            if ($payment) return "/admin/?section=payments#payment-{$payment}";
            if ($task) return "/admin/?section=task-approvals#approval-task-{$task}";
            if ($helper = self::id($data, 'helper_id')) return "/admin/helpers/?id={$helper}";
            if ($type === 'customer_profile_pending' || self::id($data, 'profile_change_id')) {
                $change = self::id($data, 'profile_change_id');
                return '/admin/profile-approvals/'.($change ? "#request-{$change}" : '');
            }

            return '/admin/';
        }

        if ($role === 'helper') {
            if ($type === 'new_message') return '/helper/messages/'.($task ? "?task={$task}" : '');
            if ($type === 'helper_document_reviewed') return '/helper/dashboard/'.($document ? "?section=helper-documents#helper-document-{$document}" : '#helper-documents');
            if ($type === 'helper_service_reviewed') return '/helper/dashboard/'.($service ? "?section=helper-services#helper-service-{$service}" : '#helper-services');
            if ($type === 'helper_verification_changed') return '/helper/dashboard/#helper-verification';
            if ($type === 'helper_account_suspended') return '/login/';
            if ($type === 'helper_account_reactivated') return '/helper/dashboard/';
            if ($payout || str_starts_with($type, 'payout_')) return '/helper/dashboard/'.($task ? "?section=helper-earnings#helper-job-{$task}" : '#helper-earnings');
            if (in_array($type, ['new_opportunity', 'task_updated'], true)) return '/helper/dashboard/'.($task && $type === 'new_opportunity' ? "?section=helper-opportunities#helper-opportunity-{$task}" : '#helper-opportunities');
            if ($task) return "/helper/dashboard/?section=helper-jobs#helper-job-{$task}";

            return '/helper/dashboard/';
        }

        if ($type === 'new_message') return '/messages/'.($task ? "?task={$task}" : '');
        if ($type === 'customer_profile_reviewed' || $saved === '/customer/profile/') {
            $change = self::id($data, 'profile_change_id');
            return '/customer/profile/'.($change ? "#request-{$change}" : '');
        }
        if ($task) return "/dashboard/?section=customer-tasks#customer-task-{$task}";

        return '/dashboard/';
    }

    public static function emailLink(string $destination): string
    {
        return 'https://urbanhelphub.com/login/?next='.rawurlencode($destination);
    }

    private static function id(array $data, string $key): ?string
    {
        $id = $data[$key] ?? null;

        return (is_int($id) || is_string($id)) && preg_match('/^[1-9][0-9]{0,19}$/D', (string) $id)
            ? (string) $id : null;
    }
}
