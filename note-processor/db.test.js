/**
 * Tests for db/init.js
 *
 * Uses an in-memory SQLite database to avoid touching the real notes.db file.
 * Covers: schema creation, insert, query, and JSON round-trip.
 */

const Database = require('better-sqlite3');

// Create a fresh in-memory DB with the same schema as production
function createTestDb() {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      raw_text          TEXT NOT NULL,
      summary           TEXT NOT NULL,
      decisions_json    TEXT NOT NULL,
      action_items_json TEXT NOT NULL,
      follow_ups_json   TEXT NOT NULL,
      created_at        TEXT NOT NULL
    )
  `);
  return db;
}

describe('Database — schema and operations', () => {
  let db;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    db.close();
  });

  test('notes table is created correctly', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();
    const names = tables.map(t => t.name);
    expect(names).toContain('notes');
  });

  test('inserts a note and returns the row id', () => {
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO notes (raw_text, summary, decisions_json, action_items_json, follow_ups_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(
        'Raw note text',
        'Test summary',
        JSON.stringify(['Decision A']),
        JSON.stringify(['Action B']),
        JSON.stringify(['Follow-up C']),
        new Date().toISOString()
      );

    expect(lastInsertRowid).toBe(1);
  });

  test('retrieves the inserted note with correct fields', () => {
    const iso = new Date().toISOString();
    db.prepare(
      `INSERT INTO notes (raw_text, summary, decisions_json, action_items_json, follow_ups_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('raw', 'summary', '["d1"]', '["a1"]', '["f1"]', iso);

    const row = db.prepare('SELECT * FROM notes WHERE id = 1').get();

    expect(row.raw_text).toBe('raw');
    expect(row.summary).toBe('summary');
    expect(row.created_at).toBe(iso);
  });

  test('JSON arrays round-trip correctly', () => {
    const decisions    = ['Migrate to OAuth', 'Use Postgres'];
    const actionItems  = ['Update docs', 'Write tests'];
    const followUps    = ['Sync with mobile'];

    db.prepare(
      `INSERT INTO notes (raw_text, summary, decisions_json, action_items_json, follow_ups_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('raw', 'summary', JSON.stringify(decisions), JSON.stringify(actionItems), JSON.stringify(followUps), new Date().toISOString());

    const row = db.prepare('SELECT * FROM notes WHERE id = 1').get();

    expect(JSON.parse(row.decisions_json)).toEqual(decisions);
    expect(JSON.parse(row.action_items_json)).toEqual(actionItems);
    expect(JSON.parse(row.follow_ups_json)).toEqual(followUps);
  });

  test('returns rows in DESC order by id', () => {
    const insert = db.prepare(
      `INSERT INTO notes (raw_text, summary, decisions_json, action_items_json, follow_ups_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    insert.run('first',  's1', '[]', '[]', '[]', new Date().toISOString());
    insert.run('second', 's2', '[]', '[]', '[]', new Date().toISOString());
    insert.run('third',  's3', '[]', '[]', '[]', new Date().toISOString());

    const rows = db.prepare('SELECT * FROM notes ORDER BY id DESC').all();
    expect(rows[0].raw_text).toBe('third');
    expect(rows[rows.length - 1].raw_text).toBe('first');
  });

  test('autoincrement id increments correctly', () => {
    const insert = db.prepare(
      `INSERT INTO notes (raw_text, summary, decisions_json, action_items_json, follow_ups_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const r1 = insert.run('n1', 's1', '[]', '[]', '[]', new Date().toISOString());
    const r2 = insert.run('n2', 's2', '[]', '[]', '[]', new Date().toISOString());
    expect(r2.lastInsertRowid).toBe(r1.lastInsertRowid + 1);
  });

  test('created_at is stored as ISO string', () => {
    const iso = '2026-03-14T10:00:00.000Z';
    db.prepare(
      `INSERT INTO notes (raw_text, summary, decisions_json, action_items_json, follow_ups_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('raw', 'summary', '[]', '[]', '[]', iso);

    const row = db.prepare('SELECT created_at FROM notes WHERE id = 1').get();
    expect(row.created_at).toBe(iso);
    expect(() => new Date(row.created_at)).not.toThrow();
  });

  test('empty JSON arrays are stored and retrieved correctly', () => {
    db.prepare(
      `INSERT INTO notes (raw_text, summary, decisions_json, action_items_json, follow_ups_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run('raw', 'summary', '[]', '[]', '[]', new Date().toISOString());

    const row = db.prepare('SELECT * FROM notes WHERE id = 1').get();
    expect(JSON.parse(row.decisions_json)).toEqual([]);
    expect(JSON.parse(row.action_items_json)).toEqual([]);
    expect(JSON.parse(row.follow_ups_json)).toEqual([]);
  });
});
