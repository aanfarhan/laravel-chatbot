<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Extractors;

final class ClientExtractorRegistry
{
    private const NAME_PATTERN = '/^[a-z][a-z0-9_-]*$/';

    private const RESERVED_NAMES = [
        'blade-snapshot',
    ];

    private const IDENTITY_SHAPED_NAMES = [
        'userid', 'user',
        'actorid',
        'accountid',
        'tenantid',
        'viewerid',
        'onbehalfof',
    ];

    /** @var array<string, string> name -> description */
    private array $extractors = [];

    public function register(string $name, string $description): void
    {
        if (! preg_match(self::NAME_PATTERN, $name)) {
            throw new \RuntimeException(
                "Client extractor name '{$name}' is invalid: must start with a lowercase letter and contain only lowercase letters, digits, hyphens, or underscores.",
            );
        }

        if (in_array($name, self::RESERVED_NAMES, true)) {
            throw new \RuntimeException(
                "Client extractor name '{$name}' is reserved and cannot be registered by hosts.",
            );
        }

        $normalized = strtolower(str_replace(['-', '_'], '', $name));
        if (in_array($normalized, self::IDENTITY_SHAPED_NAMES, true)) {
            throw new \RuntimeException(
                "Client extractor name '{$name}' is identity-shaped and is not allowed. See ADR-0003.",
            );
        }

        if (isset($this->extractors[$name])) {
            throw new \RuntimeException("Client extractor '{$name}' is already registered");
        }

        $this->extractors[$name] = $description;
    }

    public function has(string $name): bool
    {
        return isset($this->extractors[$name]);
    }

    /**
     * @return array<string, string> name -> description
     */
    public function all(): array
    {
        return $this->extractors;
    }
}
