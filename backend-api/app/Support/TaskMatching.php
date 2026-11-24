<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use stdClass;

class TaskMatching
{
    public static function offerOpenTasks(int $helperId): void
    {
        DB::table('tasks')
            ->where('status', 'open')
            ->whereNotNull('published_at')
            ->whereIn('service_category_id', DB::table('helper_services')
                ->where('user_id', $helperId)
                ->where('approval_status', 'approved')
                ->where('is_active', true)
                ->select('service_category_id'))
            ->select('id')
            ->eachById(function (stdClass $candidate) use ($helperId): void {
                DB::transaction(function () use ($candidate, $helperId): void {
                    $task = DB::table('tasks')->where('id', $candidate->id)->lockForUpdate()->first();
                    if ($task && $task->status === 'open' && $task->published_at !== null) {
                        self::offer($task, $helperId);
                    }
                }, 3);
            });
    }

    // Callers hold the task row lock while creating offers and notifications.
    public static function offer(stdClass $task, ?int $helperId = null, bool $reoffer = false): int
    {
        $helpers = self::eligibleHelpers($task, $helperId)->get(['users.id', 'helper_services.hourly_rate']);

        $matched = 0;
        foreach ($helpers as $helper) {
            $assignment = DB::table('task_assignments')
                ->where('task_id', $task->id)
                ->where('helper_id', $helper->id);
            $now = now();
            $offer = [
                'status' => 'offered',
                'agreed_hourly_rate' => $helper->hourly_rate,
                'agreed_fixed_price' => null,
                'accepted_at' => null,
                'assigned_at' => $now,
                'updated_at' => $now,
            ];

            if ($assignment->exists()) {
                if (!$reoffer || !$assignment->whereIn('status', ['not_selected', 'declined'])->update($offer)) {
                    continue;
                }
            } else {
                DB::table('task_assignments')->insert($offer + [
                    'task_id' => $task->id,
                    'helper_id' => $helper->id,
                    'created_at' => $now,
                ]);
            }

            InAppNotification::send(
                (int) $helper->id,
                'new_opportunity',
                'New job opportunity',
                'A new “'.$task->title.'” task matches your services and location.',
                '/helper/dashboard',
                ['task_id' => $task->id]
            );
            $matched++;
        }

        return $matched;
    }

    public static function helperIsEligible(stdClass $task, int $helperId): bool
    {
        return self::eligibleHelpers($task, $helperId)->exists();
    }

    private static function eligibleHelpers(stdClass $task, ?int $helperId): Builder
    {
        return DB::table('helper_services')
            ->join('users', 'helper_services.user_id', '=', 'users.id')
            ->join('profiles', 'users.id', '=', 'profiles.user_id')
            ->where('helper_services.service_category_id', $task->service_category_id)
            ->where('helper_services.approval_status', 'approved')
            ->where('helper_services.is_active', true)
            ->where('users.role', 'helper')
            ->where('users.status', 'active')
            ->where('users.currency_code', $task->currency ?: 'CAD')
            ->where('profiles.verification_status', 'verified')
            ->whereRaw('LOWER(profiles.country) = LOWER(?)', [$task->country])
            ->whereIn(DB::raw('LOWER(profiles.province)'), self::provinceAliases($task->country, $task->province))
            ->whereRaw('LOWER(profiles.city) = LOWER(?)', [$task->city])
            ->when($helperId !== null, fn ($query) => $query->where('users.id', $helperId));
    }

    private static function provinceAliases(?string $country, ?string $province): array
    {
        $normalized = strtolower(trim((string) $province));
        if (strtolower(trim((string) $country)) !== 'canada') {
            return [$normalized];
        }
        $canada = [
            'ab' => 'alberta', 'bc' => 'british columbia', 'mb' => 'manitoba',
            'nb' => 'new brunswick', 'nl' => 'newfoundland and labrador', 'ns' => 'nova scotia',
            'nt' => 'northwest territories', 'nu' => 'nunavut', 'on' => 'ontario',
            'pe' => 'prince edward island', 'qc' => 'quebec', 'sk' => 'saskatchewan', 'yt' => 'yukon',
        ];
        foreach ($canada as $code => $name) {
            if ($normalized === $code || $normalized === $name) {
                return [$code, $name];
            }
        }
        return [$normalized];
    }
}
