<?php
use App\Http\Controllers\AdminController;
use App\Http\Middleware\RequireHelperApprovalReadiness;
use Illuminate\Support\Facades\Route;
foreach (Route::getRoutes() as $route) {
    if (in_array($route->getActionName(), [AdminController::class.'@updateService', AdminController::class.'@updateVerification'], true)
        && !in_array(RequireHelperApprovalReadiness::class, $route->middleware(), true)) {
        $route->middleware(RequireHelperApprovalReadiness::class);
    }
}
