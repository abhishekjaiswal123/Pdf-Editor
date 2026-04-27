import { useEffect } from 'react';
import { useDocStore } from '../store/docStore';
import { EmptyState } from './EmptyState';
import { usePdfDocument } from '../pdf/usePdfDocument';
import { PageCanvas } from '../pdf/PageCanvas';
import { Toolbar } from '../tools/Toolbar';

export default function App() {
  const bytes = useDocStore((s) => s.bytes);
  const doc = usePdfDocument(bytes);
  const undo = useDocStore((s) => s.undo);
  const redo = useDocStore((s) => s.redo);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if (meta && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  if (!bytes || !doc) return <EmptyState />;
  return (
    <div className="flex flex-col h-full">
      <Toolbar onExport={() => alert('export not yet wired')} />
      <div className="flex-1 overflow-auto flex flex-col gap-4 items-center p-4">
        {Array.from({ length: doc.numPages }).map((_, i) => (
          <PageCanvas key={i} doc={doc} pageIndex={i} scale={1.25} />
        ))}
      </div>
    </div>
  );
}
