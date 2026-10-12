<?php

return [
    'settlement_currency' => 'CAD',

    // Amount of CAD represented by one unit of the transaction currency.
    // Override these indicative MVP values in .env before accepting real payments.
    'rates_to_cad' => [
        'CAD' => 1.0,
        'AUD' => (float) env('FX_AUD_TO_CAD', 0.89),
        'AED' => (float) env('FX_AED_TO_CAD', 0.37),
        'EUR' => (float) env('FX_EUR_TO_CAD', 1.58),
        'GBP' => (float) env('FX_GBP_TO_CAD', 1.84),
        'GHS' => (float) env('FX_GHS_TO_CAD', 0.12),
        'INR' => (float) env('FX_INR_TO_CAD', 0.016),
        'KES' => (float) env('FX_KES_TO_CAD', 0.0105),
        'NGN' => (float) env('FX_NGN_TO_CAD', 0.00095),
        'NZD' => (float) env('FX_NZD_TO_CAD', 0.78),
        'USD' => (float) env('FX_USD_TO_CAD', 1.36),
        'ZAR' => (float) env('FX_ZAR_TO_CAD', 0.075),
    ],
];
