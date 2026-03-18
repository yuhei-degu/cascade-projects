const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(process.cwd(), 'notes.db');

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS notes (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_text         TEXT NOT NULL,
    summary          TEXT NOT NULL,
    decisions_json   TEXT NOT NULL,
    action_items_json TEXT NOT NULL,
    follow_ups_json  TEXT NOT NULL,
    created_at       TEXT NOT NULL
  )
`;

let _db = null;
let _initPromise = null;

async function init() {
  if (_db) return _db;
  if (_initPromise) return _initPromise.then(() => _db);
  _initPromise = (async () => {
    const SQL = await initSqlJs();
    let buffer;
    try {
      buffer = fs.readFileSync(DB_PATH);
    } catch {
      buffer = null;
    }
    _db = buffer && buffer.length > 0 ? new SQL.Database(buffer) : new SQL.Database();
    _db.run(CREATE_TABLE_SQL);
    return _db;
  })();
  await _initPromise;
  return _db;
}

function getDb() {
  return init();
}

function saveDb() {
  if (!_db) return;
  const data = _db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, saveDb, DB_PATH };
