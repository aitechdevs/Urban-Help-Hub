<?php

use App\Http\Controllers\AdministratorActivityController;
use App\Http\Middleware\SuperAdminMiddleware;
use Illuminate\Support\Facades\Route;

Route::get('/admin/activity', [AdministratorActivityController::class, 'index'])
    ->middleware(['auth:sanctum', SuperAdminMiddleware::class]);
