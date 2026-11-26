<?php

use App\Http\Controllers\AdminController;
use App\Http\Middleware\NotifyAdministratorDecision;
use Illuminate\Support\Facades\Route;

$helperDecisionActions = array_map(fn ($method) => AdminController::class.'@'.$method, [
    'updateVerification', 'updateService', 'updateDocument', 'updateHelperStatus',
]);
foreach (Route::getRoutes() as $route) {
    if (in_array($route->getActionName(), $helperDecisionActions, true)
        && !in_array(NotifyAdministratorDecision::class, $route->middleware(), true)) {
        $route->middleware(NotifyAdministratorDecision::class);
    }
}
