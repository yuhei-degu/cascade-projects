# SPEC.md

Created: 2026-05-09
Status: initial AI_DEV_OS application for the active Lunaria project in this repository

## Project Overview

This repository is a multi-project workspace. The current active development target is **Lunaria**, located mainly in:

- Product/design docs: `lunaria/`
- Next.js app: `lunaria-app/`

Lunaria is an AI companion / AI diary product. It starts as a Japanese AI diary and chat app, but the architecture is being shaped toward an **AI companion life-log OS** where conversation, diary, memory, character state, visual expression, gacha, and future external integrations can evolve without being collapsed into one data model.

Short product definition:

> 30 seconds of conversation grows a diary, memory, and relationship with Luna.

Lunaria is not intended to replace general-purpose AI tools. ChatGPT / Claude / Gemini are “current intelligence”; Lunaria is the place where daily feelings, conversations, memories, and the relationship with Luna accumulate.

## Target Users

Primary initial user:

- Japanese individual user who wants a lightweight AI companion to talk with daily.
- Someone who values emotional continuity, diary reflection, and a character relationship more than general AI productivity.
- User who may use ChatGPT/Claude for work, but wants Lunaria as a personal memory and emotional log space.

Future expansion users:

- Users who want long-term AI memory with editable governance.
- Users interested in character customization, outfits, small rewards, and lightweight collection mechanics.
- Users who may later connect external apps, calendars, health data, or AI glasses style inputs.

## MVP Scope

Current MVP scope includes:

- Japanese chat with Luna.
- Routing between light casual replies and serious mode.
- Conversation/message persistence.
- AI diary generation and diary browsing.
- Long-term core memory and memory candidate review foundation.
- User profile separation from core memory.
- Gacha / moon box feature with tickets, coins, inventory, content pool, pity system, and admin status pages.
- Basic `/memory` page for reviewing memories and memory candidates.
- Supabase-backed persistence with migrations.
- Local development and GitHub PR workflow.

## Major Features

### Chat

- Home page at `lunaria-app/app/page.tsx`.
- API route `lunaria-app/app/api/chat/route.ts`.
- Prompt/routing utilities in `lunaria-app/lib/lunaria/`.
- Gemini streaming is the main path; serious-mode support exists in project history and docs.

### Diary

- Page: `lunaria-app/app/diary/page.tsx`.
- APIs: `app/api/diary/route.ts`, `app/api/diary/month/route.ts`.
- Diary v1 payload includes title, summary, events, talked_about, emotions, Luna comment, unresolved issues, next topics, and memory changes.

### Memory

- Page: `lunaria-app/app/memory/page.tsx`.
- APIs: `app/api/memory/route.ts`, `app/api/memory/candidates/route.ts`.
- Core rules:
  - Diary and memory are separate.
  - Memory candidates should be reviewed before becoming durable core memory.
  - Profile-like facts should not be duplicated into core memory.
  - Gacha results should not become core memory.

### Gacha / Moon Box

- Pages: `/gacha`, `/gacha/inventory`, `/admin/gacha`.
- APIs: `app/api/gacha/*`, `app/api/admin/pool-stats/route.ts`.
- Design principle: gacha is not a pay-to-win mechanic; it is a relationship and life-log ornament.
- Existing design docs include `lunaria/PHASE_G_GACHA_DESIGN.md`, `lunaria/MOONBOX_*`, and `lunaria-app/GACHA_REQUIREMENTS.md`.

### Architecture Guardrails

Primary architecture docs:

- `lunaria/LUNARIA_ARCHITECTURE_PRINCIPLES.md`
- `lunaria/LUNARIA_PRODUCT_STRATEGY_SYNTHESIS_2026-05-09.md`
- `lunaria/LUNARIA_DIARY_MEMORY_DESIGN.md`
- `lunaria/PROFILE_MEMORY_INTEGRATION.md`

Core guardrail:

```text
AI reply != screen display != diary != long-term memory != character state
```

## Non-Goals / Out Of Scope For Now

- Full Live2D / 3D character implementation.
- Multiple character models or female-oriented alternate model rollout.
- End-world weekly game implementation.
- AI glasses / external app integration implementation.
- Payment / subscription production rollout.
- Full production Vercel deployment as a priority, because free-plan constraints are known.
- Large refactors that do not directly improve current app stability.

## Technical Stack

Current app stack:

- Next.js `15.2.4`
- React `19.0.0`
- TypeScript `5.9.3`
- Supabase JS `2.49.4`
- Anthropic SDK `0.36.3`
- OpenAI SDK `4.77.0`
- Node/npm project in `lunaria-app/`
- Supabase migrations in `lunaria-app/supabase/migrations/`

Useful commands:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run build
npm run gacha:smoke
npm run gacha:verify
npm run supabase:verify
npm run gacha:report
```

## Success Criteria

Short-term success:

- Local app builds successfully.
- Chat, diary, memory, and gacha pages load reliably.
- Supabase migrations are applied in the expected order.
- User can see what Luna remembers and can approve/reject memory candidates.
- Gacha remains optional and does not pollute core memory.

Medium-term success:

- Diary, memory, profile, character state, and gacha are cleanly separated.
- Luna can show simple reaction/visual state without coupling UI to LLM text.
- Memory governance feels safe: user can correct what Luna remembers.
- Documentation and handoff files allow Codex / Claude / Cursor style agents to work asynchronously without stepping on each other.

Long-term success:

- Lunaria can grow from AI diary into AI companion life-log OS without rewriting the core data model.
- Future features such as Live2D, external events, AI glasses inputs, user communication profiles, and weekly game loops can be added through clear layers.

## Assumptions

- The active project for this AI_DEV_OS application is Lunaria, not every folder in the `CascadeProjects` monorepo.
- The Git root is `C:\Users\yuuve\CascadeProjects`.
- `lunaria-app/.git` should not exist; root Git is the source of truth.
- Supabase migrations may still need manual SQL Editor application.
- Existing uncommitted docs from Claude/Codex are intentionally not modified by this initialization.

## Risks

- This repository contains multiple projects, so root-level templates may be mistaken as applying to all projects. For now, they describe the active Lunaria work.
- Some existing docs may be slightly stale compared with the latest app implementation.
- Supabase production/local DB state may lag behind migrations in Git.
- Existing uncommitted documentation changes should be reviewed before broad cleanup.
