<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

use Opis\JsonSchema\Helper;
use Opis\JsonSchema\Validator;

final class ToolArgumentValidator
{
    private readonly Validator $opis;

    public function __construct(private readonly int $defaultMaxStringLength)
    {
        $this->opis = new Validator;
    }

    /**
     * @param  array<string, mixed>  $schema
     * @param  array<string, mixed>  $args
     */
    public function validate(array $schema, array $args): bool
    {
        $prepared = $this->applyDefaultMaxLength($schema);
        $schemaJson = json_encode($prepared, JSON_THROW_ON_ERROR);
        // Re-encode with `properties` forced to a JSON object so opis accepts even empty schemas.
        $schemaJson = preg_replace('/"properties":\s*\[\]/', '"properties":{}', $schemaJson) ?? $schemaJson;
        $schemaObject = json_decode($schemaJson, false, flags: JSON_THROW_ON_ERROR);
        if (! is_object($schemaObject)) {
            return false;
        }

        $data = Helper::toJSON($args === [] ? new \stdClass : $args);

        $result = $this->opis->validate($data, $schemaObject);

        return $result->isValid();
    }

    /**
     * @param  array<string, mixed>  $schema
     * @return array<string, mixed>
     */
    private function applyDefaultMaxLength(array $schema): array
    {
        if (($schema['type'] ?? null) === 'object') {
            $schema['additionalProperties'] = false;
        }

        if (! isset($schema['properties']) || ! is_array($schema['properties'])) {
            return $schema;
        }

        $properties = $schema['properties'];
        foreach ($properties as $name => $spec) {
            if (! is_array($spec)) {
                continue;
            }
            if (($spec['type'] ?? null) === 'string' && ! array_key_exists('maxLength', $spec)) {
                $spec['maxLength'] = $this->defaultMaxStringLength;
                $properties[$name] = $spec;
            }
        }
        $schema['properties'] = $properties;

        return $schema;
    }
}
