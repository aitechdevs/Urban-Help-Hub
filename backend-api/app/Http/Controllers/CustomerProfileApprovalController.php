<?php

namespace App\Http\Controllers;

use App\Support\InAppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CustomerProfileApprovalController extends Controller
{
    private const COUNTRIES = ['Australia' => ['AU','AUD'], 'Canada' => ['CA','CAD'], 'Ghana' => ['GH','GHS'], 'India' => ['IN','INR'], 'Ireland' => ['IE','EUR'], 'Kenya' => ['KE','KES'], 'Nigeria' => ['NG','NGN'], 'New Zealand' => ['NZ','NZD'], 'South Africa' => ['ZA','ZAR'], 'United Arab Emirates' => ['AE','AED'], 'United Kingdom' => ['GB','GBP'], 'United States' => ['US','USD']];
    private const USER_FIELDS = ['name', 'email', 'phone'];
    private const PROFILE_FIELDS = ['headline', 'bio', 'date_of_birth', 'city', 'province', 'country', 'postal_code'];
    private const ADDRESS_FIELDS = ['address_line_1', 'address_line_2'];

    private function snapshot(int $userId): array
    {
        $user = DB::table('users')->where('id', $userId)->first();
        $profile = DB::table('profiles')->where('user_id', $userId)->first();
        $address = DB::table('addresses')->where('user_id', $userId)->where('address_type', 'profile')->first();
        $data = [];
        foreach (self::USER_FIELDS as $key) $data[$key] = $user->$key ?? null;
        foreach (self::PROFILE_FIELDS as $key) $data[$key] = $profile->$key ?? null;
        foreach (self::ADDRESS_FIELDS as $key) $data[$key] = $address->$key ?? null;
        $data['phone'] = $user->phone ?? $profile->phone ?? null;
        $data['country'] = $profile->country ?? null;
        return $data;
    }

    private function requestData($change): ?array
    {
        if (!$change) return null;
        return ['id' => $change->id, 'revision' => $change->revision, 'status' => $change->status,
            'proposed' => json_decode($change->proposed, true), 'baseline' => json_decode($change->baseline, true),
            'review_note' => $change->review_note, 'created_at' => $change->created_at, 'updated_at' => $change->updated_at];
    }

    public function show(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'customer', 403);
        $id = (int) $request->user()->id;
        return response()->json(['success' => true, 'data' => [
            'current' => $this->snapshot($id),
            'user' => $request->user(),
            'pending' => $this->requestData(DB::table('customer_profile_changes')->where('user_id', $id)->where('status', 'pending')->first()),
            'latest' => $this->requestData(DB::table('customer_profile_changes')->where('user_id', $id)->orderByDesc('id')->first()),
        ]]);
    }

    public function submit(Request $request): JsonResponse
    {
        abort_unless($request->user()->role === 'customer' && $request->user()->status === 'active', 403);
        $id = (int) $request->user()->id;
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'headline' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:5000'],
            'date_of_birth' => ['nullable', 'date_format:Y-m-d', 'before:today'],
            'city' => ['required', 'string', 'max:120'],
            'province' => ['required', 'string', 'max:100'],
            'country' => ['required', Rule::in(array_keys(self::COUNTRIES))],
            'postal_code' => ['required', 'string', 'max:20'],
            'address_line_1' => ['nullable', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'expected_revision' => ['nullable', 'integer', 'min:1'],
        ]);
        $data['email'] = strtolower(trim($data['email']));
        $expected = $data['expected_revision'] ?? null;
        unset($data['expected_revision']);
        foreach (array_merge(self::USER_FIELDS, self::PROFILE_FIELDS, self::ADDRESS_FIELDS) as $key) {
            $data[$key] = isset($data[$key]) ? trim($data[$key]) : null;
            if ($data[$key] === '') $data[$key] = null;
        }
        $result = DB::transaction(function () use ($id, $data, $expected) {
            DB::table('users')->where('id', $id)->lockForUpdate()->first();
            $pending = DB::table('customer_profile_changes')->where('user_id', $id)->where('status', 'pending')->lockForUpdate()->first();
            if (($pending && (int) $pending->revision !== (int) $expected) || (!$pending && $expected !== null)) {
                return ['error' => 'This profile request changed or was reviewed. Reload before submitting.', 'status' => 409];
            }
            $current = $this->snapshot($id);
            if ($current == $data) return ['error' => 'There are no profile changes to submit.', 'status' => 422];
            $values = ['proposed' => json_encode($data), 'baseline' => json_encode($current),
                'revision' => $pending ? $pending->revision + 1 : 1, 'updated_at' => now()];
            if ($pending) {
                DB::table('customer_profile_changes')->where('id', $pending->id)->update($values);
                $changeId = $pending->id;
            } else {
                $changeId = DB::table('customer_profile_changes')->insertGetId(array_merge($values, [
                    'user_id' => $id, 'status' => 'pending', 'created_at' => now(),
                ]));
            }
            InAppNotification::sendToAdmins('customer_profile_pending', 'Customer profile awaiting approval',
                'A Customer submitted profile changes. Review their province, postal code and other requested details.',
                '/admin/profile-approvals/', ['profile_change_id' => $changeId]);
            return ['success' => true, 'message' => 'Profile changes submitted for Admin approval. Your current details remain unchanged.'];
        }, 3);
        if (isset($result['error'])) return response()->json(['success' => false, 'message' => $result['error']], $result['status']);
        return response()->json($result);
    }

    public function customers(Request $request): JsonResponse
    {
        $users = DB::table('users')->where('role', 'customer')->select('id', 'name', 'email', 'phone', 'status')->orderBy('name')->get();
        foreach ($users as $user) {
            $user->profile = $this->snapshot((int) $user->id);
            $user->pending = $this->requestData(DB::table('customer_profile_changes')->where('user_id', $user->id)->where('status', 'pending')->first());
        }
        return response()->json(['success' => true, 'data' => $users]);
    }

    public function queue(Request $request): JsonResponse
    {
        $rows = DB::table('customer_profile_changes')->where('status', 'pending')->orderBy('created_at')->get();
        $data = [];
        foreach ($rows as $row) {
            $item = $this->requestData($row);
            $item['current'] = $this->snapshot((int) $row->user_id);
            $item['user_id'] = $row->user_id;
            $data[] = $item;
        }
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function review(Request $request, int $changeId): JsonResponse
    {
        $data = $request->validate(['decision' => ['required', Rule::in(['approved', 'rejected'])],
            'revision' => ['required', 'integer', 'min:1'], 'note' => ['nullable', 'string', 'max:2000']]);
        $row = DB::table('customer_profile_changes')->where('id', $changeId)->first();
        abort_unless($row, 404);
        $result = DB::transaction(function () use ($row, $data, $request, $changeId) {
            $user = DB::table('users')->where('id', $row->user_id)->lockForUpdate()->first();
            $change = DB::table('customer_profile_changes')->where('id', $changeId)->lockForUpdate()->first();
            if (!$user || $user->role !== 'customer') return ['error' => 'Customer not found.', 'status' => 404];
            if ($change->status !== 'pending' || (int) $change->revision !== (int) $data['revision']) {
                return ['error' => 'This request was edited or already reviewed. Reload before deciding.', 'status' => 409];
            }
            $proposed = json_decode($change->proposed, true);
            if ($data['decision'] === 'approved') {
                if ($this->snapshot((int) $user->id) != json_decode($change->baseline, true)) {
                    return ['error' => 'Current customer details changed after this request. Ask the Customer to resubmit.', 'status' => 409];
                }
                if (DB::table('users')->where('email', $proposed['email'])->where('id', '!=', $user->id)->exists()) {
                    throw ValidationException::withMessages(['email' => ['That email is now in use. Ask the Customer to resubmit.']]);
                }
                $updates = array_intersect_key($proposed, array_flip(self::USER_FIELDS));
                if ($user->email !== $proposed['email']) $updates['email_verified_at'] = null;
                if (($changeCountry = $proposed['country']) !== ($this->snapshot((int) $user->id)['country'] ?? null)) {
                    [$updates['country_code'], $updates['currency_code']] = self::COUNTRIES[$changeCountry];
                }
                $updates['updated_at'] = now();
                DB::table('users')->where('id', $user->id)->update($updates);
                $profile = DB::table('profiles')->where('user_id', $user->id)->first();
                $fields = array_intersect_key($proposed, array_flip(self::PROFILE_FIELDS));
                $fields['phone'] = $proposed['phone']; $fields['updated_at'] = now();
                if ($profile) DB::table('profiles')->where('user_id', $user->id)->update($fields);
                else DB::table('profiles')->insert(array_merge($fields, ['user_id' => $user->id, 'created_at' => now()]));
                $address = DB::table('addresses')->where('user_id', $user->id)->where('address_type', 'profile')->first();
                $addressFields = array_intersect_key($proposed, array_flip(array_merge(self::ADDRESS_FIELDS, ['city', 'province', 'country', 'postal_code'])));
                $addressFields['address_line_1'] = $addressFields['address_line_1'] ?? '';
                $addressFields['updated_at'] = now();
                if ($address) DB::table('addresses')->where('id', $address->id)->update($addressFields);
                else DB::table('addresses')->insert(array_merge($addressFields, ['user_id' => $user->id,
                    'address_type' => 'profile', 'label' => 'Customer profile', 'is_default' => false, 'created_at' => now()]));
            }
            DB::table('customer_profile_changes')->where('id', $changeId)->update([
                'status' => $data['decision'], 'reviewed_by' => $request->user()->id, 'reviewed_at' => now(),
                'review_note' => $data['note'] ?? null, 'updated_at' => now(),
            ]);
            InAppNotification::send((int) $user->id, 'customer_profile_reviewed', 'Profile changes '.$data['decision'],
                'Your profile changes were '.$data['decision'].($data['decision'] === 'approved' ? ' The approved details are now active.' : ' Your existing details were retained.'),
                '/customer/profile/', ['profile_change_id' => $changeId]);
            return ['success' => true, 'message' => 'Profile changes '.$data['decision'].'.'];
        }, 3);
        if (isset($result['error'])) return response()->json(['success' => false, 'message' => $result['error']], $result['status']);
        return response()->json($result);
    }
}
