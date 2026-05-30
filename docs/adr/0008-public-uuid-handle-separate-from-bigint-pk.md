# Conversations expose a UUID handle separate from the bigint primary key

## Context

A [[conversation]]'s identifier leaves the server three ways: the `chatbot_conversation_{channel}` cookie, the history route `/chatbot/conversations/{id}/messages`, and the `done` SSE event's `conversation_id`. The primary key was an auto-increment bigint (`$table->id()`), so these identifiers were small sequential integers — trivially enumerable.

That enumeration met a second, more serious flaw: the append path (`MessagesController::resolveConversation`) reused whatever conversation the cookie named **without checking ownership**. Any caller could set the cookie to `victim_id + 1` and write turns into another party's conversation. The read path (history) already enforced ownership; the write path did not.

Two separate problems, easy to conflate: a missing **authorization** check, and an **enumerable** identifier.

## Decision

Treat them as two things, fix the authorization, harden the identifier.

- **The fix is the ownership check.** `resolveConversation` now matches the cookie's conversation against the requester before reuse — authenticated requesters on host user identity only, guests on guest token only, never cross-honoured; a conversation owned by neither (post-anonymization) is reusable by no one. A presented identifier that fails is treated as absent: the server silently starts a fresh conversation rather than revealing the identifier exists. This closes the IDOR **regardless of identifier type**. See [[conversation-ownership]].
- **The hardening is a separate public identifier.** Conversations keep the auto-increment bigint primary key and integer foreign keys internally; a `uuid` column (random **UUIDv4** via `Str::uuid()`, unique-indexed, set in the model's `creating` hook, never fillable) becomes the *only* conversation identifier exposed to the client. Cookie, history route, and `done` event all carry the `uuid`; internal joins stay integer.

The UUID is defence-in-depth — it removes enumeration and ordering leakage. It is **not** the fix: the `uuid` is not secret (it is handed to the browser and echoed back), so without the ownership check an attacker who learned a victim's `uuid` could still write. The ownership check is load-bearing on its own; the UUID narrows the attack surface around it.

## Considered alternatives

- **Swap the primary key to UUID.** Rejected. The package targets MySQL, Postgres, and SQLite; SQLite cannot alter a constrained primary key in place without a full table rebuild, and the change cascades through three FK-constrained tables. A random UUIDv4 clustered primary key also fragments the index and bloats every foreign key. The exposed surface is one identifier — no reason to pay a graph-wide cost for it.
- **ULID or UUIDv7 on the column.** Rejected. Both embed a creation timestamp and are k-sortable, reintroducing the ordering/mint-time leak we are removing. The index-locality benefit of time-ordered keys is irrelevant on a secondary unique column. v4's lack of embedded structure is the point.
- **Rely on the UUID alone (skip the ownership check).** Rejected — the central error this ADR exists to prevent. An unguessable but non-secret handle is not an access control.

## Consequences

- `ConversationStore::find(int)` is replaced by `findByUuid(string)`; history gains a dedicated messages-eager-loading read. Both controllers resolve conversations by `uuid` through the store — the previous split where history hit the model directly is removed.
- `ConversationRecord` carries `uuid`. Internal admin/GDPR operations (`forUser`, `delete`, `anonymize`, `export`) continue to key on the integer primary key — they are not client-facing.
- The `done` SSE event's `message_id` (which only ever fed the unbuilt rating endpoint) is dropped along with the rating UI; no client-facing integer identifier remains.
