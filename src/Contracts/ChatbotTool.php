<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Contracts;

use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

interface ChatbotTool
{
    public function name(): string;

    public function description(): string;

    /**
     * Hand-written JSON-schema array in OpenAI's `parameters` shape, passed through to the provider verbatim.
     *
     * @return array<string, mixed>
     */
    public function parameters(): array;

    /**
     * Decide whether the threaded actor may invoke this tool with these arguments.
     *
     * $actor is the verified host-side identity for this turn, or null for guest turns. Handlers MUST
     * scope authorization by $actor (or treat null as "unauthenticated"); they MUST NOT read identity
     * from $invocation->args. Reading identity from LLM-supplied arguments is what this signature exists
     * to make impossible — see ADR-0003.
     */
    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool;

    /**
     * Execute the tool for the threaded $actor (null = guest). Scope all data access by $actor; never
     * by anything in $invocation->args. See ADR-0003.
     *
     * @return array<string, mixed>|string
     */
    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array|string;
}
