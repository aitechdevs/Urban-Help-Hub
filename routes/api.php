<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\HelperOnboardingController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ServiceCategoryController;
use App\Http\Controllers\StripeConnectController;
use App\Http\Controllers\StripePaymentController;
use Illuminate\Support\Facades\Route;

Route::get('/service-categories', [
    ServiceCategoryController::class,
    'index'
]);

Route::post('/register', [
    AuthController::class,
    'register'
]);

Route::post('/login', [
    AuthController::class,
    'login'
]);

Route::post('/stripe/webhook', [StripePaymentController::class, 'webhook']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [
        AuthController::class,
        'me'
    ]);

    Route::post('/logout', [
        AuthController::class,
        'logout'
    ]);

    Route::put('/user/preferences', [
        AuthController::class,
        'updatePreferences'
    ]);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllRead']);
    Route::put('/notifications/{notificationId}/read', [NotificationController::class, 'markRead']);

    Route::get('/helper/onboarding', [
        HelperOnboardingController::class,
        'show'
    ]);

    Route::put('/helper/onboarding/services', [
        HelperOnboardingController::class,
        'saveServices'
    ]);

    Route::put('/helper/onboarding/profile', [
        HelperOnboardingController::class,
        'saveProfile'
    ]);

    Route::put('/helper/onboarding/availability', [
        HelperOnboardingController::class,
        'saveAvailability'
    ]);

    Route::post('/helper/documents', [
        HelperOnboardingController::class,
        'uploadDocument'
    ]);

    Route::get('/helper/documents/{documentId}', [
        HelperOnboardingController::class,
        'viewDocument'
    ]);

    Route::delete('/helper/documents/{documentId}', [
        HelperOnboardingController::class,
        'deleteDocument'
    ]);

    Route::get('/helper/stripe/status', [StripeConnectController::class, 'status']);
    Route::post('/helper/stripe/onboarding-link', [StripeConnectController::class, 'onboardingLink']);
    Route::post('/helper/stripe/dashboard-link', [StripeConnectController::class, 'dashboardLink']);

    Route::get('/customer/tasks', [MarketplaceController::class, 'customerTasks']);
    Route::post('/customer/tasks', [MarketplaceController::class, 'createTask']);
    Route::put('/customer/tasks/{taskId}/confirm', [MarketplaceController::class, 'confirmHelper']);
    Route::put('/customer/tasks/{taskId}/confirm-completion', [MarketplaceController::class, 'confirmCompletion']);
    Route::post('/customer/payments/{paymentId}/checkout', [StripePaymentController::class, 'checkout']);
    Route::put('/tasks/{taskId}/review', [MarketplaceController::class, 'submitReview']);

    Route::get('/helper/opportunities', [MarketplaceController::class, 'helperOpportunities']);
    Route::get('/helper/jobs', [MarketplaceController::class, 'helperJobs']);
    Route::put('/helper/opportunities/{assignmentId}/accept', [MarketplaceController::class, 'acceptOpportunity']);
    Route::put('/helper/opportunities/{assignmentId}/decline', [MarketplaceController::class, 'declineOpportunity']);
    Route::put('/helper/jobs/{assignmentId}/start', [MarketplaceController::class, 'startJob']);
    Route::put('/helper/jobs/{assignmentId}/complete', [MarketplaceController::class, 'completeJob']);
    Route::get('/messages', [MessageController::class, 'index']);
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);
    Route::post('/tasks/{taskId}/messages', [MessageController::class, 'store']);

    /*
    |--------------------------------------------------------------------------
    | Administrator API
    |--------------------------------------------------------------------------
    |
    | Sanctum authentication is required first.
    | AdminMiddleware then checks that the authenticated account
    | actually has the admin role and remains active.
    |
    */

    Route::middleware('admin')
        ->prefix('admin')
        ->group(function () {
            Route::get('/dashboard', [
                AdminController::class,
                'dashboard'
            ]);

            Route::get('/helpers', [
                AdminController::class,
                'helpers'
            ]);

            Route::get('/payments', [
                AdminController::class,
                'payments'
            ]);

            Route::get('/tasks', [
                AdminController::class,
                'tasks'
            ]);

            Route::put('/tasks/{taskId}/approval', [
                AdminController::class,
                'updateTaskApproval'
            ]);

            Route::put('/payments/{paymentId}/status', [
                AdminController::class,
                'updatePaymentStatus'
            ]);

            Route::put('/payouts/{payoutId}/status', [
                AdminController::class,
                'updatePayoutStatus'
            ]);

            Route::get('/helpers/{userId}', [
                AdminController::class,
                'helper'
            ]);

            Route::put(
                '/helpers/{userId}/verification',
                [
                    AdminController::class,
                    'updateVerification'
                ]
            );

            Route::put(
                '/helpers/{userId}/services/{serviceId}',
                [
                    AdminController::class,
                    'updateService'
                ]
            );

            Route::put(
                '/helpers/{userId}/documents/{documentId}',
                [
                    AdminController::class,
                    'updateDocument'
                ]
            );

            Route::get(
                '/helpers/{userId}/documents/{documentId}',
                [
                    AdminController::class,
                    'viewDocument'
                ]
            );

            Route::put(
                '/helpers/{userId}/status',
                [
                    AdminController::class,
                    'updateHelperStatus'
                ]
            );
        });
});
