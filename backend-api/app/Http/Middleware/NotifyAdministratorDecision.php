<?php

namespace App\Http\Middleware;

use App\Support\InAppNotification;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class NotifyAdministratorDecision
{
    public function handle(Request $request, Closure $next): Response
    {
        $actor = $request->user();
        if (!$actor || !in_array($actor->role, ['admin', 'super_admin'], true) || $actor->status !== 'active') {
            return $next($request);
        }

        $helperId = (int) $request->route('userId');
        $documentId = (int) $request->route('documentId');
        $serviceId = (int) $request->route('serviceId');
        $action = $request->route()->getActionMethod();
        [$table, $key, $id, $column] = match ($action) {
            'updateVerification' => ['profiles', 'user_id', $helperId, 'verification_status'],
            'updateService' => ['helper_services', 'id', $serviceId, 'approval_status'],
            'updateDocument' => ['helper_documents', 'id', $documentId, 'verification_status'],
            'updateHelperStatus' => ['users', 'id', $helperId, 'status'],
        };

        return DB::transaction(function () use ($request, $next, $action, $helperId, $serviceId, $documentId, $table, $key, $id, $column) {
            // Serialize the decision with other updates for the same Helper.
            $helper = DB::table('users')->where('id', $helperId)->where('role', 'helper')->lockForUpdate()->first();
            $record = DB::table($table)->where($key, $id);
            if (in_array($table, ['helper_services', 'helper_documents'], true)) {
                $record->where('user_id', $helperId);
            }

            $before = $helper ? (clone $record)->value($column) : null;
            $response = $next($request);
            if (!$helper || !$response->isSuccessful()) {
                return $response;
            }

            $status = $record->value($column);
            if (!$status || $status === $before) {
                return $response;
            }

            [$type, $title, $message, $data, $email] = match ($action) {
                'updateVerification' => [
                    'helper_verification_changed', 'Helper verification updated',
                    'Your Helper verification status is now '.str_replace('_', ' ', $status).'.', [], $status !== 'verified',
                ],
                'updateService' => [
                    'helper_service_reviewed', 'Helper service review updated',
                    'Your service review status is now '.str_replace('_', ' ', $status).'. Open your services for details.',
                    ['service_id' => $serviceId], true,
                ],
                'updateDocument' => [
                    'helper_document_reviewed', 'Helper document review updated',
                    'Your document review status is now '.str_replace('_', ' ', $status).'. Open your documents for details.',
                    ['document_id' => $documentId], true,
                ],
                'updateHelperStatus' => $status === 'suspended' ? [
                    'helper_account_suspended', 'Your Helper account was suspended',
                    'Your Helper account has been suspended. Contact UrbanHelpHub support if you need help.', [], true,
                ] : [
                    'helper_account_reactivated', 'Your Helper account was reactivated',
                    'Your Helper account is active. Sign in to view your dashboard.', [], true,
                ],
            };

            InAppNotification::send($helperId, $type, $title, $message, data: $data, email: $email);

            return $response;
        }, 3);
    }
}
