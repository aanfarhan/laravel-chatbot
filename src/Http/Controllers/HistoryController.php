<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Http\Controllers;

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Exceptions\InvalidEnvelopeException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class HistoryController
{
    public function __construct(
        private readonly ContextEnvelope $envelope,
        private readonly ConversationStore $store,
    ) {}

    private function resolveGreeting(Request $request): ?string
    {
        $token = $request->query('signed_context');
        if (! is_string($token) || $token === '') {
            return null;
        }

        try {
            return $this->envelope->verify($token)->greeting;
        } catch (InvalidEnvelopeException) {
            return null;
        }
    }

    public function __invoke(Request $request, string $id): JsonResponse
    {
        $conversation = $this->store->findByUuidWithMessages($id);

        if ($conversation === null) {
            throw new HttpException(404, 'Conversation not found');
        }

        $guestToken = $request->cookie('chatbot_guest_id');
        $rawAuthId = $request->user()?->getAuthIdentifier();
        $userId = is_int($rawAuthId) ? $rawAuthId : (is_string($rawAuthId) && is_numeric($rawAuthId) ? (int) $rawAuthId : null);

        $authorized = match (true) {
            $conversation->userId !== null => $userId !== null && $userId === $conversation->userId,
            $conversation->guestToken !== null => $guestToken !== null && is_string($guestToken) && $guestToken === $conversation->guestToken,
            default => false,
        };

        if (! $authorized) {
            throw new HttpException(403, 'Forbidden');
        }

        $greeting = $this->resolveGreeting($request);

        $persisted = array_map(fn ($m): array => [
            'role' => $m->role,
            'content' => $m->content,
            'route_name' => $m->routeName,
            'context_hash' => $m->contextHash,
            'created_at' => $m->createdAt->format('c'),
        ], $conversation->messages);

        $messages = $greeting !== null
            ? array_merge([['role' => 'assistant', 'content' => $greeting]], $persisted)
            : $persisted;

        return new JsonResponse(['messages' => $messages]);
    }
}
