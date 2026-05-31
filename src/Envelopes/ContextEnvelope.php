<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Envelopes;

use Aanfarhan\Chatbot\Exceptions\ExpiredEnvelopeException;
use Aanfarhan\Chatbot\Exceptions\MismatchedEnvelopeException;
use Aanfarhan\Chatbot\Exceptions\TamperedEnvelopeException;
use DateTimeInterface;
use Illuminate\Contracts\Config\Repository;

final class ContextEnvelope
{
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
        $envelope = new Envelope(
            payload: $payload,
            userId: $userId,
            route: $route,
            channel: $channel,
            expiresAt: (new \DateTimeImmutable)->setTimestamp($expiresAt->getTimestamp()),
            version: Envelope::VERSION,
            greeting: $greeting,
            prompt: $prompt,
            summary: $summary,
            allowedTools: $allowedTools,
            allowedExtractors: $allowedExtractors,
            extractorTimeoutMs: $extractorTimeoutMs,
            extractorSizeCapBytes: $extractorSizeCapBytes,
        );

        $encoded = $this->base64UrlEncode(
            (string) json_encode($envelope->toBody(), JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
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
        if (! is_array($body)) {
            throw new TamperedEnvelopeException('envelope payload malformed');
        }

        $envelope = Envelope::fromBody($body);

        if ($envelope->version !== Envelope::VERSION) {
            throw new MismatchedEnvelopeException('envelope version mismatch');
        }

        if ($envelope->expiresAt->getTimestamp() < time()) {
            throw new ExpiredEnvelopeException('envelope expired');
        }

        if (array_key_exists('userId', $expected) && $expected['userId'] !== $envelope->userId) {
            throw new MismatchedEnvelopeException('envelope user mismatch');
        }
        if (array_key_exists('route', $expected) && $expected['route'] !== $envelope->route) {
            throw new MismatchedEnvelopeException('envelope route mismatch');
        }
        if (array_key_exists('channel', $expected) && $expected['channel'] !== $envelope->channel) {
            throw new MismatchedEnvelopeException('envelope channel mismatch');
        }

        return $envelope;
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
