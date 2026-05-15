<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Contracts;

use Aanfarhan\Chatbot\Responses\ChatResponse;

interface LLMClient
{
    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @param  list<array<string, mixed>>  $tools
     */
    public function chat(array $messages, array $tools = [], ?string $model = null): ChatResponse;

    /**
     * @param  list<array{role: string, content: string}>  $messages
     * @param  list<array<string, mixed>>  $tools
     * @return iterable<int, mixed>
     */
    public function stream(array $messages, array $tools = [], ?string $model = null): iterable;
}
