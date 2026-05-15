<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Clients\FakeClient;
use Aanfarhan\Chatbot\Responses\StreamChunk;

it('respondWithStream yields one StreamChunk per chunk string', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['Hel', 'lo', '!']);

    $chunks = iterator_to_array(
        $client->stream([['role' => 'user', 'content' => 'hi']]),
        false,
    );

    expect($chunks)->toHaveCount(3);
    expect($chunks[0])->toBeInstanceOf(StreamChunk::class);
    expect($chunks[0]->content)->toBe('Hel');
    expect($chunks[1]->content)->toBe('lo');
    expect($chunks[2]->content)->toBe('!');
});
