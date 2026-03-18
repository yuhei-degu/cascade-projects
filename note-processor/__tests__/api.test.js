/**
 * Tests for lib/notesRepository.js (and thus the API behaviour).
 *
 * We mock getDb/saveDb so the repository uses an in-memory sql.js database.
 */

const initSqlJs = require('sql.js');

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS notes (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_text          TEXT NOT NULL,
    summary           TEXT NOT NULL,
    decisions_json    TEXT NOT NULL,
    action_items_json TEXT NOT NULL,
    follow_ups_json   TEXT NOT NULL,
    created_at        TEXT NOT NULL
  )
`;

let mockDb;
let SQL;

jest.mock('../init', () => ({
  getDb: () => Promise.resolve(mockDb),
  saveDb: () => {},
}));

const { createNote, listNotes } = require('../lib/notesRepository');

beforeAll(async () => {
  SQL = await initSqlJs();
});

function createTestDb() {
  const db = new SQL.Database();
  db.run(CREATE_TABLE_SQL);
  return db;
}

function getRow(db, sql) {
  const result = db.exec(sql);
  if (!result || result.length === 0 || !result[0].values.length) return null;
  const { columns, values } = result[0];
  const obj = {};
  columns.forEach((col, i) => { obj[col] = values[0][i]; });
  return obj;
}

describe('notesRepository — createNote', () => {
  beforeEach(() => {
    mockDb = createTestDb();
  });
  afterEach(() => {
    if (mockDb) mockDb.close();
  });

  test('returns structured note with id on valid input', async () => {
    const result = await createNote('Team meeting\nDecision: Use OAuth');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.decisions)).toBe(true);
    expect(Array.isArray(result.action_items)).toBe(true);
    expect(Array.isArray(result.follow_ups)).toBe(true);
    expect(result).toHaveProperty('created_at');
  });

  test('parses decisions correctly', async () => {
    const result = await createNote('Decision: Ship on Friday');
    expect(result.decisions).toContain('Ship on Friday');
  });

  test('parses action items correctly', async () => {
    const result = await createNote('Action: Write the docs');
    expect(result.action_items).toContain('Write the docs');
  });

  test('parses follow-ups correctly', async () => {
    const result = await createNote('Follow-up: Check with mobile team');
    expect(result.follow_ups).toContain('Check with mobile team');
  });

  test('created_at is a valid ISO string', async () => {
    const result = await createNote('Some note');
    expect(() => new Date(result.created_at)).not.toThrow();
    expect(new Date(result.created_at).toISOString()).toBe(result.created_at);
  });

  test('persists note to the database', async () => {
    await createNote('Persisted note');
    const row = getRow(mockDb, 'SELECT * FROM notes WHERE id = 1');
    expect(row).toBeTruthy();
    expect(row.raw_text).toBe('Persisted note');
  });

  test('assigns autoincrement id starting from 1', async () => {
    const r1 = await createNote('Note one');
    expect(r1.id).toBe(1);
    const r2 = await createNote('Note two');
    expect(r2.id).toBe(2);
  });
});

describe('notesRepository — listNotes', () => {
  beforeEach(() => {
    mockDb = createTestDb();
  });
  afterEach(() => {
    if (mockDb) mockDb.close();
  });

  test('returns empty notes and total 0 when no notes exist', async () => {
    const result = await listNotes(0);
    expect(result.notes).toEqual([]);
    expect(result.total).toBe(0);
  });

  test('returns all notes and total after insertions', async () => {
    await createNote('Note A');
    await createNote('Note B');
    const result = await listNotes(0);
    expect(result.notes).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  test('returns notes in newest-first order', async () => {
    await createNote('First note');
    await createNote('Second note');
    const result = await listNotes(0);
    expect(result.notes[0].raw_text).toBe('Second note');
    expect(result.notes[1].raw_text).toBe('First note');
  });

  test('each note has decisions, action_items, follow_ups as arrays', async () => {
    await createNote('Action: Do something');
    const result = await listNotes(0);
    const note = result.notes[0];
    expect(Array.isArray(note.decisions)).toBe(true);
    expect(Array.isArray(note.action_items)).toBe(true);
    expect(Array.isArray(note.follow_ups)).toBe(true);
  });

  test('page=0 returns first page (max 50)', async () => {
    for (let i = 0; i < 60; i++) await createNote(`Note ${i}`);
    const result = await listNotes(0);
    expect(result.notes.length).toBe(50);
    expect(result.total).toBe(60);
  });

  test('page=1 returns next page', async () => {
    for (let i = 0; i < 60; i++) await createNote(`Note ${i}`);
    const result = await listNotes(1);
    expect(result.notes.length).toBe(10);
    expect(result.total).toBe(60);
  });
});
