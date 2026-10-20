<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\HelperOnboardingController;
use App\Http\Middleware\OneHelperIdentity;
use Illuminate\Support\Facades\Route;

foreach (Route::getRoutes() as $route) {
    if (in_array($route->getActionName(), [HelperOnboardingController::class.'@show',
        HelperOnboardingController::class.'@uploadDocument', AdminController::class.'@helper'], true)) {
        if (!in_array(OneHelperIdentity::class, $route->middleware(), true)) $route->middleware(OneHelperIdentity::class);
    }
}
