<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Http\Controllers;

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Exceptions\InvalidEnvelopeException;
use Aanfarhan\Chatbot\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class HistoryController
{
    public function __construct(
        private readonly ConversationStore $store,
        private readonly ContextEnvelope $envelope,
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

    public function __invoke(Request $request, int $id): JsonResponse
    {
        $conversation = Conversation::with('messages')->find($id);

        if (! $conversation) {
            throw new HttpException(404, 'Conversation not found');
        }

        $guestToken = $request->cookie('chatbot_guest_id');
        $userId = $request->user()?->getAuthIdentifier();

        $authorized = match (true) {
            $conversation->user_id !== null => $userId !== null && (int) $userId === $conversation->user_id,
            $conversation->guest_token !== null => $guestToken !== null && $guestToken === $conversation->guest_token,
            default => false,
        };

        if (! $authorized) {
            throw new HttpException(403, 'Forbidden');
        }

        $greeting = $this->resolveGreeting($request);

        $persisted = $conversation->messages->map(fn ($m) => [
            'role' => $m->role,
            'content' => $m->content,
            'route_name' => $m->route_name,
            'context_hash' => $m->context_hash,
            'created_at' => $m->created_at->toIso8601String(),
        ])->values()->all();

        $messages = $greeting !== null
            ? array_merge([['role' => 'assistant', 'content' => $greeting]], $persisted)
            : $persisted;

        return new JsonResponse(['messages' => $messages]);
    }
}
