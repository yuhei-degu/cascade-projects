/**
 * Rule-based note parser.
 *
 * Lines are classified by keyword prefix (case-insensitive):
 *   Decisions   → "Decision:", "Decided:", lines starting with "we decided" / "agreed to"
 *   Action items → "Action:", "Action item:", "Todo:", "- [ ]"
 *   Follow-ups  → "Follow-up:", "Follow up:", "Next step:"
 *   Everything else → used to build the summary
 *
 * The summary is the first 1–3 non-categorized lines, capped at 280 chars.
 */
function parseNote(rawText) {
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const decisions = [];
  const actionItems = [];
  const followUps = [];
  const other = [];

  for (const line of lines) {
    const lower = line.toLowerCase();

    if (
      /^(decision|decided):/.test(lower) ||
      /^we decided/.test(lower) ||
      /^agreed to/.test(lower)
    ) {
      decisions.push(line.replace(/^(decision|decided):\s*/i, '').trim());

    } else if (
      /^(action item|action|todo):/.test(lower) ||
      /^-\s*\[\s*\]/.test(lower)
    ) {
      actionItems.push(
        line
          .replace(/^(action item|action|todo):\s*/i, '')
          .replace(/^-\s*\[\s*\]\s*/, '')
          .trim()
      );

    } else if (/^(follow[\s-]?up|next step):/.test(lower)) {
      followUps.push(line.replace(/^(follow[\s-]?up|next step):\s*/i, '').trim());

    } else {
      other.push(line);
    }
  }

  const summarySource = other.length > 0 ? other : lines;
  const summary = summarySource
    .slice(0, 3)
    .join(' — ')
    .replace(/\s+/g, ' ')
    .slice(0, 280)
    .trim() || 'No summary available.';

  return { summary, decisions, actionItems, followUps };
}

module.exports = { parseNote };
