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

## 2026-05-09

### Character/User Items Runbook Review

### Review Date

2026-05-09

### Target

- `lunaria/SUPABASE_020_021_CHARACTER_ITEMS_RUNBOOK.md`
- `lunaria/SUPABASE_020_021_SECURITY_REVIEW.md`
- `lunaria-app/scripts/character-sql-pack.js`
- `lunaria-app/scripts/character-verify.js`

### Findings

- SQL pack script generates `supabase/manual/020_021_character_items_apply_bundle.sql` successfully.
- Verify script is read-only and checks table/column presence plus a default character state row.
- Runbook explicitly gates production/unknown target apply.
- Security review records RLS, dependency, and array-FK limitations.

### Severity

- Low

### Status

- Accepted as pre-apply support material

## 2026-05-09

### Items/Character DB-Fallback Review

### Review Date

2026-05-09

### Target

- `lunaria-app/lib/lunaria/character-items.ts`
- `lunaria-app/app/api/items/route.ts`
- `lunaria-app/app/api/character/state/route.ts`
- `lunaria-app/app/items/page.tsx`
- `lunaria-app/app/character/page.tsx`

### Findings

- No blocking findings during self-review.
- New APIs are read-only.
- Missing `020/021` tables are handled as fallback cases, not page-breaking errors.
- `/items` can use existing `lunaria_gacha_inventory` before `lunaria_user_items` exists.
- `/character` remains usable before `lunaria_character_states` exists.

### Severity

- Medium

### Status

- Accepted for staged rollout

### Residual Risks

- Current implementation uses the existing fixed dev user pattern, consistent with the rest of the app but not production auth-ready.
- Equipment mutations are intentionally not implemented yet; ownership validation should be reviewed before adding writes.

## 2026-05-09 Diary UI Must-A/B/C Review

### Target

- `lunaria-app/app/diary/page.tsx`
- `lunaria/DIARY_UI_ACCEPTANCE_CHECKLIST_2026-05-09.md`

### Findings

- No blocking findings during self-review.
- The implementation does not change DB, API routes, migrations, auth, env, or production settings.
- Memory candidates are no longer shown as a default expanded main section.
- Raw diary metrics are now behind `Diary source details`.
- Source conversation is lower in the main flow and collapsed by default.

### Residual Risks

- UI copy is currently ASCII/English to avoid Windows encoding corruption in shared files; Japanese tone pass should be done later with a verified UTF-8 workflow.
- Visual QA in browser is still recommended after the local dev server is running.

### Verification

- `npm run build`: passed.
- `npx tsc --noEmit --pretty false`: passed.

## 2026-05-09 Memory UI Copy and Design Batch Review

### Target

- `lunaria-app/app/memory/page.tsx`
- `lunaria/MEMORY_RESTORE_EDIT_DESIGN_2026-05-09.md`
- `lunaria/ASSISTANT_REPLY_INTEGRATION_PLAN_2026-05-09.md`
- `lunaria/PORTRAIT_COMPONENT_CONSOLIDATION_PLAN_2026-05-09.md`

### Findings

- No DB/API/schema/env/production changes in this batch.
- `/memory` UI copy now explains that diary is day history, memory is carry-forward context, and candidates are user-approved suggestions.
- Restore/edit work is intentionally design-only until the next implementation step.
- AssistantReply plan recommends parser-first rollout to avoid breaking chat.
- Portrait plan avoids a risky immediate component merge.

### Residual Risks

- Candidate approve/archive/reject still depends on migration `019` being applied in the real Supabase project.
- Japanese UX copy should be restored later through a verified UTF-8 workflow.
- Browser visual QA is recommended.

## 2026-05-09 AssistantReply Parser Foundation Review

### Target

- `lunaria-app/lib/lunaria/assistant-reply.ts`
- `lunaria-app/lib/lunaria/visual-state.ts`

### Findings

- No blocking findings during self-review.
- Parser has raw-text fallback, so invalid/non-JSON model output can still become `{ message: rawText }`.
- The new files are not wired into chat yet, intentionally avoiding runtime behavior changes.
- zod dependency already exists in the project.

### Residual Risks

- Future integration must not break streaming chat.
- `should_create_memory_candidate` should remain a hint, not an automatic write trigger.

## 2026-05-09 Memory Candidate Restore UI Review

### Target

- `lunaria-app/app/memory/page.tsx`
- `lunaria-app/components/character/LunariaPortrait.tsx`

### Findings

- No DB schema or API contract changes.
- Candidate restore uses the existing `pending` action already accepted by `PATCH /api/memory/candidates`.
- Archived/rejected candidate restore is explicit and reversible.
- Core memory restore/edit remains intentionally out of this implementation batch.
- Portrait mock cleanup reduces future merge risk by sharing expression/motion types.

### Residual Risks

- Restore behavior needs real Supabase data after migration `019` is applied.
- Candidate counts now refresh after each action rather than relying on local optimistic decrements, which is safer but adds a network reload.
