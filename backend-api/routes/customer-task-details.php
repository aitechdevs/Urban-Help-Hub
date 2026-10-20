<?php

use App\Http\Controllers\CustomerTaskDetailsController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->put('/customer/tasks/{taskId}/details', CustomerTaskDetailsController::class);
