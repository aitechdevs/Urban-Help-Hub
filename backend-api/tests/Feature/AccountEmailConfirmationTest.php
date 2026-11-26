<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\AccountEmailConfirmation;
use App\Services\ApprovalEmailDelivery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class AccountEmailConfirmationTest extends TestCase
{
    use RefreshDatabase;

    private function register(string $role): User
    {
        $id = $this->postJson('/api/register', [
            'name' => 'Test User', 'email' => strtoupper($role).'@EXAMPLE.TEST', 'role' => $role,
            'password' => 'a test password', 'password_confirmation' => 'a test password',
        ])->assertCreated()->assertJsonPath('data.email_confirmation_required', true)
            ->assertJsonMissingPath('data.token')->json('data.user.id');

        return User::findOrFail($id);
    }

    private function tokenFor(User $user): string
    {
        $mail = DB::table('approval_email_outbox')->where('user_id', $user->id)->latest('id')->first();
        $this->assertSame($user->email, $mail->recipient);
        $this->assertSame(AccountEmailConfirmation::EVENT_TYPE, $mail->event_type);
        preg_match('~https://urbanhelphub.com/confirm-email/#token=([a-f0-9]{64})~', Crypt::decryptString($mail->body), $match);
        $this->assertArrayHasKey(1, $match);
        $this->assertStringNotContainsString($match[1], $mail->body);

        return $match[1];
    }

    private function credentials(User $user): array
    {
        return ['email' => $user->email, 'password' => 'a test password'];
    }

    public function test_new_customers_and_helpers_confirm_email_before_signing_in(): void
    {
        foreach (['customer', 'helper'] as $role) {
            $user = $this->register($role);
            $this->assertSame($role.'@example.test', $user->email);
            $this->assertSame(0, $user->tokens()->count());
            $this->postJson('/api/login', $this->credentials($user))->assertForbidden()
                ->assertJsonPath('code', 'email_confirmation_required');

            $token = $this->tokenFor($user);
            $this->assertDatabaseHas('account_email_confirmations', ['user_id' => $user->id, 'token_digest' => hash('sha256', $token)]);
            $this->getJson('/api/auth/email/confirm')->assertMethodNotAllowed();
            $this->postJson('/api/auth/email/confirm', compact('token'))->assertOk()->assertJsonMissingPath('data.token');
            $this->postJson('/api/auth/email/confirm', compact('token'))->assertUnprocessable();
            $this->assertNotNull($user->fresh()->email_verified_at);
            $this->postJson('/api/login', $this->credentials($user))->assertOk()->assertJsonPath('data.user.role', $role);
        }
    }

    public function test_expired_link_can_be_replaced_and_delivery_uses_the_logo(): void
    {
        $recipient = $this->register('customer');
        $oldToken = $this->tokenFor($recipient);
        $this->travel(25)->hours();
        $this->postJson('/api/auth/email/confirm', ['token' => $oldToken])->assertUnprocessable();
        $response = $this->postJson('/api/auth/email/resend', ['email' => $recipient->email])->assertOk();
        $this->postJson('/api/auth/email/resend', ['email' => 'unknown@example.test'])->assertOk()->assertExactJson($response->json());
        $this->postJson('/api/auth/email/resend', ['email' => $recipient->email])->assertOk();
        $this->assertDatabaseCount('approval_email_outbox', 2);
        $token = $this->tokenFor($recipient);
        $this->assertNotSame($token, $oldToken);
        $this->postJson('/api/auth/email/confirm', ['token' => $oldToken])->assertUnprocessable();

        $html = '';
        Event::listen(MessageSending::class, function (MessageSending $event) use (&$html): void {
            $html = $event->message->getHtmlBody();
        });
        $delivery = app(ApprovalEmailDelivery::class);
        $this->assertSame('skipped', $delivery->deliverNext());
        $this->assertSame('sent', $delivery->deliverNext());
        $this->assertStringContainsString('alt="UrbanHelpHub"', $html);
        $this->assertStringContainsString('https://urbanhelphub.com/confirm-email/#token='.$token, $html);
        $this->assertStringNotContainsString($oldToken, $html);
        $this->postJson('/api/auth/email/confirm', compact('token'))->assertOk();
    }

    public function test_server_can_enroll_a_new_super_admin_without_changing_existing_sign_in(): void
    {
        $owner = User::factory()->create([
            'role' => 'super_admin', 'status' => 'active', 'email_verified_at' => null, 'password' => 'a test password',
        ]);
        $this->postJson('/api/login', $this->credentials($owner))->assertOk();
        $this->artisan('accounts:confirm-super-admin-email', ['email' => $owner->email])->assertSuccessful();
        $this->assertSame(0, $owner->tokens()->count());
        $this->postJson('/api/login', $this->credentials($owner))->assertForbidden();
        $this->postJson('/api/auth/email/confirm', ['token' => $this->tokenFor($owner)])->assertOk();
        $this->postJson('/api/login', $this->credentials($owner))->assertOk()->assertJsonPath('data.user.role', 'super_admin');

        $customer = User::factory()->create(['role' => 'customer', 'email_verified_at' => null, 'password' => 'a test password']);
        $this->artisan('accounts:confirm-super-admin-email', ['email' => $customer->email])->assertFailed();
        $this->postJson('/api/login', $this->credentials($customer))->assertOk();
    }
}
