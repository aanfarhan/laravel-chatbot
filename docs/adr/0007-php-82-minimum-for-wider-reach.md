# PHP 8.2 is the minimum supported version

## Context

The package is a Composer library, so its `require.php` constraint is a public contract: it is the floor every downstream app must clear to install. It previously required `^8.3`. Many production Laravel apps and shared hosts still run PHP 8.2 — which remains in active support until December 2026 — and were excluded purely by that bound, not by any technical need.

Auditing `src/` confirmed the exclusion was incidental: no PHP 8.3-only feature was in use. The eight `readonly class` declarations are an 8.2 feature, not 8.3. There were no typed class constants, no `#[\Override]`, no `json_validate()`, no dynamic class-constant fetch. A scan of the locked dependency tree (prod and dev) found nothing that itself requires 8.3+ — Laravel 11/12, Guzzle, `opis/json-schema`, and the dev tools all install on 8.2.

Laravel 11 requires PHP `^8.2`, which sets a hard lower bound: the package cannot support a PHP older than 8.2 without also dropping Laravel 11. So 8.2 — not 8.1 — is the natural floor.

## Decision

The minimum supported PHP version is **8.2** (`require.php: ^8.2`), and the floor is enforced by the toolchain rather than only documented.

- **`config.platform.php` is pinned to `8.2.0`**, the floor of the published constraint, so the committed `composer.lock` resolves exactly as a minimum-supported consumer would — not against the maintainer's local PHP. Pinning to a higher patch (e.g. `8.2.30`) was rejected: it would let the lock pick a dependency requiring a later 8.2 patch and silently narrow real support below what the README advertises.
- **PHPStan pins `phpVersion: 80200`.** Any 8.3+ syntax or function is now flagged at analysis time across all of `src/`, regardless of test coverage. This closes the gap where an untested branch calling, say, `json_validate()` would pass an 8.2 runtime CI job yet break a consumer in production. Given the package does JSON-schema validation, `json_validate()` is a realistic trap.
- **CI tests the floor and the ceiling**: the matrix moved from `8.3`/`8.4` to `8.2`/`8.4` × {L11, L12}. The previously-tested 8.3 is the interpolated middle and is dropped, keeping CI cost flat while honoring the new floor.
- **Shipped as a minor release (1.4.0).** Lowering the floor is strictly more permissive — no existing consumer's resolution breaks — so it is not a breaking change.

## Considered alternatives

- **Stay on `^8.3`.** Rejected. The bound excluded the large PHP 8.2 base for no technical reason; the whole motivation here is reach.
- **Go to `^8.1`.** Rejected. Laravel 11 requires `^8.2`, so an 8.1 floor would force dropping Laravel 11, and 8.1 is near end-of-life. 8.2 captures the reachable audience without that cost.
- **Rely on the 8.2 CI job alone, without the PHPStan pin.** Rejected. Runtime CI only catches an 8.3-ism if a test exercises that exact line; the static pin catches all of them and is one config line in CI we already run.
- **Pin `platform.php` to `8.2.30` (latest patch) instead of `8.2.0`.** Rejected — see Decision. It recreates maintainer-laptop drift one notch down.
- **Add 8.2 as extra matrix rows (6 jobs) rather than replacing 8.3 (4 jobs).** Rejected. For a library the values that matter are the floor and the latest; the middle version rarely breaks independently, and flat CI cost was preferred.

## Consequences

- The package is now installable on PHP 8.2 apps running Laravel 11 or 12.
- New package code is locked out of every 8.3+ language and stdlib feature until the next major release. This is a real, ongoing constraint on the maintainer — now enforced mechanically, so it fails fast in CI rather than in a consumer's logs.
- The change is near one-way. Lowering the floor was a minor bump; **raising it again drops a supported platform and therefore requires a major release**. In practice this commits the package to supporting 8.2 through its end-of-life (December 2026).
- Local development defaults to the PHP 8.2 Herd binary so day-to-day runs exercise the floor CI guards, rather than passing on a newer local PHP and failing only in CI.
