<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Http\Controllers;

use Aanfarhan\Chatbot\Chatbot;
use Aanfarhan\Chatbot\Config\ChannelSettings;
use Aanfarhan\Chatbot\Config\Defaults;
use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Exceptions\ChatbotQuotaExceededException;
use Aanfarhan\Chatbot\Exceptions\InvalidEnvelopeException;
use Aanfarhan\Chatbot\Exceptions\InvalidExtractorPayloadException;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\TurnIntake;
use Illuminate\Cache\RateLimiter;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class MessagesController
{
    public function __construct(
        private readonly ContextEnvelope $envelope,
        private readonly Chatbot $chatbot,
        private readonly RateLimiter $rateLimiter,
        private readonly StreamCoordinator $coordinator,
        private readonly Repository $config,
        private readonly ChannelSettings $channelSettings,
        private readonly TurnIntake $turnIntake,
    ) {}

    public function __invoke(Request $request): Response
    {
        if (! $this->chatbot->resolveAuthorize($request)) {
            throw new HttpException(403, 'Forbidden');
        }

        $token = $request->input('signed_context');
        if (! is_string($token) || $token === '') {
            throw new HttpException(422, 'signed_context is required');
        }

        try {
            $verified = $this->envelope->verify($token);
        } catch (InvalidEnvelopeException $e) {
            throw new HttpException(403, 'invalid signed_context: '.$e->getMessage(), $e);
        }

        $throttleResponse = $this->checkThrottle($request, $verified->channel);
        if ($throttleResponse !== null) {
            return $throttleResponse;
        }

        $ttl = $this->config->integer('chatbot.conversation_ttl', Defaults::CONVERSATION_TTL);

        $message = $request->string('message')->toString();

        $rawExtractorBlocks = $request->input('extractor_blocks', []);
        $extractorBlocks = is_array($rawExtractorBlocks) ? array_values($rawExtractorBlocks) : [];

        $guestCookie = $request->cookie('chatbot_guest_id');
        $guestCookie = is_string($guestCookie) && $guestCookie !== '' ? $guestCookie : null;

        $conversationCookieName = 'chatbot_conversation_'.$verified->channel;
        $conversationCookie = $request->cookie($conversationCookieName);
        $conversationCookie = is_string($conversationCookie) && $conversationCookie !== '' ? $conversationCookie : null;

        try {
            $prepared = $this->turnIntake->prepare(
                verified: $verified,
                message: $message,
                extractorBlocks: $extractorBlocks,
                guestCookie: $guestCookie,
                conversationCookie: $conversationCookie,
                ttl: $ttl,
            );
        } catch (InvalidExtractorPayloadException $e) {
            return new JsonResponse(['error' => $e->getMessage()], 422);
        }

        $quotaPreflight = function () use ($request): void {
            $quota = $this->chatbot->resolveQuota($request);
            if (! $quota['allow']) {
                throw new ChatbotQuotaExceededException($quota['reason'] ?: 'Quota exceeded');
            }
        };

        $minuteTtl = (int) ceil($ttl / 60);

        $streamed = $this->coordinator->handle(
            messages: $prepared->messages,
            conversationId: $prepared->conversation->id,
            conversationUuid: $prepared->conversation->uuid,
            routeName: $verified->route,
            contextHash: $prepared->contextHash,
            model: $prepared->model,
            preflight: $quotaPreflight,
            contextSummary: $verified->summary,
            channel: $verified->channel,
            allowedTools: $verified->allowedTools,
            actor: $prepared->actor,
        );

        $streamed->headers->set('Content-Type', 'text/event-stream; charset=UTF-8');
        $streamed->headers->set('Cache-Control', 'no-cache');
        $streamed->headers->set('X-Accel-Buffering', 'no');
        $streamed->headers->setCookie(
            cookie($conversationCookieName, $prepared->conversation->uuid, $minuteTtl, '/chatbot'),
        );

        if ($prepared->guestToken !== null) {
            $streamed->headers->setCookie(
                cookie('chatbot_guest_id', $prepared->guestToken, 60 * 24 * 365, '/chatbot', null, false, true),
            );
        }

        return $streamed;
    }

    private function checkThrottle(Request $request, string $channel): ?JsonResponse
    {
        $perMinute = $this->channelSettings->throttlePerMinute($channel);
        $perDay = $this->channelSettings->throttlePerDay($channel);

        $ip = $request->ip() ?? 'unknown';
        $base = "chatbot:{$channel}:{$ip}";

        if ($this->rateLimiter->tooManyAttempts("{$base}:minute", $perMinute)) {
            return new JsonResponse(
                ['retry_after' => $this->rateLimiter->availableIn("{$base}:minute")],
                429,
            );
        }

        if ($this->rateLimiter->tooManyAttempts("{$base}:day", $perDay)) {
            return new JsonResponse(
                ['retry_after' => $this->rateLimiter->availableIn("{$base}:day")],
                429,
            );
        }

        $this->rateLimiter->hit("{$base}:minute", 60);
        $this->rateLimiter->hit("{$base}:day", 86400);

        return null;
    }
}
