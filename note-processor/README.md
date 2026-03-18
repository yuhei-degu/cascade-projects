# Note Processor

A minimal web app that turns messy raw notes into structured output — summaries, decisions, action items, and follow-ups. No AI API required; all parsing is rule-based.

Built with **Next.js** (Pages Router) · **SQLite** (`better-sqlite3`) · **Tailwind CSS**

---

## Features

- Paste raw notes → instantly see structured output
- Rule-based parser — deterministic, zero latency, no external calls
- SQLite persistence — history survives restarts
- Expandable history list with per-category badge counts
- Keyword guide footer so users know how to hint the parser

---

## Parser keyword reference

Lines are classified by prefix (case-insensitive):

| Prefix(es) | Category |
|---|---|
| `Decision:` · `Decided:` · line contains `"we decided"` / `"agreed to"` | Decisions |
| `Action:` · `Action item:` · `Todo:` · `- [ ]` | Action items |
| `Follow-up:` · `Follow up:` · `Next step:` | Follow-ups |
| Everything else | Summary |

Unrecognized lines are joined to form the summary (first 3 non-categorized lines, max 280 chars).

---

## Setup

### Prerequisites

- Node.js 18+
- npm

### 1. Install dependencies

```bash
cd note-processor
npm install
```

> `better-sqlite3` compiles a native addon. If it fails, ensure you have Python and a C++ compiler:
> - **macOS**: `xcode-select --install`
> - **Ubuntu/Debian**: `sudo apt install build-essential python3`
> - **Windows**: install "Desktop development with C++" via Visual Studio

### 2. Initialize the database

```bash
node db/init.js
# → ✓ Database ready at /path/to/note-processor/notes.db
```

### 3. (Optional) Load example notes

```bash
node db/seed.js
# → ✓ Seeded 3 example notes.
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API

### `POST /api/notes`

Parse and save a note.

**Request body**
```json
{ "raw_text": "Your messy note text here..." }
```

**Response (201)**
```json
{
  "id": 1,
  "raw_text": "...",
  "summary": "...",
  "decisions": ["..."],
  "action_items": ["..."],
  "follow_ups": ["..."],
  "created_at": "2026-03-14T10:00:00.000Z"
}
```

---

### `GET /api/notes`

Return all saved notes, newest first.

**Response (200)** — array of note objects (same shape as above).

---

## File structure

```
note-processor/
│
├── package.json           # npm dependencies and scripts
├── next.config.js         # Next.js config (minimal)
├── tailwind.config.js     # Tailwind content paths
├── postcss.config.js      # PostCSS / Tailwind plugin
├── README.md
│
├── pages/
│   ├── _app.js            # Global CSS import
│   ├── index.js           # Main UI page
│   └── api/
│       └── notes.js       # POST + GET /api/notes
│
├── components/
│   ├── NoteForm.js        # Textarea input + submit button
│   ├── NoteResult.js      # Displays latest structured result
│   └── NoteHistory.js     # Expandable list of past notes
│
├── lib/
│   └── parser.js          # Rule-based note parser (pure JS, no AI)
│
├── styles/
│   └── globals.css        # Tailwind base import
│
└── db/
    ├── init.js            # Schema creation + getDb() helper
    └── seed.js            # Loads 3 realistic example notes
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js in dev mode |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `node db/init.js` | Create/reset the database |
| `node db/seed.js` | Insert 3 example notes |
