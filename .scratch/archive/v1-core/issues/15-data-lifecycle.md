---
Status: done
---

# Data lifecycle: prune + GDPR commands + trait + retention

## Parent

`.scratch/v1-core/PRD.md`

## What to build

Per-channel retention config + five data-lifecycle artisan commands + a User-model trait.

**Retention config** (per channel, default 30 days):
- `null` = keep forever
- `0` = delete after conversation ends
- `N` = delete N days after last activity

**`chatbot:prune`** — scheduled command, runs daily. Hard-deletes conversations past the per-channel retention window.

**`chatbot:delete-user {id} [--hard] [--channel=*]`** — soft-delete by default (recoverable); `--hard` for full erasure (GDPR path). `--channel` scopes to a specific channel or all.

**`chatbot:export-user {id} [--format=json|csv]`** — versioned dump: `{format: "chatbot-export@1", user_id, exported_at, conversations: [...]}`.

**`chatbot:anonymize-user {id}`** — scrubs `user_id` on conversation rows and message contents; preserves token/cost aggregates for spend analytics.

**`chatbot:delete-guest {token}`** — same delete semantics for a guest token.

**`HasChatbotData` trait** for the host User model:
- `$user->chatbotConversations(): Relation`
- `$user->deleteChatbotData(hard: bool = false): void`
- `$user->exportChatbotData(): array`

## Acceptance criteria

- [ ] Prune deletes conversations older than the configured retention
- [ ] Prune respects `null` (no delete) and `0` (delete-after-conversation-ends) sentinels
- [ ] `delete-user` soft-delete: rows excluded from `find`, recoverable via Eloquent restore
- [ ] `delete-user --hard`: rows removed from the database
- [ ] `export-user` produces the documented versioned JSON shape
- [ ] `anonymize-user` retains aggregate token/cost columns; clears `user_id` and message contents
- [ ] `delete-guest` parallels `delete-user` for guest tokens
- [ ] `HasChatbotData` trait methods all functional against a host User model in Testbench
- [ ] `chatbot:prune` registerable in `routes/console.php` as a scheduled task

## Blocked by

- `.scratch/v1-core/issues/04-persistence-and-guest.md`
