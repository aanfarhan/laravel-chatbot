<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Streaming;

use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Exceptions\ChatbotException;
use Aanfarhan\Chatbot\Exceptions\ChatbotTimeoutException;
use Aanfarhan\Chatbot\Responses\StreamChunk;
use Aanfarhan\Chatbot\Support\Clock;
use Aanfarhan\Chatbot\Tools\ToolInvoker;
use Illuminate\Contracts\Auth\Authenticatable;

final class TurnStreamer
{
    private readonly Clock $clock;

    public function __construct(
        private readonly LLMClient $llm,
        private readonly StreamEmitter $emitter,
        private readonly ?ToolInvoker $toolInvoker = null,
        ?Clock $clock = null,
    ) {
        $this->clock = $clock ?? new Clock;
    }

    /**
     * @param  list<array<string, mixed>>  $messages
     * @param  list<array<string, mixed>>  $toolDefs
     * @param  list<string>|null  $allowedTools
     */
    public function run(
        array $messages,
        array $toolDefs,
        int $maxCalls,
        int $streamDuration,
        float $startedAt,
        callable $isAborted,
        ?string $model,
        string $channel,
        int $conversationId,
        ?Authenticatable $actor,
        ?array $allowedTools,
    ): TurnResult {
        $assembled = '';
        $usage = null;
        $callsThisTurn = 0;
        $toolTimeSpent = 0.0;
        $loopMessages = $messages;

        try {
            while (true) {
                if (($this->clock->now() - $startedAt - $toolTimeSpent) >= $streamDuration) {
                    throw new ChatbotTimeoutException('stream duration exceeded');
                }

                $iterToolCalls = [];
                $iterText = '';

                foreach ($this->llm->stream($loopMessages, tools: $toolDefs, model: $model) as $chunk) {
                    if ($isAborted()) {
                        return new TurnResult($assembled, $usage, TurnOutcome::Aborted, null);
                    }

                    if (($this->clock->now() - $startedAt - $toolTimeSpent) >= $streamDuration) {
                        throw new ChatbotTimeoutException('stream duration exceeded');
                    }

                    /** @var StreamChunk $chunk */
                    if ($chunk->toolCalls !== []) {
                        foreach ($chunk->toolCalls as $tc) {
                            $iterToolCalls[] = $tc;
                        }
                    }

                    if ($chunk->content !== '') {
                        $iterText .= $chunk->content;
                        $assembled .= $chunk->content;
                        $this->emitter->token($chunk->content);
                    }

                    if ($chunk->usage !== null) {
                        $usage = $chunk->usage;
                    }
                }

                if ($iterToolCalls === []) {
                    break;
                }

                $loopMessages[] = $this->assembleTurnMessages($iterToolCalls, $iterText);

                foreach ($iterToolCalls as $tc) {
                    if ($callsThisTurn >= $maxCalls) {
                        $loopMessages[] = [
                            'role' => 'tool',
                            'tool_call_id' => $tc['id'],
                            'name' => $tc['name'],
                            'content' => '[budget exhausted — tool call limit reached for this turn]',
                        ];

                        continue;
                    }

                    if ($this->toolInvoker === null) {
                        $loopMessages[] = ['role' => 'tool', 'tool_call_id' => $tc['id'], 'name' => $tc['name'], 'content' => '[error: no tool handler configured]'];

                        continue;
                    }

                    $invokeResult = $this->toolInvoker->invoke(
                        name: $tc['name'],
                        argumentsJson: $tc['arguments'],
                        callId: $tc['id'],
                        channel: $channel,
                        conversationId: $conversationId,
                        actor: $actor,
                        allowedTools: $allowedTools,
                    );
                    $loopMessages[] = $invokeResult->message;
                    $toolTimeSpent += $invokeResult->elapsedSeconds;
                    $callsThisTurn++;
                }

                if ($callsThisTurn >= $maxCalls) {
                    $toolDefs = [];
                }
            }
        } catch (ChatbotException $e) {
            return new TurnResult($assembled, $usage, TurnOutcome::Failed, $e);
        }

        return new TurnResult($assembled, $usage, TurnOutcome::Completed, null);
    }

    /**
     * @param  list<array<string, mixed>>  $iterToolCalls
     * @return array<string, mixed>
     */
    private function assembleTurnMessages(array $iterToolCalls, string $iterText): array
    {
        $msg = ['role' => 'assistant', 'content' => $iterText !== '' ? $iterText : null];
        $msg['tool_calls'] = array_map(
            fn (array $tc): array => [
                'id' => $tc['id'],
                'type' => 'function',
                'function' => ['name' => $tc['name'], 'arguments' => $tc['arguments']],
            ],
            $iterToolCalls,
        );

        return $msg;
    }
}
