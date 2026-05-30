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

    public function __invoke(Request $request, string $id): JsonResponse
    {
        // Identity always rides the verified envelope — never the session — so
        // both the read and write paths are self-contained and correct under
        // any route_middleware value, including []. A missing or invalid token
        // is rejected before the store is touched: same 403 for the
        // authenticated and guest branches, and no existence oracle.
        $token = $request->query('signed_context');
        if (! is_string($token) || $token === '') {
            throw new HttpException(403, 'Forbidden');
        }

        try {
            $verified = $this->envelope->verify($token);
        } catch (InvalidEnvelopeException) {
            throw new HttpException(403, 'Forbidden');
        }

        $conversation = $this->store->findByUuidWithMessages($id);

        if ($conversation === null) {
            throw new HttpException(404, 'Conversation not found');
        }

        $guestToken = $request->cookie('chatbot_guest_id');
        $userId = $verified->userId;

        $authorized = match (true) {
            $conversation->userId !== null => $userId !== null && (int) $userId === $conversation->userId,
            $conversation->guestToken !== null => is_string($guestToken) && $guestToken === $conversation->guestToken,
            default => false,
        };

        if (! $authorized) {
            throw new HttpException(403, 'Forbidden');
        }

        $greeting = $verified->greeting;

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
