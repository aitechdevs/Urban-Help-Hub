<?php

use App\Http\Controllers\AccountEmailConfirmationController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/email/confirm', [AccountEmailConfirmationController::class, 'confirm'])->middleware('throttle:10,1');
Route::post('/auth/email/resend', [AccountEmailConfirmationController::class, 'resend'])->middleware('throttle:5,1');
