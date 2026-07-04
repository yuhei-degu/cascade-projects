# 3. System Architecture — AI Dev Market

## MVP architecture (logical)

```
Browser (Requester/Admin)
  |
  | HTTPS
  v
Next.js (App Router)
  - UI routes (request, plan, admin)
  - API routes / server actions
  - Auth guards
  |
  +--> Supabase
  |     - Postgres (requests, plans, messages, payments)
  |     - Auth (requester/admin)
  |     - Storage (optional: artifacts)
  |
  +--> AI Providers (triage + plan generation)
  |     - Primary: OpenAI / Gemini (triage)
  |     - Optional: Claude (drafting copy / plan polish)
  |
  +--> Stripe (TEST MODE)
  |     - Checkout session
  |     - Webhook -> paid
  |
  +--> Email (Resend)
        - plan ready, payment received, delivery ready
```

## Key design choices

- **Managed marketplace first**: admin-in-the-loop avoids unsafe automation.
- **Tiering**: route Tier C into “estimate-only” to avoid overpromising.
- **State machine**: explicit request status transitions; log transitions.
- **Safety-first AI**: risk flags and secret detection gate the flow.

## Data model (minimum viable)

Tables (conceptual):

- `requests`
  - id, requester_id, title, description, category, budget_band, deadline_pref
  - status, created_at, updated_at
- `ai_triage`
  - request_id, tier, rationale, risk_flags (json), questions (json), created_at
- `prototype_plans`
  - request_id, plan_markdown, assumptions (json), timeline_band, price_band
  - version, created_at
- `messages`
  - request_id, sender_role, body_markdown, created_at
- `payments`
  - request_id, provider, checkout_session_id, status, amount, currency, created_at
- `deliveries`
  - request_id, artifacts (json), handoff_markdown, delivered_at

## Sequence: estimate-ready flow

1. Requester submits request → `requests.status=pending`
2. System runs triage → writes `ai_triage`, sets `reviewing`
3. System drafts `prototype_plans` → sets `plan_ready`
4. Admin edits/approves → sets `plan_sent`
5. Requester approves scope → sets `approved`

## Sequence: payment + delivery (test mode)

1. Admin triggers checkout creation → `payment_pending`
2. Stripe webhook confirms (idempotent) → `paid`
3. Admin attaches artifacts + handoff → `delivered` then `closed`

## Safety and guardrails

- Redact likely secrets (API keys, tokens) from stored content.
- Block “production deploy” paths in MVP; deliver artifacts for user-run.
- Require admin approval for:
  - Tier C
  - any risk flag
  - any request that implies destructive actions

## Observability (MVP)

Log events:
- `request.created`
- `triage.completed`
- `plan.generated`
- `status.changed`
- `payment.webhook_received`
- `delivery.sent`

Attach a correlation id per request for debugging.
