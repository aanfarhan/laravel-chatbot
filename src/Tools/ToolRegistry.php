<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\ToolResolver;
use Aanfarhan\Chatbot\Exceptions\ForbiddenToolArgumentException;
use Illuminate\Contracts\Foundation\Application;

final class ToolRegistry implements ToolResolver
{
    private const FORBIDDEN_ARG_NAMES = [
        'user_id', 'userid', 'user',
        'actor_id', 'actorid',
        'account_id', 'accountid',
        'tenant_id', 'tenantid',
        'viewer_id', 'viewerid',
        'on_behalf_of', 'onbehalfof',
    ];

    /** @var array<string, string> name -> class */
    private array $tools = [];

    public function __construct(private readonly Application $app) {}

    /**
     * @param  class-string<ChatbotTool>  $class
     */
    public function register(string $class): void
    {
        /** @var ChatbotTool $instance */
        $instance = $this->app->make($class);
        $name = $instance->name();

        if (isset($this->tools[$name])) {
            throw new \RuntimeException("Tool '{$name}' is already registered");
        }

        $this->assertNoForbiddenArguments($name, $instance->parameters());

        $this->tools[$name] = $class;
    }

    /**
     * @param  array<string, mixed>  $parameters
     */
    private function assertNoForbiddenArguments(string $toolName, array $parameters): void
    {
        $properties = $parameters['properties'] ?? null;
        if (! is_array($properties)) {
            return;
        }

        foreach (array_keys($properties) as $propertyName) {
            $normalized = strtolower((string) str_replace('_', '', (string) $propertyName));
            $needle = strtolower((string) $propertyName);

            if (in_array($needle, self::FORBIDDEN_ARG_NAMES, true)
                || in_array($normalized, self::FORBIDDEN_ARG_NAMES, true)) {
                throw new ForbiddenToolArgumentException(sprintf(
                    "Tool '%s' declares forbidden identity-shaped argument '%s'. Identity must be threaded as the \$actor parameter on ChatbotTool::authorize() / handle(); it must never appear in LLM-visible tool arguments. See ADR-0003.",
                    $toolName,
                    (string) $propertyName,
                ));
            }
        }
    }

    public function resolve(string $name): ?ChatbotTool
    {
        if (! isset($this->tools[$name])) {
            return null;
        }

        /** @var ChatbotTool */
        return $this->app->make($this->tools[$name]);
    }

    /**
     * @return list<array<string, mixed>> OpenAI tools array
     */
    public function toDefinitions(): array
    {
        $defs = [];

        foreach ($this->tools as $name => $class) {
            /** @var ChatbotTool $instance */
            $instance = $this->app->make($class);
            $defs[] = [
                'type' => 'function',
                'function' => [
                    'name' => $name,
                    'description' => $instance->description(),
                    'parameters' => $instance->parameters(),
                ],
            ];
        }

        return $defs;
    }

    /**
     * @param  list<string>  $allowlist
     * @return list<array<string, mixed>> OpenAI tools array filtered to the allowlist
     */
    public function toDefinitionsFor(array $allowlist): array
    {
        $allowed = array_flip($allowlist);
        $defs = [];

        foreach ($this->tools as $name => $class) {
            if (! isset($allowed[$name])) {
                continue;
            }

            /** @var ChatbotTool $instance */
            $instance = $this->app->make($class);
            $defs[] = [
                'type' => 'function',
                'function' => [
                    'name' => $name,
                    'description' => $instance->description(),
                    'parameters' => $instance->parameters(),
                ],
            ];
        }

        return $defs;
    }

    public function isEmpty(): bool
    {
        return $this->tools === [];
    }

    public function clear(): void
    {
        $this->tools = [];
    }
}
