import { useEffect, useState } from 'react';
import { listDocuments } from '../persistence/documents';
import type { DocumentRow } from '../persistence/db';
import { useDocStore } from '../store/docStore';

function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(ts).toLocaleDateString();
}

export function EmptyState() {
  const [recent, setRecent] = useState<DocumentRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const open = useDocStore((s) => s.openFile);
  const openExisting = useDocStore((s) => s.openExisting);

  useEffect(() => {
    listDocuments().then((rows) =>
      setRecent([...rows].sort((a, b) => b.lastOpened - a.lastOpened)),
    );
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = Array.from(e.dataTransfer.files).find((x) => x.type === 'application/pdf');
    if (f) open(f);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-6xl flex flex-col lg:flex-row gap-8 p-6 lg:p-10">
        <aside className="lg:w-72 shrink-0">
          <h2 className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-3">
            Recent
          </h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-400">No recent files yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {recent.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => openExisting(r.id)}
                    title={r.name}
                    className="group w-full flex items-start gap-3 rounded-lg border border-transparent bg-white px-3 py-2.5 text-left shadow-sm hover:border-slate-200 hover:shadow transition"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800 group-hover:text-blue-700">
                        {r.name}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {timeAgo(r.lastOpened)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="w-full max-w-xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">PDF Editor</h1>
            <p className="mt-3 text-slate-500">
              Edit PDFs right in your browser. Nothing leaves your device.
            </p>

            <label
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={[
                'mt-8 flex flex-col items-center justify-center gap-3 cursor-pointer',
                'rounded-2xl border-2 border-dashed bg-white py-14 px-6 transition',
                dragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50',
              ].join(' ')}
            >
              <span aria-hidden className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </span>
              <span className="text-slate-700">
                <span className="font-medium">Drop a PDF here</span>
                <span className="text-slate-400"> or click to choose</span>
              </span>
              <span className="mt-2 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700">
                Open PDF
              </span>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) open(f);
                }}
              />
            </label>

            <p className="mt-6 text-xs text-slate-400">
              Files stay local — processed entirely in your browser.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
