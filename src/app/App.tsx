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
import { exportPdf } from '../export/exportPdf';

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

  const onExport = async () => {
    const state = useDocStore.getState();
    if (!state.bytes || !doc) return;
    const scale = 1.25;
    const pageRenderInfo = [];
    for (let i = 0; i < doc.numPages; i++) {
      const page = await doc.getPage(i + 1);
      const viewport = page.getViewport({ scale });
      // window.__pageStages is populated by PageOverlay on mount; used here to
      // rasterize only the strokes/shapes layer without threading refs through the tree.
      const stage = window.__pageStages?.get(i);
      const layer = stage?.findOne('.strokes-layer') as any;
      const strokeImage = layer && typeof layer.toDataURL === 'function'
        ? layer.toDataURL({ pixelRatio: 1 })
        : null;
      pageRenderInfo.push({
        pageIndex: i, scale,
        pageHeight: viewport.height / scale,
        strokeImage,
      });
    }
    const out = await exportPdf({
      bytes: state.bytes.slice(0),
      edits: state.edits,
      formFills: state.formFills,
      pageRenderInfo,
    });
    const blob = new Blob([new Uint8Array(out)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.name.replace(/\.pdf$/i, '') + '-edited.pdf';
    a.click();
    URL.revokeObjectURL(url);
  };

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
      <Toolbar onExport={onExport} />
      {sigOpen && <SignatureModal onClose={() => setSigOpen(false)} onUse={(url) => setPendingSignature(url)} />}
      <div className="flex-1 overflow-auto flex flex-col gap-4 items-center p-4">
        {Array.from({ length: doc.numPages }).map((_, i) => (
          <PageView key={i} doc={doc} pageIndex={i} />
        ))}
      </div>
    </div>
  );
}
