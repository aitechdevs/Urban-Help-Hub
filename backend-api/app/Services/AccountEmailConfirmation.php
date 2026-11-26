<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

class AccountEmailConfirmation
{
    public const EVENT_TYPE = 'account_email_confirmation';

    public function isPending(User $user): bool
    {
        return DB::table('account_email_confirmations')->where('user_id', $user->id)->whereNull('confirmed_at')->exists();
    }

    // Callers create the account and issue the first link in the same transaction.
    public function start(User $user): void
    {
        $this->issue($user);
    }

    public function resend(string $email, bool $enrollSuperAdmin = false): bool
    {
        return DB::transaction(function () use ($email, $enrollSuperAdmin): bool {
            $user = User::query()->where('email', strtolower(trim($email)))->lockForUpdate()->first();

            if (!$user || ($enrollSuperAdmin && ($user->role !== 'super_admin' || $user->status !== 'active'))) {
                return false;
            }

            $pending = DB::table('account_email_confirmations')->where('user_id', $user->id)->first();
            if (!$pending) {
                if (!$enrollSuperAdmin || $user->email_verified_at) {
                    return false;
                }

                $user->tokens()->delete();
                $this->issue($user);

                return true;
            }
            if ($pending->confirmed_at || Carbon::parse($pending->issued_at)->gt(now()->subMinutes(2))) {
                return false;
            }

            $this->issue($user);

            return true;
        }, 3);
    }

    public function confirm(string $token): ?User
    {
        $digest = hash('sha256', $token);
        $userId = DB::table('account_email_confirmations')->where('token_digest', $digest)->value('user_id');
        if (!$userId) {
            return null;
        }

        return DB::transaction(function () use ($digest, $userId): ?User {
            $user = User::query()->lockForUpdate()->find($userId);
            $pending = DB::table('account_email_confirmations')->where('user_id', $userId)
                ->where('token_digest', $digest)->whereNull('confirmed_at')->where('expires_at', '>', now())->first();
            if (!$user || !$pending || $user->email !== $pending->email) {
                return null;
            }

            $verifiedAt = now();
            $user->forceFill(['email_verified_at' => $verifiedAt])->save();
            DB::table('account_email_confirmations')->where('user_id', $userId)->update([
                'confirmed_at' => $verifiedAt,
                'token_digest' => null,
            ]);

            return $user;
        }, 3);
    }

    private function issue(User $user): void
    {
        $token = bin2hex(random_bytes(32));
        $digest = hash('sha256', $token);
        $now = now();
        $link = 'https://urbanhelphub.com/confirm-email/#token='.$token;
        $role = match ($user->role) {
            'super_admin' => 'Super Admin',
            'admin' => 'Administrator',
            'helper' => 'Helper',
            default => 'Customer',
        };

        DB::table('account_email_confirmations')->updateOrInsert(['user_id' => $user->id], [
            'email' => $user->email,
            'token_digest' => $digest,
            'issued_at' => $now,
            'expires_at' => $now->copy()->addDay(),
            'confirmed_at' => null,
        ]);

        $subjects = [
            'admin' => 'Confirm your Administrator email',
            'super_admin' => 'Confirm your Super Admin email',
            'helper' => 'Confirm your Helper email',
            'customer' => 'Confirm your Customer email',
        ];
        $details = match ($user->role) {
            'admin' => 'Your account also needs to be activated by a Super Admin before you can sign in.',
            'helper' => 'After confirming your email, sign in to complete your Helper profile and application.',
            'customer' => 'After confirming your email, sign in to manage your tasks from the Customer dashboard.',
            default => 'After confirming your email, sign in to open the Administrator dashboard.',
        };
        $body = "Hello {$user->name},\n\nConfirm the email address for your UrbanHelpHub {$role} account.\n\n"
            .$link."\n\nThis link expires in 24 hours and can only be used once.\n\n{$details}"
            ."\n\nIf you did not expect this email, you can ignore it.\n\nUrbanHelpHub";

        DB::table('approval_email_outbox')->insert([
            'event_key' => self::EVENT_TYPE.':'.$digest,
            'user_id' => $user->id,
            'event_type' => self::EVENT_TYPE,
            'recipient' => $user->email,
            'subject' => 'UrbanHelpHub: '.($subjects[$user->role] ?? 'Confirm your email'),
            'body' => Crypt::encryptString($body),
            'status' => 'pending',
            'attempts' => 0,
            'next_attempt_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
}
