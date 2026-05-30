<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * @internal Test sentinel: rejects with 499 unless the request carries an
 * `X-Sentinel-Pass` header. Stands in for a real gate (e.g. VerifyCsrfToken)
 * to prove the configured route_middleware group actually executes on a route.
 */
final class SentinelMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->header('X-Sentinel-Pass') !== 'yes') {
            return new Response('blocked by sentinel', 499);
        }

        return $next($request);
    }
}
