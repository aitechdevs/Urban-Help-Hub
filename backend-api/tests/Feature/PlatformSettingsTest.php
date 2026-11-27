<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PlatformSettingsTest extends TestCase
{
    use RefreshDatabase;

    private const PUBLIC_URL = '/api/platform-settings';

    private const ADMIN_URL = '/api/admin/platform-settings';

    public function test_only_an_active_super_admin_can_update_the_public_settings(): void
    {
        $this->getJson(self::PUBLIC_URL)->assertOk()->assertJsonPath('data.social_links', []);
        $this->getJson(self::ADMIN_URL)->assertUnauthorized();
        $this->putJson(self::ADMIN_URL)->assertUnauthorized();

        foreach ([['admin', 'active'], ['super_admin', 'suspended']] as [$role, $status]) {
            $actor = User::factory()->create(compact('role', 'status'));
            $this->withToken($actor->createToken('test')->plainTextToken);
            $this->getJson(self::ADMIN_URL)->assertForbidden();
            $this->putJson(self::ADMIN_URL)->assertForbidden();
            $this->app['auth']->forgetGuards();
        }

        $owner = User::factory()->create(['role' => 'super_admin', 'status' => 'active']);
        $this->withToken($owner->createToken('test')->plainTextToken);
        $details = [
            'display_name' => 'UrbanHelpHub',
            'tagline' => 'Local help across Canada',
            'support_email' => 'support@example.com',
            'support_phone' => '+1 416 555 0100',
            'social_links' => [
                ['label' => 'YouTube', 'url' => 'https://www.youtube.com/@example', 'icon' => 'youtube'],
                ['label' => 'Community', 'url' => 'https://example.com/community', 'icon' => 'custom'],
            ],
            'paypal_client_secret' => 'private setting',
        ];
        $this->putJson(self::ADMIN_URL, $details)->assertUnprocessable()->assertJsonValidationErrors('social_links.1.custom_icon');
        $details['social_links'][1]['custom_icon'] = 'data:image/svg+xml;base64,PHN2Zy8+';
        $this->putJson(self::ADMIN_URL, $details)->assertUnprocessable()->assertJsonValidationErrors('social_links.1.custom_icon');

        $details['social_links'][1]['custom_icon'] = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==';
        $details['social_links'][1]['url'] = 'http://example.com/community';
        $this->putJson(self::ADMIN_URL, $details)->assertUnprocessable()->assertJsonValidationErrors('social_links.1.url');
        $details['social_links'][1]['url'] = 'https://example.com/community';

        $this->putJson(self::ADMIN_URL, $details)->assertOk();
        $this->getJson(self::PUBLIC_URL)->assertOk()
            ->assertJsonPath('data.support_email', $details['support_email'])
            ->assertJsonPath('data.social_links', $details['social_links'])
            ->assertJsonMissingPath('data.paypal_client_secret');
    }
}
