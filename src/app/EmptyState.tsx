import { useEffect, useState } from 'react';
import { listDocuments } from '../persistence/documents';
import type { DocumentRow } from '../persistence/db';
import { useDocStore } from '../store/docStore';

export function EmptyState() {
  const [recent, setRecent] = useState<DocumentRow[]>([]);
  const open = useDocStore((s) => s.openFile);
  const openExisting = useDocStore((s) => s.openExisting);
  useEffect(() => { listDocuments().then(setRecent); }, []);

  return (
    <div className="max-w-xl mx-auto mt-24 text-center">
      <h1 className="text-3xl font-semibold mb-4">PDF Editor</h1>
      <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer">
        Open PDF
        <input type="file" accept="application/pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) open(f); }} />
      </label>
      {recent.length > 0 && (
        <>
          <h2 className="mt-10 mb-2 text-lg">Recent</h2>
          <ul className="text-left">
            {recent.map((r) => (
              <li key={r.id}>
                <button className="text-blue-700 hover:underline"
                  onClick={() => openExisting(r.id)}>{r.name}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
