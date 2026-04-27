import { useEffect, useState } from 'react';
import { useDocStore } from '../store/docStore';
import { EmptyState } from './EmptyState';
import { usePdfDocument, type LoadedPdf } from '../pdf/usePdfDocument';
import { PageCanvas } from '../pdf/PageCanvas';
import { Toolbar } from '../tools/Toolbar';
import { PageOverlay } from '../overlay/PageOverlay';
import { SignatureModal } from '../signature/SignatureModal';
import { setPendingSignature, hasPendingSignature } from '../tools/handlers/signatureHandler';
import { useActiveTool } from '../tools/useActiveTool';
import { FormFieldOverlay } from '../forms/FormFieldOverlay';

function PageView({ doc, pageIndex }: { doc: LoadedPdf; pageIndex: number }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <div className="relative" style={{ width: size.w || undefined, height: size.h || undefined }}>
      <PageCanvas doc={doc} pageIndex={pageIndex} scale={1.25}
        onSize={(w, h) => setSize({ w, h })} />
      {size.w > 0 && <PageOverlay pageIndex={pageIndex} width={size.w} height={size.h} />}
      {size.w > 0 && <FormFieldOverlay pageIndex={pageIndex} scale={1.25} />}
    </div>
  );
}

export default function App() {
  const bytes = useDocStore((s) => s.bytes);
  const doc = usePdfDocument(bytes);
  const undo = useDocStore((s) => s.undo);
  const redo = useDocStore((s) => s.redo);
  const [sigOpen, setSigOpen] = useState(false);
  const tool = useActiveTool((s) => s.tool);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (meta && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  useEffect(() => {
    if (tool === 'signature' && !hasPendingSignature()) setSigOpen(true);
  }, [tool]);

  if (!bytes || !doc) return <EmptyState />;
  return (
    <div className="flex flex-col h-full">
      <Toolbar onExport={() => alert('export not yet wired')} />
      {sigOpen && <SignatureModal onClose={() => setSigOpen(false)} onUse={(url) => setPendingSignature(url)} />}
      <div className="flex-1 overflow-auto flex flex-col gap-4 items-center p-4">
        {Array.from({ length: doc.numPages }).map((_, i) => (
          <PageView key={i} doc={doc} pageIndex={i} />
        ))}
      </div>
    </div>
  );
}
