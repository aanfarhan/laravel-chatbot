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

final class OpenAiCompatibleClient implements LLMClient
{
    public function __construct(
        private readonly ClientInterface $http,
        private readonly string $baseUrl,
        private readonly string $apiKey,
        private readonly string $model,
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

    public function stream(array $messages, array $tools = [], ?string $model = null): iterable
    {
        if ($this->apiKey === '') {
            throw new ChatbotConfigurationException('API key is not configured');
        }

        return $this->doStream($messages, $model);
    }

    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @return \Generator<StreamChunk>
     */
    private function doStream(array $messages, ?string $model): \Generator
    {
        $body = json_encode([
            'model' => $model ?? $this->model,
            'messages' => $messages,
            'stream' => true,
        ], JSON_THROW_ON_ERROR);

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
            throw new ChatbotProviderException(
                'Provider returned HTTP '.$status,
                retryable: $status === 429,
                previous: $e,
            );
        }

        $body = $response->getBody();

        while (! $body->eof()) {
            $line = '';
            while (! $body->eof()) {
                $char = $body->read(1);
                if ($char === "\n") {
                    break;
                }
                $line .= $char;
            }

            $line = trim($line);

            if (! str_starts_with($line, 'data:')) {
                continue;
            }

            $data = trim(substr($line, 5));

            if ($data === '[DONE]') {
                break;
            }

            /** @var array{choices?: list<array{delta?: array{content?: string}}>, usage?: array{prompt_tokens?: int, completion_tokens?: int}} $decoded */
            $decoded = json_decode($data, true, flags: JSON_THROW_ON_ERROR);

            $content = $decoded['choices'][0]['delta']['content'] ?? '';

            $usage = null;
            if (isset($decoded['usage'])) {
                $usage = new Usage(
                    inputTokens: (int) ($decoded['usage']['prompt_tokens'] ?? 0),
                    outputTokens: (int) ($decoded['usage']['completion_tokens'] ?? 0),
                );
            }

            if ($content !== '' || $usage !== null) {
                yield new StreamChunk($content, $usage);
            }
        }
    }
}
