<?php

use App\Http\Controllers\CustomerProfileApprovalController;
use App\Http\Controllers\HelperReviewQueueController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/customer/profile', [CustomerProfileApprovalController::class, 'show']);
    Route::put('/customer/profile', [CustomerProfileApprovalController::class, 'submit']);
    Route::middleware('admin')->group(function () {
        Route::get('/admin/review/summary', [HelperReviewQueueController::class, 'summary']);
        Route::get('/admin/review/helpers', [HelperReviewQueueController::class, 'helpers']);
        Route::get('/admin/review/customers', [CustomerProfileApprovalController::class, 'customers']);
        Route::get('/admin/review/customer-profiles', [CustomerProfileApprovalController::class, 'queue']);
        Route::put('/admin/review/customer-profiles/{changeId}', [CustomerProfileApprovalController::class, 'review']);
    });
});
