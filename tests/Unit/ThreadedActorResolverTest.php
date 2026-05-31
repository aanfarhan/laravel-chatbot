<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\ThreadedActorResolver;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Auth\UserProvider;

it('returns null for a guest turn', function (): void {
    $auth = Mockery::mock(AuthFactory::class);

    $resolver = new ThreadedActorResolver($auth);

    expect($resolver->reconstitute(null))->toBeNull();
});

it('resolves as a singleton from the container', function (): void {
    $a = app(ThreadedActorResolver::class);
    $b = app(ThreadedActorResolver::class);

    expect($a)->toBeInstanceOf(ThreadedActorResolver::class);
    expect($a)->toBe($b);
});

it('delegates to the guard provider for an authenticated userId', function (): void {
    $user = Mockery::mock(Authenticatable::class);

    $provider = Mockery::mock(UserProvider::class);
    $provider->shouldReceive('retrieveById')->once()->with('42')->andReturn($user);

    $guard = Mockery::mock(Guard::class);
    $guard->shouldReceive('getProvider')->once()->andReturn($provider);

    $auth = Mockery::mock(AuthFactory::class);
    $auth->shouldReceive('guard')->once()->andReturn($guard);

    $resolver = new ThreadedActorResolver($auth);

    expect($resolver->reconstitute('42'))->toBe($user);
});
