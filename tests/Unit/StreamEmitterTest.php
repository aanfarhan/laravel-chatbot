<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Streaming\RecordingStreamEmitter;
use Aanfarhan\Chatbot\Streaming\SseStreamEmitter;

it('records a token event', function (): void {
    $emitter = new RecordingStreamEmitter;

    $emitter->token('Hello');

    expect($emitter->events())->toBe([
        ['event' => 'token', 'content' => 'Hello'],
    ]);
});

it('records a contextSummary event', function (): void {
    $emitter = new RecordingStreamEmitter;

    $emitter->contextSummary('A brief summary');

    expect($emitter->events())->toBe([
        ['event' => 'context_summary', 'summary' => 'A brief summary'],
    ]);
});

it('records toolStarted, toolFinished, and toolFailed events', function (): void {
    $emitter = new RecordingStreamEmitter;

    $emitter->toolStarted('lookup_order');
    $emitter->toolFinished('lookup_order');
    $emitter->toolFailed('failing_tool');

    expect($emitter->events())->toBe([
        ['event' => 'tool_started', 'name' => 'lookup_order'],
        ['event' => 'tool_finished', 'name' => 'lookup_order'],
        ['event' => 'tool_failed', 'name' => 'failing_tool'],
    ]);
});

it('records an error event', function (): void {
    $emitter = new RecordingStreamEmitter;

    $emitter->error('timeout', 'stream duration exceeded', true);

    expect($emitter->events())->toBe([
        ['event' => 'error', 'code' => 'timeout', 'message' => 'stream duration exceeded', 'retryable' => true],
    ]);
});

it('records a done event', function (): void {
    $emitter = new RecordingStreamEmitter;

    $emitter->done('abc-uuid', 10, 20);

    expect($emitter->events())->toBe([
        ['event' => 'done', 'conversation_id' => 'abc-uuid', 'input_tokens' => 10, 'output_tokens' => 20],
    ]);
});

// SseStreamEmitter — byte-identical SSE output

it('SseStreamEmitter writes token as SSE frame', function (): void {
    $emitter = new SseStreamEmitter;

    ob_start();
    $emitter->token('Hello');
    $output = (string) ob_get_clean();

    expect($output)->toBe("event: token\ndata: {\"content\":\"Hello\"}\n\n");
});

it('SseStreamEmitter writes contextSummary as SSE frame', function (): void {
    $emitter = new SseStreamEmitter;

    ob_start();
    $emitter->contextSummary('summary text');
    $output = (string) ob_get_clean();

    expect($output)->toBe("event: context_summary\ndata: {\"summary\":\"summary text\"}\n\n");
});

it('SseStreamEmitter writes toolStarted with phase field', function (): void {
    $emitter = new SseStreamEmitter;

    ob_start();
    $emitter->toolStarted('lookup_order');
    $output = (string) ob_get_clean();

    expect($output)->toBe("event: tool_started\ndata: {\"name\":\"lookup_order\",\"phase\":\"started\"}\n\n");
});

it('SseStreamEmitter writes toolFinished with phase field', function (): void {
    $emitter = new SseStreamEmitter;

    ob_start();
    $emitter->toolFinished('lookup_order');
    $output = (string) ob_get_clean();

    expect($output)->toBe("event: tool_finished\ndata: {\"name\":\"lookup_order\",\"phase\":\"finished\"}\n\n");
});

it('SseStreamEmitter writes toolFailed with phase field', function (): void {
    $emitter = new SseStreamEmitter;

    ob_start();
    $emitter->toolFailed('bad_tool');
    $output = (string) ob_get_clean();

    expect($output)->toBe("event: tool_failed\ndata: {\"name\":\"bad_tool\",\"phase\":\"failed\"}\n\n");
});

it('SseStreamEmitter writes error as SSE frame', function (): void {
    $emitter = new SseStreamEmitter;

    ob_start();
    $emitter->error('timeout', 'stream duration exceeded', true);
    $output = (string) ob_get_clean();

    expect($output)->toBe("event: error\ndata: {\"code\":\"timeout\",\"message\":\"stream duration exceeded\",\"retryable\":true}\n\n");
});

it('SseStreamEmitter writes done with usage wrapper', function (): void {
    $emitter = new SseStreamEmitter;

    ob_start();
    $emitter->done('conv-uuid', 10, 20);
    $output = (string) ob_get_clean();

    expect($output)->toBe("event: done\ndata: {\"conversation_id\":\"conv-uuid\",\"usage\":{\"input_tokens\":10,\"output_tokens\":20}}\n\n");
});

it('records events in emission order', function (): void {
    $emitter = new RecordingStreamEmitter;

    $emitter->token('Hi');
    $emitter->toolStarted('lookup');
    $emitter->toolFinished('lookup');
    $emitter->done('uuid', 5, 8);

    expect(array_column($emitter->events(), 'event'))->toBe([
        'token', 'tool_started', 'tool_finished', 'done',
    ]);
});
