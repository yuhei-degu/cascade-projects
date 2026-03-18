const { getDb } = require('./init');
const { parseNote } = require('../lib/parser');

const EXAMPLES = [
  {
    raw_text: `Weekly engineering sync — March 14 2026

Decision: Migrate auth service to OAuth 2.0 by end of Q2
Decided: Deprecate the legacy /v1/users endpoint after June 30

Action: Update API docs with new auth flow — @yuhei
Action item: Write migration guide for existing integrations — @sarah
Todo: Add rate-limiting headers to all public endpoints — @tom
- [ ] Schedule security review with infra team

Follow-up: Confirm timeline with the mobile team
Follow up: Check if legacy tokens need a grace period

Velocity this sprint was solid. Discussed moving daily standups to async.
Team overall happy with the new deployment pipeline.`,
  },
  {
    raw_text: `Client call — Acme Corp product review

Agreed to extend the contract for 6 months, starting April 1.
We decided to add a dedicated support channel for their team.

Action item: Send revised SLA document by Friday — @mike
Action: Set up Slack connect channel — @ops

Next step: Introduce their new PM to our team
Follow-up: Review feature requests from their CTO notes

Budget has been approved on their end. They seem very satisfied with the current delivery pace.`,
  },
  {
    raw_text: `Ad-hoc brainstorm: new onboarding flow

Some rough ideas thrown around — nothing final yet.
The current 7-step flow has a 40% drop-off at step 3.

Decision: A/B test a 3-step condensed flow starting next sprint

Action: Design mockups for the condensed flow — @ux team
Todo: Pull drop-off analytics per step from Mixpanel — @data
Action item: Align with marketing on copy changes — @content

Follow-up: Revisit after 2 weeks of A/B data
Next step: Brief customer success team on the changes`,
  },
];

const db = getDb();

let count = 0;
for (const example of EXAMPLES) {
  const parsed = parseNote(example.raw_text);
  db.prepare(`
    INSERT INTO notes (raw_text, summary, decisions_json, action_items_json, follow_ups_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    example.raw_text,
    parsed.summary,
    JSON.stringify(parsed.decisions),
    JSON.stringify(parsed.actionItems),
    JSON.stringify(parsed.followUps),
    new Date(Date.now() - count * 3_600_000).toISOString() // stagger timestamps
  );
  count++;
}

console.log(`✓ Seeded ${EXAMPLES.length} example notes.`);
