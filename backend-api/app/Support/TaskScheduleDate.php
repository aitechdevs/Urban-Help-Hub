<?php

namespace App\Support;

use Illuminate\Http\Request;

class TaskScheduleDate
{
    private const CANADIAN_PROVINCES = [
        'AB' => ['alberta', 'America/Edmonton'],
        'BC' => ['british columbia', 'America/Vancouver'],
        'MB' => ['manitoba', 'America/Winnipeg'],
        'NB' => ['new brunswick', 'America/Moncton'],
        'NL' => ['newfoundland and labrador', 'America/St_Johns'],
        'NS' => ['nova scotia', 'America/Halifax'],
        'NT' => ['northwest territories', 'America/Yellowknife'],
        'NU' => ['nunavut', 'America/Iqaluit'],
        'ON' => ['ontario', 'America/Toronto'],
        'PE' => ['prince edward island', 'America/Halifax'],
        'QC' => ['quebec', 'America/Toronto'],
        'SK' => ['saskatchewan', 'America/Regina'],
        'YT' => ['yukon', 'America/Whitehorse'],
    ];

    public static function timezones(): array
    {
        $provinces = [];
        foreach (self::CANADIAN_PROVINCES as $code => [$name, $timezone]) {
            $provinces[strtolower($code)] = $timezone;
            $provinces[$name] = $timezone;
        }
        $provinces['québec'] = $provinces['quebec'];

        return [
            'canada' => [
                'default' => 'America/Toronto',
                'provinces' => $provinces,
            ],
            'default' => config('app.timezone', 'UTC'),
        ];
    }

    public static function rules(Request $request): array
    {
        $country = $request->input('country');
        $province = $request->input('province');
        $timezones = self::timezones();
        $timezone = $timezones['default'];
        if (is_string($country) && in_array(mb_strtolower(trim($country)), ['canada', 'ca'], true)) {
            $province = is_string($province) ? mb_strtolower(trim($province)) : '';
            $timezone = $timezones['canada']['provinces'][$province] ?? $timezones['canada']['default'];
        }

        return ['required', 'date', 'after_or_equal:'.now($timezone)->toDateString()];
    }
}
