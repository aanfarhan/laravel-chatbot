<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Tools\ToolArgumentValidator;

it('accepts arguments that conform to the schema', function (): void {
    $validator = new ToolArgumentValidator(defaultMaxStringLength: 10240);

    $schema = [
        'type' => 'object',
        'properties' => [
            'order_id' => ['type' => 'integer'],
        ],
        'required' => ['order_id'],
        'additionalProperties' => false,
    ];

    expect($validator->validate($schema, ['order_id' => 42]))->toBeTrue();
});

it('rejects unknown properties when additionalProperties is false', function (): void {
    $validator = new ToolArgumentValidator(defaultMaxStringLength: 10240);

    $schema = [
        'type' => 'object',
        'properties' => ['order_id' => ['type' => 'integer']],
        'required' => ['order_id'],
        'additionalProperties' => false,
    ];

    expect($validator->validate($schema, ['order_id' => 1, 'extra' => 'x']))->toBeFalse();
});

it('forces strict additionalProperties even when the schema does not declare it', function (): void {
    $validator = new ToolArgumentValidator(defaultMaxStringLength: 10240);

    $schema = [
        'type' => 'object',
        'properties' => ['order_id' => ['type' => 'integer']],
        'required' => ['order_id'],
    ];

    expect($validator->validate($schema, ['order_id' => 1, 'extra' => 'x']))->toBeFalse();
});

it('rejects when a required property is missing', function (): void {
    $validator = new ToolArgumentValidator(defaultMaxStringLength: 10240);

    $schema = [
        'type' => 'object',
        'properties' => ['order_id' => ['type' => 'integer']],
        'required' => ['order_id'],
        'additionalProperties' => false,
    ];

    expect($validator->validate($schema, []))->toBeFalse();
});

it('rejects type mismatches without coercion', function (): void {
    $validator = new ToolArgumentValidator(defaultMaxStringLength: 10240);

    $schema = [
        'type' => 'object',
        'properties' => ['order_id' => ['type' => 'integer']],
        'required' => ['order_id'],
        'additionalProperties' => false,
    ];

    expect($validator->validate($schema, ['order_id' => '42']))->toBeFalse();
});

it('rejects strings exceeding an explicit maxLength', function (): void {
    $validator = new ToolArgumentValidator(defaultMaxStringLength: 10240);

    $schema = [
        'type' => 'object',
        'properties' => ['code' => ['type' => 'string', 'maxLength' => 5]],
        'required' => ['code'],
        'additionalProperties' => false,
    ];

    expect($validator->validate($schema, ['code' => 'abcdef']))->toBeFalse();
});

it('rejects strings exceeding the default maxLength when none is declared', function (): void {
    $validator = new ToolArgumentValidator(defaultMaxStringLength: 5);

    $schema = [
        'type' => 'object',
        'properties' => ['note' => ['type' => 'string']],
        'required' => ['note'],
        'additionalProperties' => false,
    ];

    expect($validator->validate($schema, ['note' => 'abcdef']))->toBeFalse();
});
