<?php

use App\Http\Controllers\PlatformSettingsController;
use App\Http\Middleware\SuperAdminMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('/platform-settings', [PlatformSettingsController::class, 'show']);
Route::middleware(['auth:sanctum', SuperAdminMiddleware::class])->group(function () {
    Route::get('/admin/platform-settings', [PlatformSettingsController::class, 'show']);
    Route::put('/admin/platform-settings', [PlatformSettingsController::class, 'update']);
});
