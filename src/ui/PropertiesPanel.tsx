import { useDocStore } from '../store/docStore';
import { useSelection } from '../store/selectionStore';

export function PropertiesPanel() {
  const id = useSelection((s) => s.id);
  const setId = useSelection((s) => s.setId);
  const e = useDocStore((s) => s.edits.find((x) => x.id === id));
  const update = useDocStore((s) => s.updateEdit);
  const remove = useDocStore((s) => s.removeEdit);
  if (!e) return null;
  return (
    <div className="border-b bg-yellow-50 px-3 py-2 flex gap-3 items-center">
      <span className="font-medium">{e.kind}</span>
      {e.kind === 'text' && (
        <label className="flex gap-1 items-center">
          Size
          <input type="number" min={6} max={96} value={e.fontSize}
            className="w-16 border rounded px-1"
            onChange={(ev) => update(e.id, { fontSize: Number(ev.target.value) } as any)} />
        </label>
      )}
      <button className="ml-auto px-2 py-1 bg-red-600 text-white rounded"
        onClick={() => { remove(e.id); setId(null); }}>Delete</button>
    </div>
  );
}
