# DECISIONS

重要な判断を時系列で残します。

## 2026-05-09

### 決定内容

例: MVP ではチーム機能を含めず、個人利用に限定する。

### 理由

例: 認可、UI、課金が複雑になるため、初期リリースでは価値検証を優先する。

### 代替案

- チーム機能を最初から入れる
- 招待機能だけ入れる

### 後で見直す条件

例: 有料ユーザーからチーム利用の要望が 5 件以上出たら再検討する。

## 2026-05-09

### Decision

Adopt Claude's visual/items output as design and mock UI source material, not as completed DB-backed functionality.

### Reason

The new `/items` and `/character` pages are useful for product direction, visual QA, and future DB implementation planning, while staying safe because they do not touch Supabase, auth, env, Stripe, or production.

### Alternatives

- Defer the Claude output entirely until DB migrations are ready.
- Immediately connect the mock pages to DB tables.

### Review Conditions

Revisit after `character_states` and `user_items` migrations are designed, reviewed, and applied in the intended environment.

## 2026-05-09

### Decision

Create `020_user_items.sql` and `021_character_states.sql` as migration candidates, but do not apply them yet.

### Reason

Claude's DB design referenced future tables such as `lunaria_items` and `character_profiles`, while the current implemented schema uses `lunaria_gacha_pool`, `lunaria_gacha_inventory`, and `lunaria_gacha_history`. Candidate migrations let us review the shape safely before touching Supabase.

### Alternatives

- Wait until a separate item catalog exists.
- Create `lunaria_items` and `character_profiles` immediately.
- Skip migration candidates and only keep design docs.

### Review Conditions

Review again after Supabase `014` through `019` state is confirmed and before any SQL Editor application.
