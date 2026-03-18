const { createNote, listNotes } = require('./lib/notesRepository');

async function handler(req, res) {
  if (req.method === 'POST' && !req.headers['content-type']?.includes('application/json')) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }

  if (req.method === 'POST') {
    const raw = typeof req.body?.raw_text === 'string' ? req.body.raw_text : '';
    if (raw.length > 50000) {
      return res.status(413).json({ error: 'Note exceeds 50000 character limit.' });
    }
    const rawText = raw.trim();
    if (!rawText) {
      return res.status(400).json({ error: 'raw_text is required and must not be empty.' });
    }
    const result = await createNote(rawText);
    return res.status(201).json(result);
  }

  if (req.method === 'GET') {
    const page = req.query?.page;
    const { notes, total } = await listNotes(page);
    return res.status(200).json({ notes, total });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}

module.exports = handler;
