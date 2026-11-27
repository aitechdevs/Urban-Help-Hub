<?php

use App\Http\Controllers\HelperProfileController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    Route::patch('/helper/profile', [HelperProfileController::class, 'update']);
    Route::patch('/helper/profile/services/{serviceId}', [HelperProfileController::class, 'updateService'])
        ->whereNumber('serviceId');
});
