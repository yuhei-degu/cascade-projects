function Pill({ label, color }) {
  const styles = {
    blue:   'bg-blue-50   text-blue-700   border-blue-100',
    green:  'bg-green-50  text-green-700  border-green-100',
    amber:  'bg-amber-50  text-amber-700  border-amber-100',
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${styles[color]}`}>
      {label}
    </span>
  );
}

function Section({ title, items, color, emptyNote }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Pill label={title} color={color} />
        <span className="text-xs text-gray-400">{items.length} item{items.length !== 1 ? 's' : ''}</span>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 pl-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-300 italic pl-3">{emptyNote}</p>
      )}
    </div>
  );
}

export default function NoteResult({ note }) {
  if (!note) return null;

  const timestamp = new Date(note.created_at).toLocaleString();

  return (
    <div className="border border-indigo-100 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Processed output</span>
        <span className="text-xs text-gray-400">{timestamp}</span>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Summary */}
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Summary</p>
          <p className="text-sm text-gray-800 leading-relaxed">{note.summary}</p>
        </div>

        <hr className="border-gray-100" />

        {/* Structured sections */}
        <Section
          title="Decisions"
          items={note.decisions}
          color="blue"
          emptyNote="No decisions detected"
        />
        <Section
          title="Action items"
          items={note.action_items}
          color="green"
          emptyNote="No action items detected"
        />
        <Section
          title="Follow-ups"
          items={note.follow_ups}
          color="amber"
          emptyNote="No follow-ups detected"
        />

        {!note.decisions.length && !note.action_items.length && !note.follow_ups.length && (
          <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            Tip: prefix lines with <code className="font-mono">Decision:</code>, <code className="font-mono">Action:</code>, or <code className="font-mono">Follow-up:</code> to auto-categorize them.
          </p>
        )}
      </div>
    </div>
  );
}
