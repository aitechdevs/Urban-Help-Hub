<?php

namespace App\Http\Controllers;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class PlatformSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        $saved = DB::table('platform_settings')->where('id', 1)->value('content');

        return response()->json(['success' => true, 'data' => $saved ? json_decode($saved, true, flags: JSON_THROW_ON_ERROR) : [
            'display_name' => '',
            'tagline' => '',
            'support_email' => '',
            'support_phone' => '',
            'social_links' => [],
        ]])->header('Cache-Control', 'no-store');
    }

    public function update(Request $request): JsonResponse
    {
        $content = $request->validate([
            'display_name' => ['present', 'nullable', 'string', 'max:100'],
            'tagline' => ['present', 'nullable', 'string', 'max:250'],
            'support_email' => ['present', 'nullable', 'email:rfc', 'max:254'],
            'support_phone' => ['present', 'nullable', 'string', 'max:30', 'regex:/^\+?[0-9 ()-]{7,29}$/D'],
            'social_links' => ['present', 'array', 'list', 'max:12'],
            'social_links.*' => ['array:label,url,icon,custom_icon'],
            'social_links.*.label' => ['required', 'string', 'max:50'],
            'social_links.*.url' => ['required', 'string', 'url:https', 'max:500'],
            'social_links.*.icon' => ['required', Rule::in(['facebook', 'instagram', 'youtube', 'tiktok', 'linkedin', 'x', 'whatsapp', 'link', 'custom'])],
            'social_links.*.custom_icon' => ['bail', 'required_if:social_links.*.icon,custom', 'nullable', 'string', 'max:45000', $this->validateIcon(...)],
        ]);

        $content['social_links'] = array_values(array_map(function (array $link): array {
            if ($link['icon'] !== 'custom') {
                unset($link['custom_icon']);
            }

            return $link;
        }, $content['social_links']));
        DB::table('platform_settings')->upsert([
            ['id' => 1, 'content' => json_encode($content, JSON_THROW_ON_ERROR), 'updated_at' => now()],
        ], ['id'], ['content', 'updated_at']);

        return response()->json(['success' => true, 'data' => $content, 'message' => 'Platform settings saved.']);
    }

    private function validateIcon(string $attribute, string $value, Closure $fail): void
    {
        if (preg_match('~^data:(image/(?:png|webp));base64,([A-Za-z0-9+/=]+)$~D', $value, $parts)) {
            $bytes = base64_decode($parts[2], true);
            $image = $bytes && strlen($bytes) <= 32768 ? @getimagesizefromstring($bytes) : false;
            if ($image && $image['mime'] === $parts[1] && min($image[0], $image[1]) > 0 && max($image[0], $image[1]) <= 512) {
                return;
            }
        }

        $fail('Upload a PNG or WebP icon up to 32 KB and 512 pixels on each side.');
    }
}
