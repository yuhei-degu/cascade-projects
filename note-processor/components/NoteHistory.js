import { useState } from 'react';

function CountBadge({ count, color }) {
  if (!count) return null;
  const styles = {
    blue:  'bg-blue-100  text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  return (
    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${styles[color]}`}>
      {count}
    </span>
  );
}

function BulletList({ items, color }) {
  const dotColor = { blue: 'bg-blue-400', green: 'bg-green-400', amber: 'bg-amber-400' };
  return (
    <ul className="space-y-1 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor[color]}`} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function HistoryItem({ note }) {
  const [open, setOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Row header — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3"
      >
        {/* Expand chevron */}
        <span className="mt-0.5 text-gray-300 text-xs flex-shrink-0 select-none">
          {open ? '▾' : '▸'}
        </span>

        {/* Summary + meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 truncate font-medium">{note.summary}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(note.created_at).toLocaleString()}
          </p>
        </div>

        {/* Category badge counts */}
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          <CountBadge count={note.decisions.length}    color="blue"  />
          <CountBadge count={note.action_items.length} color="green" />
          <CountBadge count={note.follow_ups.length}   color="amber" />
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-4">
          {note.decisions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase">Decisions</p>
              <BulletList items={note.decisions} color="blue" />
            </div>
          )}
          {note.action_items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase">Action items</p>
              <BulletList items={note.action_items} color="green" />
            </div>
          )}
          {note.follow_ups.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-600 uppercase">Follow-ups</p>
              <BulletList items={note.follow_ups} color="amber" />
            </div>
          )}

          {/* Raw note toggle */}
          <div className="pt-1">
            <button
              onClick={() => setShowRaw(r => !r)}
              className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
            >
              {showRaw ? 'Hide raw note' : 'Show raw note'}
            </button>
            {showRaw && (
              <pre className="mt-2 text-xs text-gray-500 font-mono whitespace-pre-wrap bg-white border border-gray-200 rounded-lg p-3 leading-relaxed">
                {note.raw_text}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NoteHistory({ notes }) {
  if (notes.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">
        No notes yet. Process your first note above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map(note => (
        <HistoryItem key={note.id} note={note} />
      ))}
    </div>
  );
}
