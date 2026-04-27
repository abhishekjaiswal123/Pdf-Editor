import { useEffect, useState } from 'react';
import { listSignatures, deleteSignature } from '../persistence/signatures';
import type { SignatureRow } from '../persistence/db';

export function SavedTab({ onResult }: { onResult: (dataUrl: string) => void }) {
  const [rows, setRows] = useState<SignatureRow[]>([]);
  useEffect(() => { listSignatures().then(setRows); }, []);
  return (
    <div className="grid grid-cols-2 gap-2">
      {rows.map((r) => (
        <div key={r.id} className="border rounded p-2 flex flex-col gap-1">
          <img src={r.dataUrl} className="max-h-20 object-contain" />
          <div className="flex gap-2">
            <button className="text-blue-700" onClick={() => onResult(r.dataUrl)}>Use</button>
            <button className="text-red-600 ml-auto"
              onClick={async () => { await deleteSignature(r.id); setRows(rows.filter(x => x.id !== r.id)); }}>
              Delete
            </button>
          </div>
        </div>
      ))}
      {rows.length === 0 && <div className="text-neutral-500 col-span-2">No saved signatures yet.</div>}
    </div>
  );
}
