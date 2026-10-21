<?php
use App\Http\Controllers\PasswordRecoveryController;
use Illuminate\Support\Facades\Route;

Route::middleware('throttle:5,1')->post('/auth/password/email', [PasswordRecoveryController::class, 'requestLink']);
Route::middleware('throttle:10,1')->post('/auth/password/reset', [PasswordRecoveryController::class, 'reset']);
