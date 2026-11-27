<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Throwable;

class CheckPayPalLiveReadiness extends Command
{
    protected $signature = 'paypal:check-live
        {--remote : Authenticate and read the configured Live webhook}
        {--payouts : Include payout webhook events in the remote check}';

    protected $description = 'Check Live PayPal settings without creating an order, capturing funds, or sending a payout';

    private const API = 'https://api-m.paypal.com';

    private const WEBHOOK = 'https://api.urbanhelphub.com/api/paypal/webhook';

    private const CHECKOUT_EVENTS = [
        'PAYMENT.CAPTURE.COMPLETED',
        'PAYMENT.CAPTURE.PENDING',
        'PAYMENT.CAPTURE.REFUNDED',
        'PAYMENT.CAPTURE.REVERSED',
        'CUSTOMER.DISPUTE.CREATED',
        'CUSTOMER.DISPUTE.UPDATED',
        'CUSTOMER.DISPUTE.RESOLVED',
    ];

    public function handle(): int
    {
        if (config('services.paypal.mode') !== 'live') {
            $this->error('Live settings are inactive. PAYPAL_MODE in the loaded configuration must be live.');

            return self::FAILURE;
        }

        $required = [
            'client_id' => 'PAYPAL_CLIENT_ID',
            'client_secret' => 'PAYPAL_CLIENT_SECRET',
            'merchant_id' => 'PAYPAL_MERCHANT_ID',
            'webhook_id' => 'PAYPAL_WEBHOOK_ID',
        ];
        $missing = array_filter($required, fn ($name, $key) => blank(config('services.paypal.'.$key)), ARRAY_FILTER_USE_BOTH);
        if ($missing) {
            $this->error('Required settings are missing: '.implode(', ', $missing));

            return self::FAILURE;
        }
        if (config('services.paypal.currency') !== 'CAD'
            || !in_array(config('services.paypal.frontend_url'), ['https://urbanhelphub.com', 'https://www.urbanhelphub.com'], true)) {
            $this->error('Set PAYPAL_CURRENCY to CAD and FRONTEND_URL to the public UrbanHelpHub HTTPS origin.');

            return self::FAILURE;
        }

        $payoutsEnabled = config('services.paypal.payouts_enabled') && config('services.paypal.live_payouts_enabled');
        $this->info('Checkout switch: '.(config('services.paypal.live_direct_model_approved') ? 'on' : 'off'));
        $this->info('Live payout switches: '.($payoutsEnabled ? 'on' : 'off'));

        $sandboxPayments = DB::table('payments')->where('provider', 'paypal')->where('paypal_mode', 'sandbox')
            ->whereIn('status', ['pending', 'partially_paid', 'blocked'])->count();
        $sandboxPayouts = DB::table('payouts')->join('payments', 'payments.id', '=', 'payouts.payment_id')
            ->where('payments.paypal_mode', 'sandbox')->whereIn('payouts.status', ['pending', 'processing'])->count();
        $this->line("Sandbox records needing review: {$sandboxPayments} payments and {$sandboxPayouts} payouts.");

        if ($this->option('payouts') && !$this->option('remote')) {
            $this->error('Use --remote with --payouts to check the Live webhook.');

            return self::FAILURE;
        }
        if (!$this->option('remote')) {
            $this->info('Local configuration checks passed. Use --remote to check Live credentials and the webhook.');

            return self::SUCCESS;
        }

        try {
            $token = Http::timeout(15)->asForm()->acceptJson()
                ->withBasicAuth(config('services.paypal.client_id'), config('services.paypal.client_secret'))
                ->post(self::API.'/v1/oauth2/token', ['grant_type' => 'client_credentials'])->throw()->json('access_token');
            if (!is_string($token) || $token === '') {
                $this->error('Live authentication did not return an access token.');

                return self::FAILURE;
            }
            $webhook = Http::timeout(15)->acceptJson()->withToken($token)
                ->get(self::API.'/v1/notifications/webhooks/'.rawurlencode(config('services.paypal.webhook_id')))
                ->throw()->json();
        } catch (Throwable) {
            $this->error('Could not authenticate to Live PayPal or read the webhook. Check the Live app credentials, webhook ID, and hosting connectivity.');

            return self::FAILURE;
        }

        if (($webhook['url'] ?? null) !== self::WEBHOOK) {
            $this->error('The Live webhook must use '.self::WEBHOOK);

            return self::FAILURE;
        }

        $events = array_column(is_array($webhook['event_types'] ?? null) ? $webhook['event_types'] : [], 'name');
        if (!in_array('*', $events, true)) {
            $missingEvents = array_diff(self::CHECKOUT_EVENTS, $events);
            if (!array_intersect(['PAYMENT.CAPTURE.DENIED', 'PAYMENT.CAPTURE.DECLINED'], $events)) {
                $missingEvents[] = 'PAYMENT.CAPTURE.DENIED or PAYMENT.CAPTURE.DECLINED';
            }
            if ($payoutsEnabled || $this->option('payouts')) {
                $missingEvents = array_merge($missingEvents, array_diff([
                    'PAYMENT.PAYOUTS-ITEM.SUCCEEDED', 'PAYMENT.PAYOUTS-ITEM.FAILED', 'PAYMENT.PAYOUTS-ITEM.RETURNED',
                ], $events));
            }
            if ($missingEvents) {
                $this->error('Missing webhook events: '.implode(', ', $missingEvents));

                return self::FAILURE;
            }
        }

        $this->info('Live OAuth and webhook configuration checks passed. Provider approval and actual payment processing require separate confirmation.');

        return self::SUCCESS;
    }
}
