<?php
namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Throwable;

class PasswordRecoveryController extends Controller
{
    public function requestLink(Request $request): JsonResponse
    {
        $input = $request->validate(['email' => ['required', 'email', 'max:255']]);
        try {
            Password::broker('users')->sendResetLink($input, function ($user, $token) {
                // Fixed trusted frontend: never construct reset URLs from request Host headers.
                // Fragment keeps the token out of frontend access logs and referrers.
                $url = 'https://urbanhelphub.com/reset-password/#'.http_build_query([
                    'token' => $token, 'email' => $user->getEmailForPasswordReset(),
                ], '', '&', PHP_QUERY_RFC3986);
                $minutes = (int) config('auth.passwords.users.expire', 60);
                Mail::raw("A password reset was requested for your UrbanHelpHub account.\n\nChoose a new password:\n".$url
                    ."\n\nThis link expires in {$minutes} minutes and can be used once. If you did not request this, you can ignore this email. Your password has not changed.\n\nUrbanHelpHub",
                    function ($message) use ($user) {
                        $message->to($user->getEmailForPasswordReset())->subject('UrbanHelpHub: Reset your password');
                    });
            });
        } catch (Throwable $exception) {
            // Do not log addresses, reset tokens, URLs, SMTP credentials or exception messages.
            Log::warning('Password reset email could not be dispatched.', ['exception_class' => get_class($exception)]);
        }
        return response()->json(['success' => true,
            'message' => 'If an account uses that email address, a password reset link will be sent. Check your inbox and spam folder. Please wait a minute before requesting another link.']);
    }

    public function reset(Request $request): JsonResponse
    {
        $input = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'token' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'max:128', 'confirmed'],
        ]);
        $status = DB::transaction(function () use ($input) {
            // Serializes simultaneous reset attempts for the same account.
            $user = User::where('email', $input['email'])->lockForUpdate()->first();
            if (!$user) return Password::INVALID_TOKEN;
            $input['email'] = $user->getEmailForPasswordReset();
            return Password::broker('users')->reset($input, function ($user, $password) {
                $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();
                // Revoke existing API sessions after recovering the account.
                $user->tokens()->delete();
                if (config('session.driver') === 'database') {
                    DB::table(config('session.table', 'sessions'))->where('user_id', $user->id)->delete();
                }
                event(new PasswordReset($user));
            });
        }, 3);
        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['success' => false,
                'message' => 'This reset link is invalid, expired or already used. Please request a new link.'], 422);
        }
        return response()->json(['success' => true, 'message' => 'Your password has been changed. Sign in with your new password.']);
    }
}
