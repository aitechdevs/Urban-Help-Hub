<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\CustomerProfileApprovalController;
use App\Http\Middleware\QueueFinalApprovalEmail;
use Illuminate\Support\Facades\Route;

// Load this file LAST in routes/api.php, after account-review.php and all existing route groups.
foreach (Route::getRoutes() as $route) {
    if (in_array($route->getActionName(), [AdminController::class.'@updateVerification', CustomerProfileApprovalController::class.'@review'], true)) {
        if (!in_array(QueueFinalApprovalEmail::class, $route->middleware(), true)) $route->middleware(QueueFinalApprovalEmail::class);
    }
}
