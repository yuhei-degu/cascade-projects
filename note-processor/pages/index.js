import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import NoteForm from '../components/NoteForm';
import NoteResult from '../components/NoteResult';
import NoteHistory from '../components/NoteHistory';

export default function Home() {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      setHistory(data.notes ?? data);
    } catch {
      // Non-critical — history just won't show
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  function handleResult(note) {
    setResult(note);
    setHistory(prev => [note, ...prev]);
  }

  return (
    <>
      <Head>
        <title>Note Processor</title>
        <meta name="description" content="Turn messy notes into structured summaries" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-baseline gap-3">
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
              Note Processor
            </h1>
            <span className="text-sm text-gray-400">
              Paste messy notes — get structured output
            </span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-8 space-y-10">
          <section>
            <SectionHeading>New note</SectionHeading>
            <NoteForm onResult={handleResult} />
          </section>

          {result && (
            <section>
              <SectionHeading>Result</SectionHeading>
              <NoteResult note={result} />
            </section>
          )}

          <section>
            <SectionHeading>
              History
              {history.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">
                  {history.length} note{history.length !== 1 ? 's' : ''}
                </span>
              )}
            </SectionHeading>

            {loadingHistory ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : (
              <NoteHistory notes={history} />
            )}
          </section>
        </main>

        <footer className="max-w-3xl mx-auto px-4 pb-12">
          <div className="border border-gray-200 rounded-xl bg-white px-5 py-4">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Parser keyword guide</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <LegendItem color="blue"  prefixes={['Decision:', 'Decided:', '"we decided"', '"agreed to"']} label="Decisions" />
              <LegendItem color="green" prefixes={['Action:', 'Action item:', 'Todo:', '- [ ]']}            label="Action items" />
              <LegendItem color="amber" prefixes={['Follow-up:', 'Follow up:', 'Next step:']}                label="Follow-ups" />
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
      {children}
    </h2>
  );
}

function LegendItem({ color, prefixes, label }) {
  const dot = { blue: 'bg-blue-400', green: 'bg-green-400', amber: 'bg-amber-400' };
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-2 h-2 rounded-full ${dot[color]}`} />
        <span className="font-semibold text-gray-600">{label}</span>
      </div>
      <ul className="space-y-0.5 pl-3.5">
        {prefixes.map(p => (
          <li key={p} className="font-mono text-gray-400">{p}</li>
        ))}
      </ul>
    </div>
  );
}
