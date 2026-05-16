<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Facades\Chatbot as ChatbotFacade;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\Tests\Stubs\LookupOrderTool;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Pest\Expectation;

uses(RefreshDatabase::class);

function makeSupportsFlagRecord(): MessageRecord
{
    return new MessageRecord(
        id: 1,
        conversationId: 1,
        role: 'assistant',
        content: '',
        routeName: 'test',
        contextHash: 'abc',
        inputTokens: 0,
        outputTokens: 0,
        costCents: 0,
        error: null,
        createdAt: now(),
    );
}

function sseSupportsEventsFromOutput(string $raw): array
{
    $events = [];
    $current = [];
    foreach (explode("\n", $raw) as $line) {
        if ($line === '') {
            if ($current !== []) {
                $events[] = $current;
                $current = [];
            }

            continue;
        }
        if (str_starts_with($line, 'event:')) {
            $current['event'] = trim(substr($line, 6));
        } elseif (str_starts_with($line, 'data:')) {
            $current['data'] = json_decode(trim(substr($line, 5)), true) ?? [];
        }
    }

    return $events;
}

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    ChatbotFacade::clearTools();
});

// --- Cycle 1: flag-off suppresses tool defs ---

it('sends no tool defs to the LLM when supports_tools is false', function (): void {
    config()->set('chatbot.provider.supports_tools', false);

    ChatbotFacade::registerTool(LookupOrderTool::class);
    $fake = ChatbotFacade::fake();
    $fake->respondWithStream(['Hello']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeSupportsFlagRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    expect($fake->lastSentTools())->toBe([]);
});

it('sends tool defs normally when supports_tools is true', function (): void {
    config()->set('chatbot.provider.supports_tools', true);

    ChatbotFacade::registerTool(LookupOrderTool::class);
    $fake = ChatbotFacade::fake();
    $fake->respondWithStream(['Hello']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeSupportsFlagRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        allowedTools: ['lookup_order'],
    )->sendContent();
    ob_end_clean();

    expect($fake->lastSentTools())->not->toBe([]);
});

// Custom expectation helper
expect()->extend('toContainSupportsEventType', function (string $type): Expectation {
    $found = array_filter($this->value, fn ($e) => ($e['event'] ?? '') === $type);
    expect($found)->not->toBeEmpty("Expected SSE events to contain '{$type}' event.");

    return $this;
});
