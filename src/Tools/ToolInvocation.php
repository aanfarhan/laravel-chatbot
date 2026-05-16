<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

use Illuminate\Contracts\Auth\Authenticatable;

final readonly class ToolInvocation
{
    /**
     * @param  array<string, mixed>  $args  LLM-supplied arguments (decoded from JSON)
     * @param  array<string, mixed>  $context  Verified static context payload from the envelope
     */
    public function __construct(
        public array $args,
        public ?Authenticatable $actor,
        public string $channel,
        public array $context,
    ) {}
}
