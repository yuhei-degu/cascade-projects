import { useState } from 'react';

const PLACEHOLDER = `Paste your raw notes here...

Tips — prefix lines to categorize them:
  Decision: We will migrate to OAuth 2.0
  Action: Update docs — @alice
  Follow-up: Confirm timeline with mobile team`;

export default function NoteForm({ onResult }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      onResult(data);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={10}
        className="w-full border border-gray-200 rounded-xl p-4 text-sm font-mono bg-white
                   resize-y focus:outline-none focus:ring-2 focus:ring-indigo-400
                   placeholder:text-gray-300 leading-relaxed"
      />

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium
                     hover:bg-indigo-700 active:scale-95 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing…' : 'Process note →'}
        </button>
        {text.length > 0 && (
          <span className="text-xs text-gray-400">{text.length} chars</span>
        )}
      </div>
    </form>
  );
}
