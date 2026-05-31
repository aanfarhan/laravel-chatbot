<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Contracts;

interface ToolResolver
{
    public function resolve(string $name): ?ChatbotTool;
}
