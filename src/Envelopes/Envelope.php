<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Envelopes;

use DateTimeImmutable;

final readonly class Envelope
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public array $payload,
        public ?string $userId,
        public string $route,
        public string $channel,
        public DateTimeImmutable $expiresAt,
        public int $version,
        public ?string $greeting = null,
        public ?string $prompt = null,
        public ?string $summary = null,
    ) {}
}
