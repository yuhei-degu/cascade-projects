# 1. Service Design — AI Dev Market

## Goal

Provide a fast, low-friction way to turn an ambiguous “I need a small dev thing” request into:

1) a clear estimate tier and delivery plan, then  
2) a paid delivery with a clean handoff.

The key product bet: **AI can do first-pass triage + prototype planning** well enough that a human reviewer can approve quickly.

## Target users

- **Non-technical operators**: want an internal tool, automation, or integration; can describe outcomes but not implementations.
- **PMs / founders**: need a quick prototype or scoped feature build.
- **Developers**: want small, bounded tasks done quickly (less common for MVP focus).

## Offer (MVP)

Request categories (MVP):
- Script (CLI / data processing / automation)
- Web mini-tool (single page or small app)
- API integration (Slack, LINE, Google Sheets, etc.)
- “Other” (requires clarification; often becomes a prototype plan only)

Budget bands (example):
- **Tier A**: small — fixed band
- **Tier B**: medium — fixed band
- **Tier C**: large/unclear — *estimate-only*, requires clarification and/or paid discovery

MVP deliverable types:
- Prototype plan (always available)
- Prototype artifact (A/B only; when safe)
- Final delivery (post-payment)

## Marketplace shape (MVP)

This MVP is closer to a **managed marketplace** than a fully open two-sided market:
- Users submit requests.
- AI generates an estimate + plan.
- Admin approves and manages delivery.

Provider matching is deferred; the “provider” can be an internal operator.

## User journey

1. **Submit request**
   - problem, desired outcome, constraints, deadline, budget band, optional links (repo, docs)
2. **AI triage**
   - assigns tier, risk flags, and clarification questions
3. **Prototype plan**
   - deliverables, assumptions, timeline, acceptance checks
4. **Admin review**
   - edits plan, decides: proceed / ask questions / decline
5. **User approval**
   - user confirms plan and scope
6. **Payment (test mode for now)**
7. **Delivery + handoff**
   - links + instructions + revision window

## Safety boundaries (MVP)

Hard stops / declines:
- secrets handling requests (“here’s my prod DB password…”)
- destructive operations (data deletion, irreversible migrations)
- illegal or harmful content
- production deploy requests without rollback plan

Rules of engagement:
- accept uploads/links as references, but avoid executing untrusted code in production contexts
- keep deliverables reversible and documented

## Success metrics (MVP)

Operational:
- median time from submission → estimate plan: < 30 minutes (human time)
- % requests that reach “approved plan”: > 50% (after clarifications)

Quality:
- plan acceptance rate after admin review: > 70%
- revision requests per delivery: ≤ 1–2 on average

Business (later):
- conversion to paid: baseline target 10–20% for early traffic

## Non-goals (for MVP)

- fully automated fulfillment without admin review
- open provider onboarding, ranking, dispute resolution
- production-grade billing, tax, compliance
