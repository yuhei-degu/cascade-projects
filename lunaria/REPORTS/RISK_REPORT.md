# Lunaria Risk Report

作成日: 2026-05-09

## 目的

AI_DEV_OS 試験導入中に、開発速度より優先して見るべきリスクを記録する。

## Current Risks

| ID | Risk | Severity | Area | Status | Mitigation |
|---|---|---:|---|---|---|
| RISK-001 | Supabase migration の Git 状態と実 DB 状態がズレる | High | DB / Supabase | Open | `014`-`019` の適用状態を人間確認する |
| RISK-002 | ルート運用ファイルと `lunaria/` 運用ファイルが二重管理になる | Medium | Docs / Workflow | Open | 正本ルールを `AI_DEV_OS_TRIAL_PLAN.md` に明記する |
| RISK-003 | `lunaria/PROGRESS.md` が大きく、最新状態と過去ログが混ざる | Medium | Docs | Open | 最新状態はルート `PROGRESS.md`、詳細履歴は `lunaria/PROGRESS.md` と分ける |
| RISK-004 | memory governance の UX が弱いまま記憶機能が進む | High | Product / Trust | Open | restore/edit 設計を実装前にレビューする |
| RISK-005 | reaction / portrait 実装が先走り、Live2D/素材制作に膨らむ | Medium | Scope | Mitigated | `/gacha` 接続は placeholder + reaction ID のみに限定し、素材制作へ広げなかった |
| RISK-006 | 複数 AI が同じ巨大ファイルを同時編集する | High | Workflow | Open | 担当範囲を `AI_ROUTING.md` と `TASK_EVALUATION.md` に記録する |
| RISK-007 | `.env.local` や secret がログ/PRに出る | Critical | Security | Open | `.env.local` は表示しない。env変更は Permission Gate |

## Watch List

- `lunaria-app/app/page.tsx`
- `lunaria-app/app/api/chat/route.ts`
- `lunaria-app/lib/supabase.ts`
- `lunaria-app/supabase/migrations/*.sql`
- `lunaria-app/docs/`

## Risk Review Checklist

- [ ] DB / migration / RLS に触っていないか
- [ ] 認証 / 認可に触っていないか
- [ ] `.env.local` / secret を表示していないか
- [ ] 本番環境に触っていないか
- [ ] 既存ファイルを削除していないか
- [ ] 既存仕様を勝手に変えていないか
- [ ] Claude / Codex の作業範囲が衝突していないか
- [ ] 最新正本を読んでから作業しているか

## Template

```text
### RISK-XXX: Title

- Severity:
- Area:
- Status:
- Trigger:
- Impact:
- Mitigation:
- Owner:
- Review Date:
```
