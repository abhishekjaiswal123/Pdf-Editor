import { useState } from 'react';
import { usePdfDocument } from '../pdf/usePdfDocument';
import { PageCanvas } from '../pdf/PageCanvas';

export default function App() {
  const [bytes, setBytes] = useState<ArrayBuffer | null>(null);
  const doc = usePdfDocument(bytes);
  return (
    <div className="p-4">
      <input type="file" accept="application/pdf" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        setBytes(await f.arrayBuffer());
      }} />
      {doc && (
        <div className="mt-4 flex flex-col gap-4 items-center">
          {Array.from({ length: doc.numPages }).map((_, i) => (
            <PageCanvas key={i} doc={doc} pageIndex={i} scale={1.25} />
          ))}
        </div>
      )}
    </div>
  );
}
