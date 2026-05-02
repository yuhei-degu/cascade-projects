# Lunaria Production Deploy Status

Last checked: 2026-05-02

## Current Finding

Lunaria code and Supabase data are ready enough for a production smoke test, but the current Vercel production deployments are not serving `lunaria-app`.

Both checked Vercel projects deploy successfully, but their build logs show the `certi-ai-hub` app being built from the current project root. The deployed routes do not include Lunaria routes such as `/gacha` or `/api/health`, and the fixed Vercel domains return Certi-AI Hub pages.

This means the current blocker is Vercel project routing/root-directory configuration, not a Lunaria application build failure.

## Verified

- `master` includes the production health endpoint commit.
- Local `lunaria-app` build passed after the health endpoint was added.
- Local `/api/health` returned `status: ok`.
- Supabase migrations through `012_gacha_content_v1` are applied.
- The default Lunaria user exists.
- The active gacha pool has 30 items.
- Gacha tables are present and RLS is enabled.
- `draw_gacha` and `grant_gacha_ticket` are not publicly executable; only privileged roles are expected.

## Vercel Blocker

Observed production deployments:

- `cascade-projects-lvq1`
- `cascade-projects`

Both production deployments are `READY`, but they build `certi-ai-hub@1.0.0`, not `lunaria`.

Risk: changing an existing Vercel project's root directory to `lunaria-app` may replace the currently served Certi-AI Hub production site. Do not repoint an existing production project unless that replacement is intentional.

## Recommended Path

Create a separate Vercel project for Lunaria with:

- Root Directory: `lunaria-app`
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Framework Preset: Next.js

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY` if Claude-backed paths are enabled later

After the new project deploys, run:

```powershell
cd C:\Users\yuuve\CascadeProjects\lunaria-app
npm run prod:check -- https://<lunaria-production-url>
```

## Claude Code Handoff Prompt

```text
Lunaria production deploy prep is blocked by Vercel project root configuration.

Context:
- Repo: C:\Users\yuuve\CascadeProjects
- App root: lunaria-app
- Current Vercel production projects build certi-ai-hub, not lunaria-app.
- Do not change existing Vercel production root settings unless explicitly asked, because that may replace the Certi-AI Hub site.
- A read-only self-check script exists at lunaria-app/scripts/prod-selfcheck.js and can be run with:
  cd C:\Users\yuuve\CascadeProjects\lunaria-app
  npm run prod:check -- https://<lunaria-production-url>

Task:
1. Review lunaria/PROD_DEPLOY_STATUS.md and lunaria/PROD_DEPLOY_RUNBOOK.md.
2. Produce a concise Vercel setup checklist for creating a new Lunaria-only Vercel project with Root Directory = lunaria-app.
3. Include the exact env var names, smoke test URL list, and rollback note.
4. Do not edit application code.
```
