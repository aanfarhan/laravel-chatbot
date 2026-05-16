<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Clients;

use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Exceptions\ChatbotConfigurationException;
use Aanfarhan\Chatbot\Exceptions\ChatbotProviderException;
use Aanfarhan\Chatbot\Responses\ChatResponse;
use Aanfarhan\Chatbot\Responses\StreamChunk;
use Aanfarhan\Chatbot\Responses\Usage;
use GuzzleHttp\ClientInterface;
use GuzzleHttp\Exception\BadResponseException;
use GuzzleHttp\Psr7\Request;
use Psr\Log\LoggerInterface;

final class OpenAiCompatibleClient implements LLMClient
{
    public function __construct(
        private readonly ClientInterface $http,
        private readonly string $baseUrl,
        private readonly string $apiKey,
        private readonly string $model,
        private readonly ?LoggerInterface $logger = null,
    ) {}

    public function chat(array $messages, array $tools = [], ?string $model = null): ChatResponse
    {
        $body = json_encode([
            'model' => $model ?? $this->model,
            'messages' => $messages,
        ], JSON_THROW_ON_ERROR);

        $request = new Request(
            'POST',
            rtrim($this->baseUrl, '/').'/chat/completions',
            [
                'Authorization' => 'Bearer '.$this->apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
            $body,
        );

        $response = $this->http->send($request);

        /** @var array{
         *   choices: list<array{message: array{role: string, content: string}}>,
         *   usage?: array{prompt_tokens?: int, completion_tokens?: int}
         * } $decoded
         */
        $decoded = json_decode((string) $response->getBody(), true, flags: JSON_THROW_ON_ERROR);

        $content = $decoded['choices'][0]['message']['content'] ?? '';

        $usage = null;
        if (isset($decoded['usage'])) {
            $usage = new Usage(
                inputTokens: (int) ($decoded['usage']['prompt_tokens'] ?? 0),
                outputTokens: (int) ($decoded['usage']['completion_tokens'] ?? 0),
            );
        }

        return new ChatResponse($content, $usage);
    }

    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @param  list<array<string, mixed>>  $tools
     * @return iterable<int, StreamChunk>
     */
    public function stream(array $messages, array $tools = [], ?string $model = null): iterable
    {
        if ($this->apiKey === '') {
            throw new ChatbotConfigurationException('API key is not configured');
        }

        return $this->doStream($messages, $model, $tools);
    }

    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @param  list<array<string, mixed>>  $tools
     * @return \Generator<int, StreamChunk, mixed, void>
     */
    private function doStream(array $messages, ?string $model, array $tools, bool $retryingWithoutTools = false): \Generator
    {
        $payload = [
            'model' => $model ?? $this->model,
            'messages' => $messages,
            'stream' => true,
        ];

        if ($tools !== []) {
            $payload['tools'] = $tools;
        }

        $body = json_encode($payload, JSON_THROW_ON_ERROR);

        $request = new Request(
            'POST',
            rtrim($this->baseUrl, '/').'/chat/completions',
            [
                'Authorization' => 'Bearer '.$this->apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'text/event-stream',
            ],
            $body,
        );

        try {
            $response = $this->http->send($request, ['stream' => true]);
        } catch (BadResponseException $e) {
            $status = $e->getResponse()->getStatusCode();

            if (! $retryingWithoutTools && $tools !== [] && $status >= 400 && $status < 500) {
                $errorBody = (string) $e->getResponse()->getBody();
                if ($this->isToolsUnsupportedError($errorBody)) {
                    $this->logger?->warning('[chatbot] provider rejected tools; retrying without tools');
                    yield from $this->doStream($messages, $model, [], retryingWithoutTools: true);

                    return;
                }
            }

            throw new ChatbotProviderException(
                'Provider returned HTTP '.$status,
                retryable: $status === 429,
                previous: $e,
            );
        }

        $body = $response->getBody();

        /** @var array<int, array{id: string, name: string, arguments: string}> $toolCallAccumulators */
        $toolCallAccumulators = [];

        while (true) {
            $char = $body->read(1);
            if ($char === '') {
                break;
            }
            $line = '';
            while ($char !== "\n" && $char !== '') {
                $line .= $char;
                $char = $body->read(1);
            }

            $line = trim($line);

            if (! str_starts_with($line, 'data:')) {
                continue;
            }

            $data = trim(substr($line, 5));

            if ($data === '[DONE]') {
                break;
            }

            $decoded = json_decode($data, true, flags: JSON_THROW_ON_ERROR);

            if (! is_array($decoded)) {
                continue;
            }

            $choices = is_array($decoded['choices'] ?? null) ? $decoded['choices'] : [];
            $choice = is_array($choices[0] ?? null) ? $choices[0] : [];
            $delta = is_array($choice['delta'] ?? null) ? $choice['delta'] : [];
            $content = is_string($delta['content'] ?? null) ? (string) $delta['content'] : '';
            $finishReason = is_string($choice['finish_reason'] ?? null) ? $choice['finish_reason'] : null;

            // Accumulate streamed tool_call deltas
            $tcDeltas = is_array($delta['tool_calls'] ?? null) ? $delta['tool_calls'] : [];
            foreach ($tcDeltas as $tcDelta) {
                if (! is_array($tcDelta)) {
                    continue;
                }

                $idx = is_int($tcDelta['index'] ?? null) ? $tcDelta['index'] : 0;
                if (! isset($toolCallAccumulators[$idx])) {
                    $toolCallAccumulators[$idx] = ['id' => '', 'name' => '', 'arguments' => ''];
                }

                if (is_string($tcDelta['id'] ?? null)) {
                    $toolCallAccumulators[$idx]['id'] .= $tcDelta['id'];
                }

                $fn = is_array($tcDelta['function'] ?? null) ? $tcDelta['function'] : [];
                if (is_string($fn['name'] ?? null)) {
                    $toolCallAccumulators[$idx]['name'] .= $fn['name'];
                }

                if (is_string($fn['arguments'] ?? null)) {
                    $toolCallAccumulators[$idx]['arguments'] .= $fn['arguments'];
                }
            }

            $usage = null;
            if (is_array($decoded['usage'] ?? null)) {
                $usageRaw = $decoded['usage'];
                $usage = new Usage(
                    inputTokens: is_int($usageRaw['prompt_tokens'] ?? null) ? $usageRaw['prompt_tokens'] : 0,
                    outputTokens: is_int($usageRaw['completion_tokens'] ?? null) ? $usageRaw['completion_tokens'] : 0,
                );
            }

            // On finish_reason=tool_calls, yield assembled tool calls
            if ($finishReason === 'tool_calls' && $toolCallAccumulators !== []) {
                ksort($toolCallAccumulators);
                /** @var list<array{id: string, name: string, arguments: string}> $assembled */
                $assembled = array_values($toolCallAccumulators);
                $toolCallAccumulators = [];

                yield new StreamChunk('', $usage, $assembled);

                continue;
            }

            if ($content !== '' || $usage !== null) {
                yield new StreamChunk($content, $usage);
            }
        }
    }

    private function isToolsUnsupportedError(string $body): bool
    {
        $lower = strtolower($body);

        return str_contains($lower, 'tool') || str_contains($lower, 'function') || str_contains($lower, 'not supported');
    }
}
