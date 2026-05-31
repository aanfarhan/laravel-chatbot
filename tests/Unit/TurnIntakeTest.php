<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Config\ChannelSettings;
use Aanfarhan\Chatbot\Config\Defaults;
use Aanfarhan\Chatbot\ContextSanitizer;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\ConversationReplay;
use Aanfarhan\Chatbot\Envelopes\Envelope;
use Aanfarhan\Chatbot\Exceptions\InvalidExtractorPayloadException;
use Aanfarhan\Chatbot\Extractors\ClientExtractorRegistry;
use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\PreparedTurn;
use Aanfarhan\Chatbot\PromptAssembler;
use Aanfarhan\Chatbot\ThreadedActorResolver;
use Aanfarhan\Chatbot\TokenCounter;
use Aanfarhan\Chatbot\Tools\ToolArgumentValidator;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Aanfarhan\Chatbot\TurnIntake;
use Illuminate\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\UserProvider;

// ──────────────────────────────────────────────────────────────────────────────
// Helpers (prefixed to avoid global function collisions)
// ──────────────────────────────────────────────────────────────────────────────

function tiEnvelope(
    ?string $userId = '42',
    array $payload = ['order' => ['id' => 1]],
    ?int $extractorSizeCapBytes = null,
    array $allowedExtractors = [],
    string $channel = 'default',
    string $route = 'orders.show',
    ?string $prompt = null,
): Envelope {
    return new Envelope(
        payload: $payload,
        userId: $userId,
        route: $route,
        channel: $channel,
        expiresAt: new DateTimeImmutable('+1 hour'),
        version: Envelope::VERSION,
        prompt: $prompt,
        allowedExtractors: $allowedExtractors,
        extractorSizeCapBytes: $extractorSizeCapBytes,
    );
}

function tiConversationRecord(
    int $id = 1,
    string $uuid = 'test-uuid',
    ?int $userId = 42,
    ?string $guestToken = null,
    ?DateTimeInterface $lastMessageAt = null,
    string $channel = 'default',
): ConversationRecord {
    return new ConversationRecord(
        id: $id,
        uuid: $uuid,
        channel: $channel,
        userId: $userId,
        guestToken: $guestToken,
        inputTokens: 0,
        outputTokens: 0,
        costCents: 0,
        lastMessageAt: $lastMessageAt,
    );
}

function tiMessageRecord(): MessageRecord
{
    return new MessageRecord(
        id: 1,
        conversationId: 1,
        role: 'user',
        content: 'hello',
        routeName: 'orders.show',
        contextHash: 'hash',
        inputTokens: 0,
        outputTokens: 0,
        costCents: 0,
        error: null,
        createdAt: new DateTimeImmutable,
    );
}

function tiConversationReplay(): ConversationReplay
{
    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('findByUuidWithMessages')->andReturnNull();

    $invocations = Mockery::mock(ToolInvocationStore::class);

    return new ConversationReplay(
        conversations: $store,
        invocations: $invocations,
        registry: app(ToolRegistry::class),
        validator: new ToolArgumentValidator(Defaults::MAX_ARG_LENGTH),
    );
}

function tiActorResolver(): ThreadedActorResolver
{
    $provider = Mockery::mock(UserProvider::class);
    $provider->shouldReceive('retrieveById')->andReturnNull();

    $guard = Mockery::mock(Guard::class);
    $guard->shouldReceive('getProvider')->andReturn($provider);

    $auth = Mockery::mock(AuthFactory::class);
    $auth->shouldReceive('guard')->andReturn($guard);

    return new ThreadedActorResolver($auth);
}

function tiActorResolverFor(string $userId, Authenticatable $user): ThreadedActorResolver
{
    $provider = Mockery::mock(UserProvider::class);
    $provider->shouldReceive('retrieveById')->with($userId)->once()->andReturn($user);

    $guard = Mockery::mock(Guard::class);
    $guard->shouldReceive('getProvider')->andReturn($provider);

    $auth = Mockery::mock(AuthFactory::class);
    $auth->shouldReceive('guard')->andReturn($guard);

    return new ThreadedActorResolver($auth);
}

function tiIntake(
    ?ConversationStore $store = null,
    ?ThreadedActorResolver $actorResolver = null,
    bool $assertAppendCalled = false,
): TurnIntake {
    $conversation = tiConversationRecord();

    if ($store === null) {
        $store = Mockery::mock(ConversationStore::class);
        $store->shouldReceive('findByUuid')->andReturnNull();
        $store->shouldReceive('start')->andReturn($conversation);

        if ($assertAppendCalled) {
            $store->shouldReceive('append')->once()->andReturn(tiMessageRecord());
        } else {
            $store->shouldReceive('append')->andReturn(tiMessageRecord());
        }
    }

    if ($actorResolver === null) {
        $actorResolver = tiActorResolver();
    }

    $config = new ConfigRepository([
        'chatbot' => [
            'token_cap' => 32768,
            'channels' => ['default' => []],
        ],
    ]);

    return new TurnIntake(
        assembler: new PromptAssembler,
        sanitizer: new ContextSanitizer,
        store: $store,
        replay: tiConversationReplay(),
        tokenCounter: new TokenCounter,
        actorResolver: $actorResolver,
        extractorRegistry: new ClientExtractorRegistry,
        channelSettings: new ChannelSettings($config),
        config: $config,
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Slice 1 – tracer bullet: happy path
// ──────────────────────────────────────────────────────────────────────────────

it('returns a PreparedTurn with correct shape for an authed user', function (): void {
    $conversation = tiConversationRecord(id: 7, uuid: 'conv-uuid', userId: 42);
    $user = Mockery::mock(Authenticatable::class);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('findByUuid')->never();
    $store->shouldReceive('start')->once()->andReturn($conversation);
    $store->shouldReceive('append')->once()->andReturn(tiMessageRecord());

    $actorResolver = tiActorResolverFor(userId: '42', user: $user);

    $intake = tiIntake(store: $store, actorResolver: $actorResolver);
    $envelope = tiEnvelope(userId: '42');

    $result = $intake->prepare(
        verified: $envelope,
        message: 'hello',
        extractorBlocks: [],
        guestCookie: null,
        conversationCookie: null,
        ttl: 3600,
    );

    expect($result)->toBeInstanceOf(PreparedTurn::class);
    expect($result->conversation)->toBe($conversation);
    expect($result->guestToken)->toBeNull();
    expect($result->actor)->toBe($user);
    expect($result->contextHash)->toBeString()->not->toBeEmpty();
    expect($result->model)->toBeNull();
    expect($result->messages)->toBeArray()->not->toBeEmpty();
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 2 – guest token minting
// ──────────────────────────────────────────────────────────────────────────────

it('sets guestToken to null for an authenticated user', function (): void {
    $result = tiIntake()->prepare(
        verified: tiEnvelope(userId: '42'),
        message: 'hi',
        extractorBlocks: [],
        guestCookie: 'some-cookie',
        conversationCookie: null,
        ttl: 3600,
    );

    expect($result->guestToken)->toBeNull();
});

it('reuses an existing guest cookie as the guest token', function (): void {
    $result = tiIntake()->prepare(
        verified: tiEnvelope(userId: null),
        message: 'hi',
        extractorBlocks: [],
        guestCookie: 'existing-guest-token',
        conversationCookie: null,
        ttl: 3600,
    );

    expect($result->guestToken)->toBe('existing-guest-token');
});

it('mints a random 40-character guest token when no cookie is present', function (): void {
    $result = tiIntake()->prepare(
        verified: tiEnvelope(userId: null),
        message: 'hi',
        extractorBlocks: [],
        guestCookie: null,
        conversationCookie: null,
        ttl: 3600,
    );

    expect($result->guestToken)->toBeString()->toHaveLength(40);
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 3 – conversation resolution
// ──────────────────────────────────────────────────────────────────────────────

it('starts a fresh conversation when no cookie is present', function (): void {
    $fresh = tiConversationRecord(id: 1, uuid: 'fresh-uuid');

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('findByUuid')->never();
    $store->shouldReceive('start')->once()->andReturn($fresh);
    $store->shouldReceive('append')->andReturn(tiMessageRecord());

    $result = tiIntake(store: $store)->prepare(
        verified: tiEnvelope(),
        message: 'hi',
        extractorBlocks: [],
        guestCookie: null,
        conversationCookie: null,
        ttl: 3600,
    );

    expect($result->conversation)->toBe($fresh);
});

it('reuses an existing conversation when cookie matches, within idle window, and owned', function (): void {
    $existing = tiConversationRecord(
        id: 5,
        uuid: 'existing-uuid',
        userId: 42,
        lastMessageAt: now()->subSeconds(60),
    );

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('findByUuid')->with('existing-uuid')->once()->andReturn($existing);
    $store->shouldReceive('start')->never();
    $store->shouldReceive('append')->andReturn(tiMessageRecord());

    $result = tiIntake(store: $store)->prepare(
        verified: tiEnvelope(userId: '42'),
        message: 'hi',
        extractorBlocks: [],
        guestCookie: null,
        conversationCookie: 'existing-uuid',
        ttl: 3600,
    );

    expect($result->conversation)->toBe($existing);
});

it('starts a fresh conversation when the existing one is outside the idle window', function (): void {
    $stale = tiConversationRecord(
        id: 5,
        uuid: 'stale-uuid',
        userId: 42,
        lastMessageAt: now()->subSeconds(7200),
    );
    $fresh = tiConversationRecord(id: 6, uuid: 'fresh-uuid');

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('findByUuid')->with('stale-uuid')->once()->andReturn($stale);
    $store->shouldReceive('start')->once()->andReturn($fresh);
    $store->shouldReceive('append')->andReturn(tiMessageRecord());

    $result = tiIntake(store: $store)->prepare(
        verified: tiEnvelope(userId: '42'),
        message: 'hi',
        extractorBlocks: [],
        guestCookie: null,
        conversationCookie: 'stale-uuid',
        ttl: 3600,
    );

    expect($result->conversation)->toBe($fresh);
});

it('starts a fresh conversation when the existing one is not owned by the requester', function (): void {
    $notOwned = tiConversationRecord(
        id: 5,
        uuid: 'other-uuid',
        userId: 99,
        lastMessageAt: now()->subSeconds(60),
    );
    $fresh = tiConversationRecord(id: 6, uuid: 'fresh-uuid', userId: 42);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('findByUuid')->with('other-uuid')->once()->andReturn($notOwned);
    $store->shouldReceive('start')->once()->andReturn($fresh);
    $store->shouldReceive('append')->andReturn(tiMessageRecord());

    $result = tiIntake(store: $store)->prepare(
        verified: tiEnvelope(userId: '42'),
        message: 'hi',
        extractorBlocks: [],
        guestCookie: null,
        conversationCookie: 'other-uuid',
        ttl: 3600,
    );

    expect($result->conversation)->toBe($fresh);
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 4 – bad extractor payload
// ──────────────────────────────────────────────────────────────────────────────

it('throws InvalidExtractorPayloadException on a disallowed extractor block', function (): void {
    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('start')->andReturn(tiConversationRecord());
    $store->shouldReceive('append')->never();

    $intake = tiIntake(store: $store);
    $envelope = tiEnvelope(allowedExtractors: []);

    expect(fn () => $intake->prepare(
        verified: $envelope,
        message: 'hi',
        extractorBlocks: [['name' => 'not-allowed', 'output' => 'data']],
        guestCookie: null,
        conversationCookie: null,
        ttl: 3600,
    ))->toThrow(InvalidExtractorPayloadException::class);
});
