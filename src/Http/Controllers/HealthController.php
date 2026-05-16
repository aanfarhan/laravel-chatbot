<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Http\Controllers;

use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\JsonResponse;

final class HealthController
{
    public const VERSION = '1.0.0';

    private const CACHE_COUNTER_KEY = 'chatbot.active_streams';

    public function __construct(
        private readonly ?CacheRepository $cache = null,
    ) {}

    public function __invoke(): JsonResponse
    {
        $activeStreams = 0;

        try {
            $raw = $this->cache?->get(self::CACHE_COUNTER_KEY) ?? 0;
            $activeStreams = is_int($raw) ? $raw : 0;
        } catch (\Throwable) {
        }

        return new JsonResponse([
            'version' => self::VERSION,
            'active_streams' => $activeStreams,
            'status' => 'ok',
        ]);
    }
}
