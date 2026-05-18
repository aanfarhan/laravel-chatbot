<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Envelopes;

use Aanfarhan\Chatbot\Exceptions\ExpiredEnvelopeException;
use Aanfarhan\Chatbot\Exceptions\MismatchedEnvelopeException;
use Aanfarhan\Chatbot\Exceptions\TamperedEnvelopeException;
use DateTimeImmutable;
use DateTimeInterface;
use Illuminate\Contracts\Config\Repository;

final class ContextEnvelope
{
    public const VERSION = 1;

    public function __construct(
        private readonly Repository $config,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     * @param  list<string>  $allowedTools
     * @param  list<string>  $allowedExtractors
     */
    public function mint(
        array $payload,
        ?string $userId,
        string $route,
        string $channel,
        DateTimeInterface $expiresAt,
        ?string $greeting = null,
        ?string $prompt = null,
        ?string $summary = null,
        array $allowedTools = [],
        array $allowedExtractors = [],
        ?int $extractorTimeoutMs = null,
        ?int $extractorSizeCapBytes = null,
    ): string {
        $body = [
            'v' => self::VERSION,
            'u' => $userId,
            'r' => $route,
            'c' => $channel,
            'e' => $expiresAt->getTimestamp(),
            'p' => $payload,
        ];

        if ($greeting !== null) {
            $body['g'] = $greeting;
        }
        if ($prompt !== null) {
            $body['pr'] = $prompt;
        }
        if ($summary !== null) {
            $body['s'] = $summary;
        }
        if ($allowedTools !== []) {
            $body['t'] = $allowedTools;
        }
        if ($allowedExtractors !== []) {
            $body['x'] = $allowedExtractors;
        }
        if ($extractorTimeoutMs !== null) {
            $body['xt'] = $extractorTimeoutMs;
        }
        if ($extractorSizeCapBytes !== null) {
            $body['xc'] = $extractorSizeCapBytes;
        }

        $encoded = $this->base64UrlEncode(
            (string) json_encode($body, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
        );
        $signature = $this->base64UrlEncode($this->sign($encoded));

        return $encoded.'.'.$signature;
    }

    /**
     * @param  array{userId?: string|null, route?: string, channel?: string}  $expected
     */
    public function verify(string $token, array $expected = []): Envelope
    {
        $parts = explode('.', $token, 3);
        if (count($parts) !== 2) {
            throw new TamperedEnvelopeException('malformed envelope token');
        }

        [$encoded, $signature] = $parts;

        $decodedSignature = $this->base64UrlDecode($signature);
        $expectedSignature = $this->sign($encoded);

        if (! hash_equals($expectedSignature, $decodedSignature)) {
            throw new TamperedEnvelopeException('envelope signature mismatch');
        }

        $json = $this->base64UrlDecode($encoded);
        /** @var mixed $body */
        $body = json_decode($json, true);
        if (! is_array($body)
            || ! isset($body['v'], $body['r'], $body['c'], $body['e'], $body['p'])
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

        if ($body['v'] !== self::VERSION) {
            throw new MismatchedEnvelopeException('envelope version mismatch');
        }

        if ($body['e'] < time()) {
            throw new ExpiredEnvelopeException('envelope expired');
        }

        if (array_key_exists('userId', $expected) && $expected['userId'] !== $body['u']) {
            throw new MismatchedEnvelopeException('envelope user mismatch');
        }
        if (array_key_exists('route', $expected) && $expected['route'] !== $body['r']) {
            throw new MismatchedEnvelopeException('envelope route mismatch');
        }
        if (array_key_exists('channel', $expected) && $expected['channel'] !== $body['c']) {
            throw new MismatchedEnvelopeException('envelope channel mismatch');
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

        return new Envelope(
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

    private function sign(string $encoded): string
    {
        return hash_hmac('sha256', $encoded, $this->key(), true);
    }

    private function key(): string
    {
        $key = $this->config->string('app.key');
        if (str_starts_with($key, 'base64:')) {
            $decoded = base64_decode(substr($key, 7), true);
            if ($decoded === false) {
                throw new \RuntimeException('chatbot: app.key has an invalid base64: encoding');
            }

            return $decoded;
        }

        return $key;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }

    private function base64UrlDecode(string $value): string
    {
        $decoded = base64_decode(strtr($value, '-_', '+/'), true);
        if ($decoded === false) {
            throw new TamperedEnvelopeException('envelope base64 decode failed');
        }

        return $decoded;
    }
}
