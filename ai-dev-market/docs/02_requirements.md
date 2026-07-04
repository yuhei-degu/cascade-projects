# 2. Requirements — AI Dev Market

## Roles

- **Requester**: submits a dev request, approves plan, pays, receives delivery.
- **Admin/Operator**: reviews AI output, manages status, delivers artifacts.
- **System**: AI triage, notifications, payment hooks (test mode).

## Core entities (conceptual)

- `Request`: submission data + status + tier
- `Clarification`: questions/answers
- `Estimate`: tier + price band + time band + assumptions
- `PrototypePlan`: deliverables + milestones + acceptance checks
- `Message`: chat thread items (admin ↔ requester)
- `Payment`: intent/session + status (test mode)
- `Delivery`: artifact links + handoff notes + revision log

## Functional requirements (MVP)

### F-01 Request intake

- Create request with:
  - title, description, desired outcome
  - category (script/web/api/other)
  - budget band + deadline preference
  - optional links (repo URL, docs URL)
- Validate inputs (length, URL shape).
- Store request and assign initial status `pending`.

### F-02 AI triage (estimate-ready)

- Generate:
  - tier (`A`/`B`/`C`)
  - complexity rationale (short)
  - risk flags (secrets, destructive ops, compliance)
  - clarification questions (0–5)
- If high-risk flags: force admin review before any plan is shown.

### F-03 Prototype plan generation

- Produce a plan with:
  - deliverables (what user will receive)
  - assumptions + out-of-scope bullets
  - timeline band (e.g., 1–3 days / 1 week)
  - acceptance checks (“done means…”)
- For Tier C: allow “plan-only” without prototype build.

### F-04 Admin review console

- Admin can:
  - view request + AI outputs
  - edit tier/price/time bands
  - edit plan text
  - change status (see workflow below)
  - send clarification questions to requester

### F-05 Requester approval

- Requester can:
  - review the plan
  - accept scope (approve)
  - request changes (sends message)

### F-06 Payment (test mode only)

- Create checkout session for approved plan.
- Update request/payment status via webhook.
- Explicitly block live-mode keys in CI/docs for this task.

### F-07 Delivery + revisions

- Admin can attach:
  - artifact links (zip/repo link/docs link)
  - handoff notes
- Support a limited revision loop (e.g., 1 revision window).

### F-08 Notifications (minimal)

- Email notifications for:
  - plan ready
  - payment received
  - delivery ready

## Workflow status model (MVP)

Recommended request status enum:

- `pending` — submitted, not yet triaged
- `reviewing` — AI triage in progress / admin reviewing
- `needs_clarification` — waiting for requester answers
- `plan_ready` — plan drafted
- `plan_sent` — plan sent to requester
- `approved` — requester approved plan
- `payment_pending` — awaiting payment
- `paid` — payment confirmed
- `delivered` — delivery sent
- `revision` — revision in progress
- `closed` — done / archived
- `rejected` — declined

## Non-functional requirements (MVP)

- **Security**
  - never store plaintext secrets from users; redact/strip if detected
  - principle of least privilege for admin vs requester
- **Reliability**
  - idempotent webhooks (payment)
  - safe retries for email/AI calls
- **Observability**
  - structured logs for AI calls, webhooks, state transitions
- **Cost controls**
  - cap AI tokens per request
  - cache/reuse triage results unless request changes

## Out of scope (explicit)

- public provider onboarding + matching marketplace
- multi-currency tax invoicing
- SLA guarantees
- production deployment automation
