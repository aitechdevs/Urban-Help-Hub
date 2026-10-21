<?php
namespace Tests\Feature;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordRecoveryTest extends TestCase
{
    use RefreshDatabase;
    public function test_valid_token_changes_password_once_and_revokes_api_tokens(): void
    {
        $user = User::factory()->create();
        $user->createToken('old-session');
        $token = Password::broker('users')->createToken($user);
        $input = ['email' => $user->email, 'token' => $token, 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'];
        $this->postJson('/api/auth/password/reset', $input)->assertOk();
        $this->assertTrue(Hash::check('NewPassword123!', $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
        $this->postJson('/api/auth/password/reset', $input)->assertStatus(422);
    }
    public function test_expired_token_does_not_change_password(): void
    {
        $user = User::factory()->create();
        $old = $user->password;
        $token = Password::broker('users')->createToken($user);
        $this->travel(61)->minutes();
        $this->postJson('/api/auth/password/reset', ['email' => $user->email, 'token' => $token, 'password' => 'NewPassword123!', 'password_confirmation' => 'NewPassword123!'])->assertStatus(422);
        $this->assertSame($old, $user->fresh()->password);
    }
    public function test_mismatched_confirmation_is_rejected(): void
    {
        $this->postJson('/api/auth/password/reset', ['email' => 'test@example.test', 'token' => 'invalid', 'password' => 'NewPassword123!', 'password_confirmation' => 'DifferentPassword'])->assertUnprocessable()->assertJsonValidationErrors('password');
    }
    public function test_unknown_account_gets_generic_request_response(): void
    {
        $this->postJson('/api/auth/password/email', ['email' => 'unknown@example.test'])->assertOk()->assertJson(['success' => true]);
    }
}
