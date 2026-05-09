# REVIEW_LOG

## 2026-05-09

### `/gacha` Localhost 500 Investigation

### レビュー日

2026-05-09

### 対象

- `http://localhost:3000/gacha`
- `lunaria-app/.next`
- `npm run gacha:smoke`

### 指摘

- `/gacha` が HTTP 500 を返していた。
- Dev log に `Cannot find module './828.js'` が出ており、Next.js dev cache の stale/corrupt chunk が原因だった。
- Gacha API / DB / business logic の失敗ではなかった。

### 重要度

- Medium

### 対応状況

- Fixed

### 対応内容

- Next dev server の対象 node process のみ停止。
- `lunaria-app/.next` を削除。
- `npm run build` を再実行して成功。
- Next dev server を再起動。
- `/gacha` が HTTP 200 に復帰。
- `npm run gacha:smoke` が全項目 PASS。

### 再発時の対応

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
# dev serverを止める
Remove-Item .next -Recurse -Force
npm run build
npm run dev
npm run gacha:smoke
```

---

### レビュー日

2026-05-09

### 対象

例: 初期設計案、PR、特定差分

### 指摘

- 例: RLS policy の insert 条件が未定義

### 重要度

- Critical
- High
- Medium
- Low

### 対応状況

- Open
- Fixed
- Won't Fix
- Deferred

### メモ

- 判断理由や再確認事項を書く

## 2026-05-09

### Claude Visual/Items Mock UI Intake

### Review Date

2026-05-09

### Target

- `lunaria-app/docs/`
- `lunaria-app/app/items/page.tsx`
- `lunaria-app/app/character/page.tsx`
- `lunaria-app/components/character/LunariaPortrait.tsx`
- `lunaria-app/tsconfig.mocks.json`

### Findings

- No blocking code findings were found during intake.
- The new pages are explicitly mock-only and do not fetch Supabase data.
- No secret/env patterns were found in the new docs and mock UI files.
- Build and TypeScript checks pass locally.

### Severity

- Low

### Status

- Accepted

### Residual Risks

- There are two portrait placeholder components in different component folders. This is acceptable for intake, but should be consolidated before deeper character-state integration.
- `/items` and `/character` can be mistaken for production-backed pages unless future work keeps the mock notice visible until DB integration is complete.

## 2026-05-09

### Character/User Items Migration Candidate Review

### Review Date

2026-05-09

### Target

- `lunaria-app/supabase/migrations/020_user_items.sql`
- `lunaria-app/supabase/migrations/021_character_states.sql`
- `lunaria-app/lib/supabase.ts`

### Findings

- Candidate migrations are additive and preserve existing gacha inventory/history tables.
- RLS is enabled on both new tables with separate select/insert/update/delete owner policies.
- `020` backfills from `lunaria_gacha_inventory` and computes duplicate counts from `lunaria_gacha_history` without deleting existing rows.
- `021` seeds default character state rows without inferring current equipment.

### Severity

- Medium

### Status

- Review Required Before Apply

### Residual Risks

- The migrations depend on `014` through `019` being applied first.
- Array columns such as `equipped_accessory_pool_ids` cannot enforce foreign keys per element. Application or RPC validation will be needed before equipment editing is exposed.
- RLS policies are prepared, but the current Next.js code often uses `service_role`; runtime access patterns should be reviewed before client-side DB access is added.
