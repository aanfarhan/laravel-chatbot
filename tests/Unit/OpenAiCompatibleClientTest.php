<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Clients\OpenAiCompatibleClient;
use Aanfarhan\Chatbot\Exceptions\ChatbotConfigurationException;
use Aanfarhan\Chatbot\Exceptions\ChatbotProviderException;
use Aanfarhan\Chatbot\Responses\ChatResponse;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;
use Psr\Http\Message\RequestInterface;

function buildOpenAiClient(MockHandler $mock, array &$history): OpenAiCompatibleClient
{
    $stack = HandlerStack::create($mock);
    $stack->push(Middleware::history($history));

    $guzzle = new GuzzleClient(['handler' => $stack]);

    return new OpenAiCompatibleClient(
        $guzzle,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test-abc',
        model: 'gpt-4o-mini',
    );
}

it('POSTs to {base_url}/chat/completions with bearer auth, model, and messages', function (): void {
    $mock = new MockHandler([
        new Response(200, [], json_encode([
            'choices' => [['message' => ['role' => 'assistant', 'content' => 'hello back']]],
            'usage' => ['prompt_tokens' => 12, 'completion_tokens' => 4],
        ])),
    ]);
    $history = [];
    $client = buildOpenAiClient($mock, $history);

    $response = $client->chat([
        ['role' => 'system', 'content' => 'you are helpful'],
        ['role' => 'user', 'content' => 'hi'],
    ]);

    expect($response)->toBeInstanceOf(ChatResponse::class);
    expect($response->content)->toBe('hello back');
    expect($response->usage?->inputTokens)->toBe(12);
    expect($response->usage?->outputTokens)->toBe(4);

    expect($history)->toHaveCount(1);
    /** @var RequestInterface $request */
    $request = $history[0]['request'];

    expect($request->getMethod())->toBe('POST');
    expect((string) $request->getUri())->toBe('https://api.openai.com/v1/chat/completions');
    expect($request->getHeaderLine('Authorization'))->toBe('Bearer sk-test-abc');
    expect($request->getHeaderLine('Content-Type'))->toContain('application/json');

    $payload = json_decode((string) $request->getBody(), true);
    expect($payload['model'])->toBe('gpt-4o-mini');
    expect($payload['messages'])->toBe([
        ['role' => 'system', 'content' => 'you are helpful'],
        ['role' => 'user', 'content' => 'hi'],
    ]);
});

it('throws ChatbotConfigurationException when apiKey is empty', function (): void {
    $mock = new MockHandler([]);
    $stack = HandlerStack::create($mock);
    $guzzle = new GuzzleClient(['handler' => $stack]);

    $client = new OpenAiCompatibleClient($guzzle, 'https://api.openai.com/v1', '', 'gpt-4o-mini');

    $client->stream([['role' => 'user', 'content' => 'hi']]);
})->throws(ChatbotConfigurationException::class);

it('throws ChatbotProviderException with retryable=true on HTTP 429', function (): void {
    $mock = new MockHandler([new Response(429, [], 'Too Many Requests')]);
    $history = [];
    $client = buildOpenAiClient($mock, $history);

    try {
        iterator_to_array($client->stream([['role' => 'user', 'content' => 'hi']]));
        expect(false)->toBeTrue('expected exception');
    } catch (ChatbotProviderException $e) {
        expect($e->isRetryable())->toBeTrue();
        expect($e->code())->toBe('provider_error');
    }
});
