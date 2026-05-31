<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Persistence\ConversationRecord;

function makeRecord(?int $userId, ?string $guestToken): ConversationRecord
{
    return new ConversationRecord(
        id: 1,
        uuid: 'test-uuid',
        channel: 'default',
        userId: $userId,
        guestToken: $guestToken,
        inputTokens: 0,
        outputTokens: 0,
        costCents: 0,
        lastMessageAt: null,
    );
}

// ─── user-owned ────────────────────────────────────────────────────────────────

it('grants access when user id matches', function (): void {
    $record = makeRecord(userId: 42, guestToken: null);
    expect($record->ownedBy('42', null))->toBeTrue();
});

it('denies access when user id does not match', function (): void {
    $record = makeRecord(userId: 42, guestToken: null);
    expect($record->ownedBy('99', null))->toBeFalse();
});

it('denies access when user id is null on request', function (): void {
    $record = makeRecord(userId: 42, guestToken: null);
    expect($record->ownedBy(null, null))->toBeFalse();
});

it('ignores guest token when record is user-owned', function (): void {
    $record = makeRecord(userId: 42, guestToken: null);
    expect($record->ownedBy('42', 'any-token'))->toBeTrue();
    expect($record->ownedBy('99', 'any-token'))->toBeFalse();
});

it('compares string user id by integer value', function (): void {
    $record = makeRecord(userId: 42, guestToken: null);
    expect($record->ownedBy('42', null))->toBeTrue();
    expect($record->ownedBy('042', null))->toBeTrue();
});

// ─── guest-owned ───────────────────────────────────────────────────────────────

it('grants access when guest token matches', function (): void {
    $record = makeRecord(userId: null, guestToken: 'tok-abc');
    expect($record->ownedBy(null, 'tok-abc'))->toBeTrue();
});

it('denies access when guest token does not match', function (): void {
    $record = makeRecord(userId: null, guestToken: 'tok-abc');
    expect($record->ownedBy(null, 'tok-xyz'))->toBeFalse();
});

it('denies access when guest token is null on request', function (): void {
    $record = makeRecord(userId: null, guestToken: 'tok-abc');
    expect($record->ownedBy(null, null))->toBeFalse();
});

it('ignores user id when record is guest-owned', function (): void {
    $record = makeRecord(userId: null, guestToken: 'tok-abc');
    expect($record->ownedBy('7', 'tok-abc'))->toBeTrue();
    expect($record->ownedBy(null, 'tok-abc'))->toBeTrue();
    expect($record->ownedBy('7', 'tok-xyz'))->toBeFalse();
});

// ─── owned-by-neither ─────────────────────────────────────────────────────────

it('denies all access when record is owned by neither', function (): void {
    $record = makeRecord(userId: null, guestToken: null);
    expect($record->ownedBy(null, null))->toBeFalse();
    expect($record->ownedBy('1', null))->toBeFalse();
    expect($record->ownedBy(null, 'any-token'))->toBeFalse();
    expect($record->ownedBy('1', 'any-token'))->toBeFalse();
});
