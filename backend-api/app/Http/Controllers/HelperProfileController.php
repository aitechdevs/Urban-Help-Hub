<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\InAppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class HelperProfileController extends Controller
{
    public function update(Request $request): JsonResponse
    {
        $helper = $this->helper($request);
        $fields = $request->validate([
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'headline' => ['sometimes', 'nullable', 'string', 'max:120'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'city' => ['sometimes', 'required', 'string', 'max:120'],
            'province' => ['sometimes', 'required', Rule::in(['AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'])],
            'postal_code' => ['sometimes', 'required', 'string', 'regex:/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/'],
        ]);

        if (isset($fields['postal_code'])) {
            $postal = strtoupper(str_replace([' ', '-'], '', $fields['postal_code']));
            $fields['postal_code'] = substr($postal, 0, 3).' '.substr($postal, 3);
        }

        $review = DB::transaction(function () use ($helper, $fields): bool {
            $user = User::query()->lockForUpdate()->findOrFail($helper->id);
            abort_unless($user->role === 'helper' && $user->status === 'active', 403);
            $profileQuery = DB::table('profiles')->where('user_id', $user->id);
            $profile = $profileQuery->lockForUpdate()->first();
            abort_unless($profile, 409, 'Complete your Helper application to create a profile first.');

            $changes = array_filter($fields, fn ($value, $key) => $value !== $profile->{$key}, ARRAY_FILTER_USE_BOTH);
            $areaChanged = (bool) array_intersect_key($changes, array_flip(['city', 'province', 'postal_code']));
            if ($areaChanged) {
                $changes['verification_status'] = 'pending';
                DB::table('helper_services')->where('user_id', $user->id)->where('is_active', true)
                    ->update(['is_active' => false, 'updated_at' => now()]);
                InAppNotification::sendToAdmins('helper_service_area_changed', 'Helper service area changed',
                    'A Helper updated their service area. Review the profile before restoring matching.',
                    '/admin/helpers/?id='.$user->id, ['helper_id' => $user->id]);
            }

            if ($changes) {
                DB::table('profiles')->where('user_id', $user->id)->update($changes + ['updated_at' => now()]);
            }

            if (array_key_exists('phone', $fields) && $fields['phone'] !== $user->phone) {
                $user->forceFill(['phone' => $fields['phone']])->save();
            }

            return $areaChanged;
        }, 3);

        return response()->json([
            'success' => true,
            'message' => $review ? 'Service area saved and sent for review. New matches resume after approval.' : 'Profile saved.',
        ]);
    }

    public function updateService(Request $request, int $serviceId): JsonResponse
    {
        $helper = $this->helper($request);
        $fields = $request->validate([
            'hourly_rate' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:9999.99'],
            'years_experience' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:80'],
            'experience_summary' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        if (isset($fields['hourly_rate'])) {
            $fields['hourly_rate'] = number_format((float) $fields['hourly_rate'], 2, '.', '');
        }
        if (isset($fields['years_experience'])) {
            $fields['years_experience'] = (int) $fields['years_experience'];
        }

        $changed = DB::transaction(function () use ($helper, $fields, $serviceId): bool {
            $user = User::query()->lockForUpdate()->findOrFail($helper->id);
            abort_unless($user->role === 'helper' && $user->status === 'active', 403);
            $query = DB::table('helper_services')->where('id', $serviceId)->where('user_id', $user->id);
            $service = (clone $query)->lockForUpdate()->first();
            abort_unless($service, 404, 'Service not found.');

            $changes = array_filter($fields, fn ($value, $key) => $value !== ($key === 'hourly_rate' && $service->{$key} !== null
                ? number_format((float) $service->{$key}, 2, '.', '')
                : $service->{$key}), ARRAY_FILTER_USE_BOTH);
            if (!$changes) {
                return false;
            }
            $query->update($changes + ['approval_status' => 'pending', 'is_active' => false, 'updated_at' => now()]);
            InAppNotification::sendToAdmins('helper_service_details_changed', 'Helper service details changed',
                'A Helper updated a service. Review the updated information.',
                '/admin/helpers/?id='.$user->id, ['helper_id' => $user->id]);

            return true;
        }, 3);

        return response()->json([
            'success' => true,
            'message' => $changed ? 'This service was saved and sent for review.' : 'No changes to save.',
        ]);
    }

    private function helper(Request $request): User
    {
        $user = $request->user();
        abort_unless($user?->role === 'helper' && $user->status === 'active', 403, 'An active Helper account is required.');

        return $user;
    }
}
