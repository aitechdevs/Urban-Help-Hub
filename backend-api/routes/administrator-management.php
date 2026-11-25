<?php

use App\Http\Controllers\AdministratorManagementController;
use App\Http\Middleware\SuperAdminMiddleware;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', SuperAdminMiddleware::class])
    ->prefix('admin/administrators')
    ->controller(AdministratorManagementController::class)
    ->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store')->middleware('throttle:10,1');
        Route::put('/{administrator}', 'update')->whereNumber('administrator')->middleware('throttle:10,1');
    });
