/**
 * Tests for parser.js
 *
 * Covers:
 *  - decisions (Decision:, Decided:, "we decided", "agreed to" at line start)
 *  - action items (Action:, Action item:, Todo:, - [ ])
 *  - follow-ups (Follow-up:, Follow up:, Next step:)
 *  - summary generation
 *  - edge cases (empty, all-categorized, whitespace, case-insensitivity, long text)
 */

const { parseNote } = require('../parser');

// ── Decisions ────────────────────────────────────────────────────────────────

describe('parseNote — decisions', () => {
  test('parses "Decision:" prefix', () => {
    const { decisions } = parseNote('Decision: Use OAuth 2.0');
    expect(decisions).toEqual(['Use OAuth 2.0']);
  });

  test('parses "Decided:" prefix', () => {
    const { decisions } = parseNote('Decided: Ship on Friday');
    expect(decisions).toEqual(['Ship on Friday']);
  });

  test('parses line starting with "we decided"', () => {
    const { decisions } = parseNote('we decided to migrate the database');
    expect(decisions).toContain('we decided to migrate the database');
  });

  test('does not parse "we decided" when not at start of line', () => {
    const { decisions } = parseNote('Today we decided to migrate the database');
    expect(decisions).toEqual([]);
  });

  test('parses line starting with "agreed to"', () => {
    const { decisions } = parseNote('agreed to extend the deadline by one week');
    expect(decisions).toContain('agreed to extend the deadline by one week');
  });

  test('does not parse "agreed to" when not at start of line', () => {
    const { decisions } = parseNote('Team agreed to extend the deadline by one week');
    expect(decisions).toEqual([]);
  });

  test('is case-insensitive for prefix', () => {
    const { decisions } = parseNote('DECISION: Go with React');
    expect(decisions).toEqual(['Go with React']);
  });

  test('collects multiple decision lines', () => {
    const raw = `Decision: Use Postgres\nDecided: Remove legacy API`;
    const { decisions } = parseNote(raw);
    expect(decisions).toHaveLength(2);
  });
});

// ── Action items ─────────────────────────────────────────────────────────────

describe('parseNote — action items', () => {
  test('parses "Action:" prefix', () => {
    const { actionItems } = parseNote('Action: Update the docs');
    expect(actionItems).toEqual(['Update the docs']);
  });

  test('parses "Action item:" prefix', () => {
    const { actionItems } = parseNote('Action item: Write migration guide');
    expect(actionItems).toEqual(['Write migration guide']);
  });

  test('parses "Todo:" prefix', () => {
    const { actionItems } = parseNote('Todo: Add rate limiting');
    expect(actionItems).toEqual(['Add rate limiting']);
  });

  test('parses "- [ ]" checkbox syntax', () => {
    const { actionItems } = parseNote('- [ ] Schedule security review');
    expect(actionItems).toEqual(['Schedule security review']);
  });

  test('is case-insensitive for prefix', () => {
    const { actionItems } = parseNote('ACTION ITEM: Fix the login bug');
    expect(actionItems).toEqual(['Fix the login bug']);
  });

  test('collects multiple action item lines', () => {
    const raw = `Action: Write tests\nTodo: Update changelog\n- [ ] Deploy to staging`;
    const { actionItems } = parseNote(raw);
    expect(actionItems).toHaveLength(3);
  });
});

// ── Follow-ups ───────────────────────────────────────────────────────────────

describe('parseNote — follow-ups', () => {
  test('parses "Follow-up:" prefix', () => {
    const { followUps } = parseNote('Follow-up: Confirm timeline with mobile team');
    expect(followUps).toEqual(['Confirm timeline with mobile team']);
  });

  test('parses "Follow up:" (no hyphen) prefix', () => {
    const { followUps } = parseNote('Follow up: Check legacy token grace period');
    expect(followUps).toEqual(['Check legacy token grace period']);
  });

  test('parses "Next step:" prefix', () => {
    const { followUps } = parseNote('Next step: Introduce PM to the team');
    expect(followUps).toEqual(['Introduce PM to the team']);
  });

  test('is case-insensitive for prefix', () => {
    const { followUps } = parseNote('FOLLOW-UP: Review feature requests');
    expect(followUps).toEqual(['Review feature requests']);
  });

  test('collects multiple follow-up lines', () => {
    const raw = `Follow-up: Sync with design\nNext step: Brief CS team`;
    const { followUps } = parseNote(raw);
    expect(followUps).toHaveLength(2);
  });
});

// ── Summary generation ───────────────────────────────────────────────────────

describe('parseNote — summary', () => {
  test('uses first non-categorized line as summary base', () => {
    const { summary } = parseNote('Weekly engineering sync\nAction: Write tests');
    expect(summary).toContain('Weekly engineering sync');
  });

  test('joins up to 3 non-categorized lines with " — "', () => {
    const raw = `Line one\nLine two\nLine three\nLine four`;
    const { summary } = parseNote(raw);
    expect(summary).toBe('Line one — Line two — Line three');
  });

  test('caps summary at 280 characters', () => {
    const longLine = 'A'.repeat(300);
    const { summary } = parseNote(longLine);
    expect(summary.length).toBeLessThanOrEqual(280);
  });

  test('falls back to all lines when everything is categorized', () => {
    const raw = `Decision: Use Redis\nAction: Update config`;
    const { summary } = parseNote(raw);
    expect(summary.length).toBeGreaterThan(0);
    expect(summary.length).toBeGreaterThan(0);
  });

  test('returns "No summary available." for truly empty input after trim', () => {
    const { summary } = parseNote('   ');
    expect(summary).toBe('No summary available.');
  });

  test('strips extra internal whitespace', () => {
    const { summary } = parseNote('Hello   world');
    expect(summary).not.toMatch(/\s{2,}/);
  });
});

// ── Edge cases ───────────────────────────────────────────────────────────────

describe('parseNote — edge cases', () => {
  test('handles empty string', () => {
    const result = parseNote('');
    expect(result.decisions).toEqual([]);
    expect(result.actionItems).toEqual([]);
    expect(result.followUps).toEqual([]);
    expect(result.summary).toBe('No summary available.');
  });

  test('handles string with only blank lines', () => {
    const result = parseNote('\n\n\n');
    expect(result.summary).toBe('No summary available.');
  });

  test('handles mixed categorized and free text', () => {
    const raw = [
      'Team sync — March 14',
      'Decision: Migrate to OAuth',
      'Velocity was great this sprint.',
      'Action: Update API docs',
      'Follow-up: Sync with mobile',
    ].join('\n');

    const result = parseNote(raw);
    expect(result.decisions).toHaveLength(1);
    expect(result.actionItems).toHaveLength(1);
    expect(result.followUps).toHaveLength(1);
    expect(result.summary).toContain('Team sync');
  });

  test('strips leading/trailing whitespace from each item', () => {
    const { decisions } = parseNote('  Decision:   Spaces everywhere   ');
    expect(decisions[0]).toBe('Spaces everywhere');
  });

  test('does not cross-contaminate categories', () => {
    const raw = `Action: Do the thing\nDecision: Pick the option\nFollow-up: Check back in`;
    const { decisions, actionItems, followUps } = parseNote(raw);
    expect(decisions).toHaveLength(1);
    expect(actionItems).toHaveLength(1);
    expect(followUps).toHaveLength(1);
  });

  test('returns arrays (not undefined) even when categories are empty', () => {
    const result = parseNote('Just a plain sentence.');
    expect(Array.isArray(result.decisions)).toBe(true);
    expect(Array.isArray(result.actionItems)).toBe(true);
    expect(Array.isArray(result.followUps)).toBe(true);
  });
});
