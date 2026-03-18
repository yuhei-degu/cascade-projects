const { getDb, saveDb } = require('../init');
const { parseNote } = require('../parser');

const PAGE_SIZE = 50;

function safeParseArray(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

function rowsFromExec(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

async function createNote(rawText) {
  const db = await getDb();
  const { summary, decisions, actionItems, followUps } = parseNote(rawText);
  const created_at = new Date().toISOString();

  db.run(
    `INSERT INTO notes (raw_text, summary, decisions_json, action_items_json, follow_ups_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      rawText,
      summary,
      JSON.stringify(decisions),
      JSON.stringify(actionItems),
      JSON.stringify(followUps),
      created_at,
    ]
  );

  const idResult = db.exec('SELECT last_insert_rowid() as id');
  const lastInsertRowid = idResult[0].values[0][0];

  saveDb();

  return {
    id: lastInsertRowid,
    raw_text: rawText,
    summary,
    decisions,
    action_items: actionItems,
    follow_ups: followUps,
    created_at,
  };
}

async function listNotes(page) {
  const db = await getDb();
  const pageIndex = Math.max(0, parseInt(page, 10) || 0);
  const offset = pageIndex * PAGE_SIZE;

  const countResult = db.exec('SELECT COUNT(*) as n FROM notes');
  const total = countResult[0].values[0][0];

  const selectResult = db.exec(
    `SELECT * FROM notes ORDER BY id DESC LIMIT ${PAGE_SIZE} OFFSET ${offset}`
  );
  const rows = rowsFromExec(selectResult);

  const notes = rows.map((row) => ({
    id: row.id,
    raw_text: row.raw_text,
    summary: row.summary,
    decisions: safeParseArray(row.decisions_json),
    action_items: safeParseArray(row.action_items_json),
    follow_ups: safeParseArray(row.follow_ups_json),
    created_at: row.created_at,
  }));

  return { notes, total };
}

module.exports = { createNote, listNotes };
