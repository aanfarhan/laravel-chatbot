<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\PromptAssembler;

it('produces a system message first and user message last', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: [],
        history: [],
        userMessage: 'Hello',
    );

    expect($messages)->toHaveCount(2)
        ->and($messages[0]['role'])->toBe('system')
        ->and($messages[1]['role'])->toBe('user')
        ->and($messages[1]['content'])->toBe('Hello');
});

it('renders context payload as XML block inside <context> tags', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: ['order' => ['id' => 7, 'total' => 45]],
        history: [],
        userMessage: 'What is my order?',
    );

    $system = $messages[0]['content'];

    expect($system)->toContain('<context>')
        ->toContain('</context>')
        ->toContain('<order>{"id":7,"total":45}</order>');
});

it('omits the <context> block when context payload is empty', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: [],
        history: [],
        userMessage: 'Hi',
    );

    expect($messages[0]['content'])->not->toContain('<context>');
});

it('includes host global prompt after base prompt', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: ['system_prompt' => 'You work for Acme Corp.'],
        routeOverrides: [],
        contextPayload: [],
        history: [],
        userMessage: 'Hi',
    );

    $system = $messages[0]['content'];
    $basePos = strpos($system, 'Answer only from');
    $globalPos = strpos($system, 'You work for Acme Corp.');

    expect($basePos)->toBeLessThan($globalPos);
});

it('omits the host global prompt layer when not configured', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: [],
        history: [],
        userMessage: 'Hi',
    );

    expect($messages[0]['content'])->not->toContain('You work for Acme Corp.');
});

it('includes per-route prompt after host global prompt', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: ['system_prompt' => 'Global prompt.'],
        routeOverrides: ['prompt' => 'Focus on orders only.'],
        contextPayload: [],
        history: [],
        userMessage: 'Hi',
    );

    $system = $messages[0]['content'];
    $globalPos = strpos($system, 'Global prompt.');
    $routePos = strpos($system, 'Focus on orders only.');

    expect($globalPos)->toBeLessThan($routePos);
});

it('omits per-route prompt layer when not provided', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: [],
        history: [],
        userMessage: 'Hi',
    );

    expect($messages)->toHaveCount(2);
});

it('inserts conversation history between the system message and user message', function (): void {
    $assembler = new PromptAssembler;

    $history = [
        ['role' => 'user', 'content' => 'First question'],
        ['role' => 'assistant', 'content' => 'First answer'],
    ];

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: [],
        history: $history,
        userMessage: 'Follow-up',
    );

    expect($messages)->toHaveCount(4)
        ->and($messages[0]['role'])->toBe('system')
        ->and($messages[1])->toBe(['role' => 'user', 'content' => 'First question'])
        ->and($messages[2])->toBe(['role' => 'assistant', 'content' => 'First answer'])
        ->and($messages[3])->toBe(['role' => 'user', 'content' => 'Follow-up']);
});

it('truncates a context section exceeding the per-section size cap and appends a marker', function (): void {
    $assembler = new PromptAssembler(sectionSizeCap: 100);

    $longValue = str_repeat('x', 200);

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: ['big' => $longValue],
        history: [],
        userMessage: 'Hi',
    );

    $system = $messages[0]['content'];

    expect($system)->toContain('[truncated]')
        ->and(strlen($system))->toBeLessThan(500);
});

it('resolves closures in context payload at assembly time', function (): void {
    $assembler = new PromptAssembler;
    $resolved = false;

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: [
            'order' => function () use (&$resolved): array {
                $resolved = true;

                return ['id' => 99];
            },
        ],
        history: [],
        userMessage: 'Hi',
    );

    expect($resolved)->toBeTrue()
        ->and($messages[0]['content'])->toContain('<order>{"id":99}</order>');
});

// ─── Snapshot tests ──────────────────────────────────────────────────────────

it('snapshot: full assembled prompt for a typical request', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: ['system_prompt' => 'You work for Acme Corp.'],
        routeOverrides: ['prompt' => 'Focus on order details.'],
        contextPayload: ['order' => ['id' => 7, 'total' => 45, 'status' => 'pending']],
        history: [
            ['role' => 'user', 'content' => 'What is my order status?'],
            ['role' => 'assistant', 'content' => 'Your order is pending.'],
        ],
        userMessage: 'When will it ship?',
    );

    expect($messages)->toMatchSnapshot();
});

it('snapshot: assembled prompt with empty context', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: ['system_prompt' => 'You work for Acme Corp.'],
        routeOverrides: ['prompt' => 'Focus on order details.'],
        contextPayload: [],
        history: [],
        userMessage: 'Hello',
    );

    expect($messages)->toMatchSnapshot();
});

it('snapshot: assembled prompt with no host global or per-route prompts', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: [],
        routeOverrides: [],
        contextPayload: ['order' => ['id' => 1]],
        history: [],
        userMessage: 'Hi',
    );

    expect($messages)->toMatchSnapshot();
});

it('snapshot: assembled prompt with no history', function (): void {
    $assembler = new PromptAssembler;

    $messages = $assembler->assemble(
        channelConfig: ['system_prompt' => 'Global.'],
        routeOverrides: ['prompt' => 'Route.'],
        contextPayload: ['product' => ['sku' => 'ABC']],
        history: [],
        userMessage: 'Tell me about this product.',
    );

    expect($messages)->toMatchSnapshot();
});
