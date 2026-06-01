<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\PersistableTool;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Contracts\ToolResolver;
use Aanfarhan\Chatbot\Streaming\StreamEmitter;
use Aanfarhan\Chatbot\Support\Clock;
use Aanfarhan\Chatbot\Support\Truncator;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Carbon;

final class ToolInvoker
{
    private readonly ToolArgumentValidator $validator;

    private readonly Clock $clock;

    public function __construct(
        private readonly ToolResolver $resolver,
        private readonly ?ToolInvocationStore $invocationStore,
        private readonly StreamEmitter $emitter,
        private readonly int $defaultTimeout,
        private readonly int $resultSizeCap,
        int $maxArgLength,
        ?Clock $clock = null,
    ) {
        $this->validator = new ToolArgumentValidator($maxArgLength);
        $this->clock = $clock ?? new Clock;
    }

    /**
     * @param  list<string>|null  $allowedTools
     * @return list<array<string, mixed>>
     */
    public function definitions(?array $allowedTools): array
    {
        return $this->resolver->definitions($allowedTools);
    }

    /**
     * @param  list<string>|null  $allowedTools
     */
    public function invoke(
        string $name,
        string $argumentsJson,
        string $callId,
        string $channel,
        int $conversationId,
        ?Authenticatable $actor = null,
        ?array $allowedTools = null,
    ): ToolInvocationResult {
        $invokeStart = $this->clock->now();
        $startedAt = Carbon::now();

        if ($allowedTools !== null && ! in_array($name, $allowedTools, true)) {
            return $this->reject(
                callId: $callId, name: $name,
                content: "[error: tool '{$name}' is not permitted on this channel]",
                invokeStart: $invokeStart, startedAt: $startedAt,
                conversationId: $conversationId, args: [],
                status: InvocationStatus::RejectedAllowlist, error: null, emitFailed: false,
            );
        }

        $tool = $this->resolver->resolve($name);

        if ($tool === null) {
            return $this->reject(
                callId: $callId, name: $name,
                content: "[error: tool '{$name}' not found in registry]",
                invokeStart: $invokeStart, startedAt: $startedAt,
                conversationId: $conversationId, args: [],
                status: InvocationStatus::RejectedNotFound, error: null, emitFailed: false,
            );
        }

        $decoded = json_decode($argumentsJson, true);
        /** @var array<string, mixed> $args */
        $args = is_array($decoded) ? $decoded : [];

        if (! $this->validator->validate($tool->parameters(), $args)) {
            $content = 'arguments did not match schema';

            return $this->reject(
                callId: $callId, name: $name, content: $content,
                invokeStart: $invokeStart, startedAt: $startedAt,
                conversationId: $conversationId, args: $args,
                status: InvocationStatus::RejectedSchema, error: $content, emitFailed: true,
                persistResult: '',
            );
        }

        $invocation = new ToolInvocation(args: $args, channel: $channel, context: []);

        $this->emitter->toolStarted($name);

        try {
            if (! $tool->authorize($actor, $invocation)) {
                return $this->reject(
                    callId: $callId, name: $name,
                    content: "[error: not authorized to call tool '{$name}']",
                    invokeStart: $invokeStart, startedAt: $startedAt,
                    conversationId: $conversationId, args: $args,
                    status: InvocationStatus::RejectedUnauthorized, error: 'not authorized', emitFailed: true,
                );
            }

            $deadline = $this->clock->now() + $this->defaultTimeout;
            $raw = $tool->handle($actor, $invocation);
            $overran = $this->clock->now() > $deadline;

            $encoded = is_array($raw) ? json_encode($raw, JSON_THROW_ON_ERROR) : (string) $raw;
            $encoded = Truncator::toByteCap($encoded, $this->resultSizeCap);

            $this->emitter->toolFinished($name);
            $this->persistSuccess($tool, $invocation, $conversationId, $name, $args, $raw, $encoded, $startedAt, $overran);

            return new ToolInvocationResult(
                message: $this->message($callId, $name, $encoded),
                elapsedSeconds: $this->clock->now() - $invokeStart,
                status: InvocationStatus::Ok,
            );
        } catch (\Throwable $e) {
            return $this->reject(
                callId: $callId, name: $name,
                content: "[error: tool '{$name}' threw an exception: {$e->getMessage()}]",
                invokeStart: $invokeStart, startedAt: $startedAt,
                conversationId: $conversationId, args: $args,
                status: InvocationStatus::HandlerError, error: $e->getMessage(), emitFailed: true,
            );
        }
    }

    /**
     * @param  array<string, mixed>  $args
     */
    private function reject(
        string $callId,
        string $name,
        string $content,
        float $invokeStart,
        \DateTimeInterface $startedAt,
        int $conversationId,
        array $args,
        InvocationStatus $status,
        ?string $error,
        bool $emitFailed,
        ?string $persistResult = null,
    ): ToolInvocationResult {
        if ($emitFailed) {
            $this->emitter->toolFailed($name);
        }
        $this->persist($conversationId, $name, $args, $persistResult ?? $content, $status, $error, $startedAt);

        return new ToolInvocationResult(
            message: $this->message($callId, $name, $content),
            elapsedSeconds: $this->clock->now() - $invokeStart,
            status: $status,
        );
    }

    /**
     * @return array{role: string, tool_call_id: string, name: string, content: string}
     */
    private function message(string $callId, string $name, string $content): array
    {
        return ['role' => 'tool', 'tool_call_id' => $callId, 'name' => $name, 'content' => $content];
    }

    /**
     * @param  array<string, mixed>  $args
     * @param  array<string, mixed>|string  $raw
     */
    private function persistSuccess(
        ChatbotTool $tool,
        ToolInvocation $invocation,
        int $conversationId,
        string $name,
        array $args,
        array|string $raw,
        string $encoded,
        \DateTimeInterface $startedAt,
        bool $overran,
    ): void {
        if ($this->invocationStore === null) {
            return;
        }

        if ($tool instanceof PersistableTool) {
            $payload = $tool->persist($invocation, $raw);
            if ($payload === null) {
                return;
            }
            $stored = json_encode($payload, JSON_THROW_ON_ERROR);
        } else {
            $stored = $encoded;
        }

        $this->invocationStore->record(
            conversationId: $conversationId,
            messageId: null,
            toolName: $name,
            arguments: $args,
            result: $stored,
            status: InvocationStatus::Ok->value,
            error: null,
            startedAt: $startedAt,
            finishedAt: Carbon::now(),
            overran: $overran,
        );
    }

    /**
     * @param  array<string, mixed>  $args
     */
    private function persist(
        int $conversationId,
        string $name,
        array $args,
        string $result,
        InvocationStatus $status,
        ?string $error,
        \DateTimeInterface $startedAt,
    ): void {
        $this->invocationStore?->record(
            conversationId: $conversationId,
            messageId: null,
            toolName: $name,
            arguments: $args,
            result: $result,
            status: $status->value,
            error: $error,
            startedAt: $startedAt,
            finishedAt: Carbon::now(),
        );
    }
}
