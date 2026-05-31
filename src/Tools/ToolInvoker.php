<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\PersistableTool;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Contracts\ToolResolver;
use Aanfarhan\Chatbot\Streaming\StreamEmitter;
use Aanfarhan\Chatbot\Support\Truncator;
use Closure;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Carbon;

final class ToolInvoker
{
    private readonly ToolArgumentValidator $validator;

    public function __construct(
        private readonly ToolResolver $resolver,
        private readonly ?ToolInvocationStore $invocationStore,
        private readonly StreamEmitter $emitter,
        private readonly int $defaultTimeout,
        private readonly int $resultSizeCap,
        int $maxArgLength,
        private readonly ?Closure $clock = null,
    ) {
        $this->validator = new ToolArgumentValidator($maxArgLength);
    }

    private function now(): float
    {
        return $this->clock !== null ? ($this->clock)() : microtime(true);
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
        $invokeStart = $this->now();
        $startedAt = Carbon::now();

        if ($allowedTools !== null && ! in_array($name, $allowedTools, true)) {
            $content = "[error: tool '{$name}' is not permitted on this channel]";
            $this->persist($conversationId, $name, [], $content, InvocationStatus::RejectedAllowlist, null, $startedAt);

            return new ToolInvocationResult(
                message: $this->message($callId, $name, $content),
                elapsedSeconds: $this->now() - $invokeStart,
                status: InvocationStatus::RejectedAllowlist,
            );
        }

        $tool = $this->resolver->resolve($name);

        if ($tool === null) {
            $content = "[error: tool '{$name}' not found in registry]";
            $this->persist($conversationId, $name, [], $content, InvocationStatus::RejectedNotFound, null, $startedAt);

            return new ToolInvocationResult(
                message: $this->message($callId, $name, $content),
                elapsedSeconds: $this->now() - $invokeStart,
                status: InvocationStatus::RejectedNotFound,
            );
        }

        $decoded = json_decode($argumentsJson, true);
        /** @var array<string, mixed> $args */
        $args = is_array($decoded) ? $decoded : [];

        if (! $this->validator->validate($tool->parameters(), $args)) {
            $content = 'arguments did not match schema';
            $this->emitter->toolFailed($name);
            $this->persist($conversationId, $name, $args, '', InvocationStatus::RejectedSchema, $content, $startedAt);

            return new ToolInvocationResult(
                message: $this->message($callId, $name, $content),
                elapsedSeconds: $this->now() - $invokeStart,
                status: InvocationStatus::RejectedSchema,
            );
        }

        $invocation = new ToolInvocation(args: $args, channel: $channel, context: []);

        $this->emitter->toolStarted($name);

        try {
            if (! $tool->authorize($actor, $invocation)) {
                $content = "[error: not authorized to call tool '{$name}']";
                $this->emitter->toolFailed($name);
                $this->persist($conversationId, $name, $args, $content, InvocationStatus::RejectedUnauthorized, 'not authorized', $startedAt);

                return new ToolInvocationResult(
                    message: $this->message($callId, $name, $content),
                    elapsedSeconds: $this->now() - $invokeStart,
                    status: InvocationStatus::RejectedUnauthorized,
                );
            }

            $deadline = $this->now() + $this->defaultTimeout;
            $raw = $tool->handle($actor, $invocation);
            $overran = $this->now() > $deadline;

            $encoded = is_array($raw) ? json_encode($raw, JSON_THROW_ON_ERROR) : (string) $raw;
            $encoded = Truncator::toByteCap($encoded, $this->resultSizeCap);

            $this->emitter->toolFinished($name);
            $this->persistSuccess($tool, $invocation, $conversationId, $name, $args, $raw, $encoded, $startedAt, $overran);

            return new ToolInvocationResult(
                message: $this->message($callId, $name, $encoded),
                elapsedSeconds: $this->now() - $invokeStart,
                status: InvocationStatus::Ok,
            );
        } catch (\Throwable $e) {
            $content = "[error: tool '{$name}' threw an exception: {$e->getMessage()}]";
            $this->emitter->toolFailed($name);
            $this->persist($conversationId, $name, $args, $content, InvocationStatus::HandlerError, $e->getMessage(), $startedAt);

            return new ToolInvocationResult(
                message: $this->message($callId, $name, $content),
                elapsedSeconds: $this->now() - $invokeStart,
                status: InvocationStatus::HandlerError,
            );
        }
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
