<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Testing\Fixtures;

use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Exceptions\ChatbotContentBlockedException;
use Aanfarhan\Chatbot\Exceptions\ChatbotException;
use Aanfarhan\Chatbot\Exceptions\ChatbotProviderException;
use Aanfarhan\Chatbot\Exceptions\ChatbotQuotaExceededException;
use Aanfarhan\Chatbot\Exceptions\ChatbotTokenCapExceededException;
use Aanfarhan\Chatbot\Responses\ChatResponse;
use Aanfarhan\Chatbot\Responses\StreamChunk;

/**
 * Deterministic LLM client for the Playwright e2e fixture.
 *
 * - When the provider sent the `lookup_order` tool def and the conversation has
 *   no tool-result yet, this emits a tool call for `lookup_order`.
 * - When the conversation already contains a tool result, it streams a final
 *   text answer.
 * - Otherwise (the demo channel, no tools), it streams the canned demo chunks
 *   so the existing /chatbot/demo spec keeps working with the same binding.
 */
final class PlaywrightFixtureClient implements LLMClient
{
    public function chat(array $messages, array $tools = [], ?string $model = null): ChatResponse
    {
        return new ChatResponse('Order ORD-1042 has been shipped. ETA: 2 days.');
    }

    public function stream(array $messages, array $tools = [], ?string $model = null): iterable
    {
        // Deterministic error injection: a user message of `force-error:<code>`
        // makes the turn throw the matching ChatbotException, so e2e can drive
        // every error-rendering branch. Gated implicitly — this client only
        // binds when CHATBOT_PLAYWRIGHT_FIXTURE=1.
        if (($error = $this->injectedError($messages)) !== null) {
            throw $error;
        }

        // `fail-tool` drives the failing-tool branch: emit a call to the tool
        // whose handler throws, so the loop produces `tool_started` →
        // `tool_failed`, then stream a final answer on the follow-up round.
        if ($this->lastUserMessage($messages) === 'fail-tool' && $this->offersTool($tools, 'failing_tool')) {
            if ($this->hasToolResult($messages)) {
                yield from $this->finalTextChunks();

                return;
            }

            yield new StreamChunk('', toolCalls: [[
                'id' => 'call_fail_1',
                'name' => 'failing_tool',
                'arguments' => '{}',
            ]]);

            return;
        }

        if ($this->offersTool($tools, 'lookup_order')) {
            if ($this->hasToolResult($messages)) {
                yield from $this->finalTextChunks();

                return;
            }

            yield new StreamChunk('', toolCalls: [[
                'id' => 'call_lookup_1',
                'name' => 'lookup_order',
                'arguments' => json_encode(['order_id' => 'ORD-1042'], JSON_THROW_ON_ERROR),
            ]]);

            return;
        }

        yield from $this->demoChunks();
    }

    /**
     * @param  list<array<string, mixed>>  $messages
     */
    private function injectedError(array $messages): ?ChatbotException
    {
        return match ($this->lastUserMessage($messages)) {
            'force-error:quota_exceeded' => new ChatbotQuotaExceededException('You have reached your daily message limit.'),
            'force-error:token_cap_exceeded' => new ChatbotTokenCapExceededException('This conversation has reached its token cap.'),
            'force-error:content_blocked' => new ChatbotContentBlockedException('This message was blocked by content policy.'),
            'force-error:retryable' => new ChatbotProviderException('The model is temporarily unavailable.', retryable: true),
            default => null,
        };
    }

    /**
     * @param  list<array<string, mixed>>  $messages
     */
    private function lastUserMessage(array $messages): ?string
    {
        foreach (array_reverse($messages) as $msg) {
            if (($msg['role'] ?? null) === 'user') {
                $content = $msg['content'] ?? null;

                return is_string($content) ? $content : null;
            }
        }

        return null;
    }

    /**
     * @param  list<array<string, mixed>>  $tools
     */
    private function offersTool(array $tools, string $name): bool
    {
        foreach ($tools as $tool) {
            $fn = is_array($tool['function'] ?? null) ? $tool['function'] : [];
            if (($fn['name'] ?? null) === $name) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  list<array<string, mixed>>  $messages
     */
    private function hasToolResult(array $messages): bool
    {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? null) === 'tool') {
                return true;
            }
        }

        return false;
    }

    /** @return iterable<StreamChunk> */
    private function finalTextChunks(): iterable
    {
        yield new StreamChunk('Order ORD-1042 ');
        yield new StreamChunk('has shipped ');
        yield new StreamChunk('and arrives in 2 days.');
    }

    /** @return iterable<StreamChunk> */
    private function demoChunks(): iterable
    {
        yield new StreamChunk('Sure! ');
        yield new StreamChunk('Order #ORD-1042 ');
        yield new StreamChunk('has been shipped ');
        yield new StreamChunk('and should arrive ');
        yield new StreamChunk('within 2–3 business days.');
    }
}
