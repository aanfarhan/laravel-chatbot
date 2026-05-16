<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Contracts;

use Aanfarhan\Chatbot\Tools\ToolInvocation;

interface PersistableTool
{
    /**
     * Return a sanitized payload to store as the invocation result, or null to skip persistence entirely.
     *
     * @return array<string, mixed>|null
     */
    public function persist(ToolInvocation $invocation, mixed $result): ?array;
}
