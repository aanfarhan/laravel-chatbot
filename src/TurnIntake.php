<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Aanfarhan\Chatbot\Config\ChannelSettings;
use Aanfarhan\Chatbot\Config\Defaults;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Envelopes\Envelope;
use Aanfarhan\Chatbot\Exceptions\InvalidExtractorPayloadException;
use Aanfarhan\Chatbot\Extractors\ClientExtractorPayload;
use Aanfarhan\Chatbot\Extractors\ClientExtractorRegistry;
use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Support\Str;

final class TurnIntake
{
    public function __construct(
        private readonly PromptAssembler $assembler,
        private readonly ContextSanitizer $sanitizer,
        private readonly ConversationStore $store,
        private readonly ConversationReplay $replay,
        private readonly TokenCounter $tokenCounter,
        private readonly ThreadedActorResolver $actorResolver,
        private readonly ClientExtractorRegistry $extractorRegistry,
        private readonly ChannelSettings $channelSettings,
        private readonly Repository $config,
    ) {}

    /**
     * @param  list<mixed>  $extractorBlocks
     */
    public function prepare(
        Envelope $verified,
        string $message,
        array $extractorBlocks,
        ?string $guestCookie,
        ?string $conversationCookie,
        int $ttl,
    ): PreparedTurn {
        $guestToken = null;
        if ($verified->userId === null) {
            $guestToken = ($guestCookie !== null && $guestCookie !== '')
                ? $guestCookie
                : Str::random(40);
        }

        $conversation = $this->resolveConversation(
            channel: $verified->channel,
            ttl: $ttl,
            userId: $verified->userId,
            guestToken: $guestToken,
            conversationCookie: $conversationCookie,
        );

        $payloadNormaliser = $verified->extractorSizeCapBytes !== null
            ? new ClientExtractorPayload(outputSizeCap: $verified->extractorSizeCapBytes)
            : new ClientExtractorPayload;

        try {
            $extractorResults = $payloadNormaliser->normalise(
                $extractorBlocks,
                $verified->allowedExtractors,
                $this->extractorRegistry,
            );
        } catch (\RuntimeException $e) {
            throw new InvalidExtractorPayloadException($e->getMessage(), 0, $e);
        }

        $sanitizedPayload = $this->sanitizer->sanitize($verified->payload);
        $contextHash = hash('sha256', (string) json_encode($sanitizedPayload));

        $routeOverrides = $verified->prompt !== null ? ['prompt' => $verified->prompt] : [];
        $freshness = $this->channelSettings->freshnessWindow($verified->channel);
        $history = $this->replay->historyFor($conversation, $freshness);

        /** @var array<string, mixed> $channelConfig */
        $channelConfig = (array) $this->config->get('chatbot.channels.'.$verified->channel, []);

        $messages = $this->assembler->assemble(
            channelConfig: $channelConfig,
            routeOverrides: $routeOverrides,
            contextPayload: $sanitizedPayload,
            history: $history,
            userMessage: $message,
            allowedExtractors: $verified->allowedExtractors,
            extractorResults: $extractorResults,
        );

        $messages = $this->tokenCounter->prune(
            $messages,
            $this->config->integer('chatbot.token_cap', Defaults::TOKEN_CAP),
        );

        $this->store->append(
            conversationId: $conversation->id,
            role: 'user',
            content: $message,
            routeName: $verified->route,
            contextHash: $contextHash,
        );

        $actor = $this->actorResolver->reconstitute($verified->userId);
        $model = $this->channelSettings->model($verified->channel);

        return new PreparedTurn(
            messages: $messages,
            conversation: $conversation,
            contextHash: $contextHash,
            model: $model,
            actor: $actor,
            guestToken: $guestToken,
        );
    }

    private function resolveConversation(
        string $channel,
        int $ttl,
        ?string $userId,
        ?string $guestToken,
        ?string $conversationCookie,
    ): ConversationRecord {
        if ($conversationCookie !== null && $conversationCookie !== '') {
            $existing = $this->store->findByUuid($conversationCookie);
            if ($existing
                && $this->withinIdleWindow($existing, $ttl)
                && $existing->ownedBy($userId, $guestToken)) {
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
