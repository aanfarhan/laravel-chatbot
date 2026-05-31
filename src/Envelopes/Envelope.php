<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Envelopes;

use Aanfarhan\Chatbot\Exceptions\TamperedEnvelopeException;
use DateTimeImmutable;

final readonly class Envelope
{
    public const VERSION = 1;

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>  $allowedTools
     * @param  list<string>  $allowedExtractors
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
        public array $allowedTools = [],
        public array $allowedExtractors = [],
        public ?int $extractorTimeoutMs = null,
        public ?int $extractorSizeCapBytes = null,
    ) {}

    /** @return array<string, mixed> */
    public function toBody(): array
    {
        $body = [
            'v' => self::VERSION,
            'u' => $this->userId,
            'r' => $this->route,
            'c' => $this->channel,
            'e' => $this->expiresAt->getTimestamp(),
            'p' => $this->payload,
        ];

        if ($this->greeting !== null) {
            $body['g'] = $this->greeting;
        }
        if ($this->prompt !== null) {
            $body['pr'] = $this->prompt;
        }
        if ($this->summary !== null) {
            $body['s'] = $this->summary;
        }
        if ($this->allowedTools !== []) {
            $body['t'] = $this->allowedTools;
        }
        if ($this->allowedExtractors !== []) {
            $body['x'] = $this->allowedExtractors;
        }
        if ($this->extractorTimeoutMs !== null) {
            $body['xt'] = $this->extractorTimeoutMs;
        }
        if ($this->extractorSizeCapBytes !== null) {
            $body['xc'] = $this->extractorSizeCapBytes;
        }

        return $body;
    }

    /** @param array<mixed, mixed> $body */
    public static function fromBody(array $body): self
    {
        if (! isset($body['v'], $body['r'], $body['c'], $body['e'], $body['p'])
            || ! array_key_exists('u', $body)
            || ! is_int($body['v'])
            || ! is_string($body['r'])
            || ! is_string($body['c'])
            || ! is_int($body['e'])
            || ! is_array($body['p'])
            || ! (is_string($body['u']) || is_null($body['u']))
        ) {
            throw new TamperedEnvelopeException('envelope payload malformed');
        }

        /** @var array<string, mixed> $payload */
        $payload = $body['p'];

        $greeting = isset($body['g']) && is_string($body['g']) ? $body['g'] : null;
        $prompt = isset($body['pr']) && is_string($body['pr']) ? $body['pr'] : null;
        $summary = isset($body['s']) && is_string($body['s']) ? $body['s'] : null;

        $rawTools = isset($body['t']) && is_array($body['t']) ? $body['t'] : [];
        /** @var list<string> $allowedTools */
        $allowedTools = array_values(array_filter($rawTools, 'is_string'));

        $rawExtractors = isset($body['x']) && is_array($body['x']) ? $body['x'] : [];
        /** @var list<string> $allowedExtractors */
        $allowedExtractors = array_values(array_filter($rawExtractors, 'is_string'));

        $extractorTimeoutMs = isset($body['xt']) && is_int($body['xt']) ? $body['xt'] : null;
        $extractorSizeCapBytes = isset($body['xc']) && is_int($body['xc']) ? $body['xc'] : null;

        return new self(
            payload: $payload,
            userId: $body['u'],
            route: $body['r'],
            channel: $body['c'],
            expiresAt: (new DateTimeImmutable)->setTimestamp($body['e']),
            version: $body['v'],
            greeting: $greeting,
            prompt: $prompt,
            summary: $summary,
            allowedTools: $allowedTools,
            allowedExtractors: $allowedExtractors,
            extractorTimeoutMs: $extractorTimeoutMs,
            extractorSizeCapBytes: $extractorSizeCapBytes,
        );
    }
}
