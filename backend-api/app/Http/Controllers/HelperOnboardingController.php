<?php

namespace App\Http\Controllers;

use App\Models\ServiceCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HelperOnboardingController extends Controller
{
    /**
     * Return the authenticated Helper's onboarding information.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'helper') {
            return response()->json([
                'success' => false,
                'message' => 'This area is only available to Helper accounts.',
            ], 403);
        }

        $profile = DB::table('profiles')
            ->where('user_id', $user->id)
            ->first();

        $services = DB::table('helper_services')
            ->join(
                'service_categories',
                'helper_services.service_category_id',
                '=',
                'service_categories.id'
            )
            ->where('helper_services.user_id', $user->id)
            ->select([
                'helper_services.id',
                'helper_services.service_category_id',
                'service_categories.name',
                'service_categories.slug',
                'helper_services.hourly_rate',
                'helper_services.years_experience',
                'helper_services.experience_summary',
                'helper_services.approval_status',
                'helper_services.is_active',
            ])
            ->get();

        $availability = DB::table('helper_availability')
            ->where('user_id', $user->id)
            ->orderBy('day_of_week')
            ->get();

        $documents = DB::table('helper_documents')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->select([
                'id',
                'service_category_id',
                'document_type',
                'document_name',
                'document_number',
                'issued_at',
                'expires_at',
                'verification_status',
                'verification_notes',
                'created_at',
            ])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'user' => $user,
                'profile' => $profile,
                'services' => $services,
                'availability' => $availability,
                'documents' => $documents,
            ],
        ]);
    }

    /**
     * Upload a verification document to private storage.
     */
    public function uploadDocument(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'helper') {
            return response()->json([
                'success' => false,
                'message' => 'This area is only available to Helper accounts.',
            ], 403);
        }

        $validated = $request->validate([
            'document_type' => [
                'required',
                Rule::in([
                    'identity_document',
                    'background_check',
                    'drivers_licence',
                    'driver_abstract',
                    'vehicle_insurance',
                    'specialist_document',
                ]),
            ],
            'document_name' => ['nullable', 'string', 'max:255'],
            'document_number' => ['nullable', 'string', 'max:150'],
            'service_category_id' => [
                'nullable',
                'integer',
                'exists:service_categories,id',
            ],
            'issued_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:issued_at'],
            'file' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:5120',
            ],
        ]);

        if ($validated['document_type'] === 'specialist_document') {
            if (empty($validated['service_category_id'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Choose the service related to this specialist document.',
                ], 422);
            }

            $selectedService = DB::table('helper_services')
                ->where('user_id', $user->id)
                ->where(
                    'service_category_id',
                    $validated['service_category_id']
                )
                ->exists();

            if (!$selectedService) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected service does not belong to this Helper account.',
                ], 422);
            }
        }

        $file = $request->file('file');
        $path = $file->store(
            'helper-documents/' . $user->id,
            'local'
        );

        if (!$path) {
            return response()->json([
                'success' => false,
                'message' => 'The document could not be stored. Please try again.',
            ], 500);
        }

        $documentId = DB::table('helper_documents')->insertGetId([
            'user_id' => $user->id,
            'service_category_id' =>
                $validated['service_category_id'] ?? null,
            'document_type' => $validated['document_type'],
            'document_name' =>
                ($validated['document_name'] ?? null) ?: $file->getClientOriginalName(),
            'file_path' => $path,
            'file_disk' => 'local',
            'document_number' =>
                $validated['document_number'] ?? null,
            'issued_at' => $validated['issued_at'] ?? null,
            'expires_at' => $validated['expires_at'] ?? null,
            'verification_status' => 'pending',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $verificationStatus = DB::table('profiles')
            ->where('user_id', $user->id)
            ->value('verification_status');

        if ($verificationStatus === 'rejected') {
            DB::table('profiles')
                ->where('user_id', $user->id)
                ->update([
                    'verification_status' => 'pending',
                    'updated_at' => now(),
                ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Document uploaded securely and sent for review.',
            'data' => [
                'document_id' => $documentId,
            ],
        ], 201);
    }

    /**
     * Download one of the authenticated Helper's own documents.
     */
    public function viewDocument(
        Request $request,
        int $documentId
    ): StreamedResponse|JsonResponse {
        $user = $request->user();

        $document = DB::table('helper_documents')
            ->where('id', $documentId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        $disk = $document->file_disk === 'private'
            ? 'local'
            : $document->file_disk;

        if (!Storage::disk($disk)->exists($document->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'The stored document file is unavailable.',
            ], 404);
        }

        return Storage::disk($disk)->download(
            $document->file_path,
            $document->document_name ?: 'verification-document'
        );
    }

    /**
     * Remove a document that has not been approved.
     */
    public function deleteDocument(
        Request $request,
        int $documentId
    ): JsonResponse {
        $user = $request->user();

        $document = DB::table('helper_documents')
            ->where('id', $documentId)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$document) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found.',
            ], 404);
        }

        if ($document->verification_status === 'verified') {
            return response()->json([
                'success' => false,
                'message' => 'An approved document cannot be deleted. Contact UrbanHelpHub support.',
            ], 422);
        }

        $disk = $document->file_disk === 'private'
            ? 'local'
            : $document->file_disk;

        Storage::disk($disk)->delete($document->file_path);

        DB::table('helper_documents')
            ->where('id', $documentId)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Document removed.',
        ]);
    }

    /**
     * Save the Helper's profile and Canadian service area.
     */
    public function saveProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'helper') {
            return response()->json([
                'success' => false,
                'message' => 'This area is only available to Helper accounts.',
            ], 403);
        }

        $validated = $request->validate([
            'phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'headline' => [
                'nullable',
                'string',
                'max:120',
            ],

            'bio' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'city' => [
                'required',
                'string',
                'max:120',
            ],

            'province' => [
                'required',
                Rule::in([
                    'AB',
                    'BC',
                    'MB',
                    'NB',
                    'NL',
                    'NS',
                    'NT',
                    'NU',
                    'ON',
                    'PE',
                    'QC',
                    'SK',
                    'YT',
                ]),
            ],

            'postal_code' => [
                'required',
                'string',
                'regex:/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Normalize Canadian postal code
        |--------------------------------------------------------------------------
        |
        | Example:
        | m5v2t6 -> M5V 2T6
        |
        */

        $postalCode = strtoupper(
            preg_replace(
                '/\s+/',
                '',
                $validated['postal_code']
            )
        );

        $postalCode =
            substr($postalCode, 0, 3)
            . ' '
            . substr($postalCode, 3);

        /*
        |--------------------------------------------------------------------------
        | Save profile
        |--------------------------------------------------------------------------
        |
        | We deliberately check whether the profile already exists.
        | This preserves the original created_at timestamp when the
        | Helper later edits their profile.
        |
        */

        $existingProfile = DB::table('profiles')
            ->where('user_id', $user->id)
            ->first();

        $profileData = [
            'phone' => $validated['phone'] ?? $user->phone,
            'headline' => $validated['headline'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'city' => $validated['city'],
            'province' => $validated['province'],
            'country' => 'Canada',
            'postal_code' => $postalCode,
            'verification_status' => 'pending',
            'updated_at' => now(),
        ];

        if ($existingProfile) {
            DB::table('profiles')
                ->where('user_id', $user->id)
                ->update($profileData);
        } else {
            DB::table('profiles')->insert([
                'user_id' => $user->id,
                ...$profileData,
                'created_at' => now(),
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Keep the main users table phone number synchronized
        |--------------------------------------------------------------------------
        */

        if (!empty($validated['phone'])) {
            $user->forceFill([
                'phone' => $validated['phone'],
            ])->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Helper profile saved successfully.',
        ]);
    }

    /**
     * Save the service categories selected by the Helper.
     */
    public function saveServices(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'helper') {
            return response()->json([
                'success' => false,
                'message' => 'This area is only available to Helper accounts.',
            ], 403);
        }

        $validated = $request->validate([
            'services' => [
                'required',
                'array',
                'min:1',
            ],

            'services.*.service_category_id' => [
                'required',
                'integer',
                'distinct',
                'exists:service_categories,id',
            ],

            'services.*.hourly_rate' => [
                'nullable',
                'numeric',
                'min:0',
                'max:9999.99',
            ],

            'services.*.years_experience' => [
                'nullable',
                'integer',
                'min:0',
                'max:80',
            ],

            'services.*.experience_summary' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Make sure every selected category is currently active
        |--------------------------------------------------------------------------
        */

        $categoryIds = collect($validated['services'])
            ->pluck('service_category_id')
            ->all();

        $activeCategoryIds = ServiceCategory::query()
            ->whereIn('id', $categoryIds)
            ->where('is_active', true)
            ->pluck('id')
            ->all();

        if (count($activeCategoryIds) !== count($categoryIds)) {
            return response()->json([
                'success' => false,
                'message' => 'One or more selected services are not currently available.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Save selected Helper services
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use (
            $user,
            $validated,
            $categoryIds
        ) {
            /*
             * Remove services the Helper has deselected.
             */
            DB::table('helper_services')
                ->where('user_id', $user->id)
                ->whereNotIn(
                    'service_category_id',
                    $categoryIds
                )
                ->delete();

            foreach ($validated['services'] as $service) {
                $existingService = DB::table('helper_services')
                    ->where('user_id', $user->id)
                    ->where(
                        'service_category_id',
                        $service['service_category_id']
                    )
                    ->first();

                $serviceData = [
                    'hourly_rate' =>
                        $service['hourly_rate'] ?? null,

                    'years_experience' =>
                        $service['years_experience'] ?? null,

                    'experience_summary' =>
                        $service['experience_summary'] ?? null,

                    /*
                     * New/onboarding services remain pending and
                     * unavailable to customers until approved.
                     */
                    'approval_status' => 'pending',
                    'is_active' => false,
                    'updated_at' => now(),
                ];

                if ($existingService) {
                    DB::table('helper_services')
                        ->where('id', $existingService->id)
                        ->update($serviceData);
                } else {
                    DB::table('helper_services')->insert([
                        'user_id' => $user->id,
                        'service_category_id' =>
                            $service['service_category_id'],

                        ...$serviceData,

                        'created_at' => now(),
                    ]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Helper services saved successfully.',
        ]);
    }

    /**
     * Save the Helper's normal weekly availability.
     */
    public function saveAvailability(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== 'helper') {
            return response()->json([
                'success' => false,
                'message' => 'This area is only available to Helper accounts.',
            ], 403);
        }

        $validated = $request->validate([
            'availability' => [
                'required',
                'array',
                'min:1',
            ],

            'availability.*.day_of_week' => [
                'required',
                'integer',
                'between:0,6',
                'distinct',
            ],

            'availability.*.start_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'availability.*.end_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'availability.*.is_available' => [
                'required',
                'boolean',
            ],

            'timezone' => [
                'required',
                'string',
                'max:100',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Validate available-day times
        |--------------------------------------------------------------------------
        */

        foreach ($validated['availability'] as $day) {
            if (!$day['is_available']) {
                continue;
            }

            if (
                empty($day['start_time']) ||
                empty($day['end_time'])
            ) {
                return response()->json([
                    'success' => false,
                    'message' => 'Start and end times are required for every available day.',
                ], 422);
            }

            if ($day['start_time'] >= $day['end_time']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Availability end time must be later than the start time.',
                ], 422);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Save availability
        |--------------------------------------------------------------------------
        |
        | Only available days are stored.
        |
        | If there is no database row for a day, the Helper is considered
        | unavailable that day. This avoids inserting NULL start/end times
        | into columns that do not allow NULL values.
        |
        */

        DB::transaction(function () use (
            $user,
            $validated
        ) {
            DB::table('helper_availability')
                ->where('user_id', $user->id)
                ->delete();

            foreach ($validated['availability'] as $day) {
                if (!$day['is_available']) {
                    continue;
                }

                DB::table('helper_availability')->insert([
                    'user_id' => $user->id,
                    'day_of_week' => $day['day_of_week'],
                    'start_time' => $day['start_time'],
                    'end_time' => $day['end_time'],
                    'is_available' => true,
                    'timezone' => $validated['timezone'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Availability saved successfully.',
        ]);
    }
}
