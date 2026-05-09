import { useActiveTool } from './useActiveTool';
import type { Tool } from './types';
import { useDocStore } from '../store/docStore';

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'text', label: 'Text' },
  { id: 'pen', label: 'Pen' },
  { id: 'highlight', label: 'Highlight' },
  { id: 'rect', label: 'Rect' },
  { id: 'image', label: 'Image' },
  { id: 'signature', label: 'Signature' },
];

export function Toolbar({ onExport }: { onExport: () => void }) {
  const tool = useActiveTool((s) => s.tool);
  const setTool = useActiveTool((s) => s.setTool);
  const undo = useDocStore((s) => s.undo);
  const redo = useDocStore((s) => s.redo);
  const reset = useDocStore((s) => s.reset);
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-white sticky top-0 z-10">
      <button
        className="flex items-center gap-1.5 px-2 py-1 border rounded hover:bg-slate-50"
        onClick={reset}
        title="Back to home"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
      </button>
      <span className="mx-1 text-neutral-300">|</span>
      <button className="px-2 py-1 border rounded" onClick={undo}>Undo</button>
      <button className="px-2 py-1 border rounded" onClick={redo}>Redo</button>
      <span className="mx-2 text-neutral-400">|</span>
      {TOOLS.map((t) => (
        <button key={t.id}
          className={`px-2 py-1 rounded ${tool === t.id ? 'bg-blue-600 text-white' : 'border'}`}
          onClick={() => setTool(t.id)}>
          {t.label}
        </button>
      ))}
      <span className="ml-auto" />
      <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={onExport}>Export PDF</button>
    </div>
  );
}
