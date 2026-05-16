<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Http\Controllers;

use Aanfarhan\Chatbot\Chatbot;
use Aanfarhan\Chatbot\ContextSanitizer;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Exceptions\ChatbotQuotaExceededException;
use Aanfarhan\Chatbot\Exceptions\InvalidEnvelopeException;
use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Aanfarhan\Chatbot\PromptAssembler;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Illuminate\Cache\RateLimiter;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class MessagesController
{
    public function __construct(
        private readonly LLMClient $llm,
        private readonly ContextEnvelope $envelope,
        private readonly PromptAssembler $assembler,
        private readonly ContextSanitizer $sanitizer,
        private readonly Repository $config,
        private readonly ConversationStore $store,
        private readonly Dispatcher $events,
        private readonly Chatbot $chatbot,
        private readonly RateLimiter $rateLimiter,
        private readonly ?LoggerInterface $logger = null,
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

        $rawTtl = $this->config->get('chatbot.conversation_ttl', 86400);
        $ttl = is_int($rawTtl) ? $rawTtl : 86400;

        $guestToken = null;
        if ($verified->userId === null) {
            $rawToken = $request->cookie('chatbot_guest_id');
            $guestToken = is_string($rawToken) && $rawToken !== '' ? $rawToken : Str::random(40);
        }

        $conversation = $this->resolveConversation($request, $verified->channel, $ttl, $verified->userId, $guestToken);

        $message = $request->string('message')->toString();

        /** @var array<string, mixed> $channelConfig */
        $channelConfig = (array) $this->config->get('chatbot.channels.'.$verified->channel, []);

        $model = isset($channelConfig['model']) && is_string($channelConfig['model'])
            ? $channelConfig['model']
            : null;

        $sanitizedPayload = $this->sanitizer->sanitize($verified->payload);
        $contextHash = hash('sha256', (string) json_encode($sanitizedPayload));

        $routeOverrides = $verified->prompt !== null ? ['prompt' => $verified->prompt] : [];

        $messages = $this->assembler->assemble(
            channelConfig: $channelConfig,
            routeOverrides: $routeOverrides,
            contextPayload: $sanitizedPayload,
            history: [],
            userMessage: $message,
        );

        $this->store->append(
            conversationId: $conversation->id,
            role: 'user',
            content: $message,
            routeName: $verified->route,
            contextHash: $contextHash,
        );

        $coordinator = new StreamCoordinator($this->llm, $this->store, $this->config, events: $this->events, logger: $this->logger, toolRegistry: app(ToolRegistry::class));

        $quotaPreflight = function () use ($request): void {
            $quota = $this->chatbot->resolveQuota($request);
            if (! $quota['allow']) {
                throw new ChatbotQuotaExceededException($quota['reason'] ?: 'Quota exceeded');
            }
        };

        $cookieName = 'chatbot_conversation_'.$verified->channel;
        $minuteTtl = (int) ceil($ttl / 60);

        $streamed = $coordinator->handle(
            messages: $messages,
            conversationId: $conversation->id,
            routeName: $verified->route,
            contextHash: $contextHash,
            model: $model,
            preflight: $quotaPreflight,
            contextSummary: $verified->summary,
            channel: $verified->channel,
            allowedTools: $verified->allowedTools,
        );

        $streamed->headers->set('Content-Type', 'text/event-stream; charset=UTF-8');
        $streamed->headers->set('Cache-Control', 'no-cache');
        $streamed->headers->set('X-Accel-Buffering', 'no');
        $streamed->headers->setCookie(cookie($cookieName, (string) $conversation->id, $minuteTtl, '/chatbot'));

        if ($guestToken !== null) {
            $streamed->headers->setCookie(
                cookie('chatbot_guest_id', $guestToken, 60 * 24 * 365, '/chatbot', null, false, true),
            );
        }

        return $streamed;
    }

    private function checkThrottle(Request $request, string $channel): ?JsonResponse
    {
        /** @var array<string, mixed> $channelThrottle */
        $channelThrottle = (array) $this->config->get("chatbot.channels.{$channel}.throttle", []);

        $rawPerMinute = $channelThrottle['per_minute'] ?? $this->config->get('chatbot.throttle.per_minute', 20);
        $perMinute = is_int($rawPerMinute) ? $rawPerMinute : 20;

        $rawPerDay = $channelThrottle['per_day'] ?? $this->config->get('chatbot.throttle.per_day', 200);
        $perDay = is_int($rawPerDay) ? $rawPerDay : 200;

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

    private function resolveConversation(
        Request $request,
        string $channel,
        int $ttl,
        ?string $userId,
        ?string $guestToken,
    ): ConversationRecord {
        $cookieName = 'chatbot_conversation_'.$channel;
        $rawId = $request->cookie($cookieName);
        $conversationId = is_string($rawId) && is_numeric($rawId) ? (int) $rawId : 0;

        if ($conversationId > 0) {
            $existing = $this->store->find($conversationId);
            if ($existing && $this->withinIdleWindow($existing, $ttl)) {
                return $existing;
            }
        }

        return $this->store->start(
            channel: $channel,
            userId: $userId !== null ? (int) $userId : null,
            guestToken: $guestToken,
        );
    }

    private function withinIdleWindow(ConversationRecord $conversation, int $ttl): bool
    {
        if ($conversation->lastMessageAt === null) {
            return true;
        }

        return $conversation->lastMessageAt >= now()->subSeconds($ttl);
    }
}
