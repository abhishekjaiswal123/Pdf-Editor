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
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-white sticky top-0 z-10">
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
