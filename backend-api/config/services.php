<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'marketplace' => ['commission_percent' => 30],

    'paypal' => [
        'mode' => env('PAYPAL_MODE', 'sandbox'),
        'currency' => env('PAYPAL_CURRENCY', 'CAD'),
        'payouts_enabled' => (bool) env('PAYPAL_PAYOUTS_ENABLED', false),
        'live_payouts_enabled' => (bool) env('PAYPAL_LIVE_PAYOUTS_ENABLED', false),
        'live_direct_model_approved' => (bool) env('PAYPAL_LIVE_DIRECT_MODEL_APPROVED', false),
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),
        'merchant_id' => env('PAYPAL_MERCHANT_ID'),
        'webhook_id' => env('PAYPAL_WEBHOOK_ID'),
        'frontend_url' => rtrim(env('FRONTEND_URL', 'http://localhost:3000'), '/'),
    ],

];
