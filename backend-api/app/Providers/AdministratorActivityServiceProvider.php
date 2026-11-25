<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Foundation\Http\Events\RequestHandled;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Throwable;

class AdministratorActivityServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Event::listen(RequestHandled::class, $this->record(...));
    }

    public function record(RequestHandled $event): void
    {
        $route = $event->request->route();
        $uri = $route?->uri() ?? '';
        $method = $event->request->method();
        $status = $event->response->getStatusCode();

        if (!str_starts_with($uri, 'api/') || in_array($method, ['HEAD', 'OPTIONS'], true)) {
            return;
        }

        if ($method === 'GET' && !str_starts_with($uri, 'api/admin/')) {
            return;
        }

        try {
            if ($method === 'POST' && $uri === 'api/login') {
                if ($status !== 200 || !$event->response instanceof JsonResponse) {
                    return;
                }

                $actor = data_get($event->response->getOriginalContent(), 'data.user');
            } else {
                $actor = $event->request->user();
            }

            if (!$actor instanceof User || !in_array($actor->role, ['admin', 'super_admin'], true)) {
                return;
            }

            // Use the route template and numeric record IDs. Request data and headers can contain credentials.
            $ids = [];
            foreach ($route->originalParameters() as $key => $value) {
                if (is_scalar($value) && ctype_digit((string) $value) && strlen((string) $value) <= 20) {
                    $ids[] = $key.'='.$value;
                }
            }

            DB::table('administrator_request_events')->insert([
                'actor_user_id' => $actor->id,
                'actor_name' => $actor->name,
                'actor_role' => $actor->role,
                'method' => $method,
                'route' => $uri,
                'target_ids' => $ids ? substr(implode(', ', $ids), 0, 255) : null,
                'response_status' => $status,
                'created_at' => now(),
            ]);
        } catch (Throwable $exception) {
            // The action has already completed. Report audit storage failures without changing its response.
            report($exception);
        }
    }
}
