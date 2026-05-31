<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Contracts;

interface ToolResolver
{
    public function resolve(string $name): ?ChatbotTool;

    /**
     * @param  list<string>|null  $allowedTools
     * @return list<array<string, mixed>>
     */
    public function definitions(?array $allowedTools): array;
}
