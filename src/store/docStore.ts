import { create } from 'zustand';
import type { DocState, Edit, FormFill } from './types';
import { createUndoStack } from './undoStack';

const stack = createUndoStack(100);

type Actions = {
  reset: () => void;
  loadDoc: (p: { docId: string; name: string; bytes: ArrayBuffer; edits?: Edit[]; formFills?: FormFill[] }) => void;
  addEdit: (e: Edit) => void;
  updateEdit: (id: string, patch: Partial<Edit>) => void;
  removeEdit: (id: string) => void;
  setFormFill: (fill: FormFill) => void;
  undo: () => void;
  redo: () => void;
  openFile: (file: File) => Promise<void>;
  openExisting: (docId: string) => Promise<void>;
};

const initial: DocState = { docId: null, name: '', bytes: null, edits: [], formFills: [] };

export const useDocStore = create<DocState & Actions>((set, get) => ({
  ...initial,
  reset: () => { stack.clear(); set(initial); },
  loadDoc: ({ docId, name, bytes, edits = [], formFills = [] }) => {
    stack.clear();
    set({ docId, name, bytes, edits, formFills });
  },
  addEdit: (e) => {
    const apply = () => set((s) => ({ edits: [...s.edits, e] }));
    const revert = () => set((s) => ({ edits: s.edits.filter((x) => x.id !== e.id) }));
    apply();
    stack.push({ do: apply, undo: revert });
  },
  updateEdit: (id, patch) => {
    const before = get().edits.find((x) => x.id === id);
    if (!before) return;
    const apply = () => set((s) => ({
      edits: s.edits.map((x) => (x.id === id ? ({ ...x, ...patch } as Edit) : x)),
    }));
    const revert = () => set((s) => ({
      edits: s.edits.map((x) => (x.id === id ? before : x)),
    }));
    apply();
    stack.push({ do: apply, undo: revert });
  },
  removeEdit: (id) => {
    const before = get().edits.find((x) => x.id === id);
    if (!before) return;
    const apply = () => set((s) => ({ edits: s.edits.filter((x) => x.id !== id) }));
    const revert = () => set((s) => ({ edits: [...s.edits, before] }));
    apply();
    stack.push({ do: apply, undo: revert });
  },
  setFormFill: (fill) => set((s) => {
    const others = s.formFills.filter((f) => f.fieldName !== fill.fieldName);
    return { formFills: [...others, fill] };
  }),
  undo: () => stack.undo(),
  redo: () => stack.redo(),
  openFile: async (file: File) => {
    const { putDocument } = await import('../persistence/documents');
    const { getEdits } = await import('../persistence/edits');
    const bytes = await file.arrayBuffer();
    const docId = crypto.randomUUID();
    await putDocument({ id: docId, name: file.name, originalBytes: bytes, lastOpened: Date.now() });
    const existing = await getEdits(docId);
    get().loadDoc({ docId, name: file.name, bytes, edits: existing?.edits ?? [], formFills: existing?.formFills ?? [] });
  },
  openExisting: async (docId: string) => {
    const { getDocument } = await import('../persistence/documents');
    const { getEdits } = await import('../persistence/edits');
    const row = await getDocument(docId);
    if (!row) return;
    const existing = await getEdits(docId);
    get().loadDoc({
      docId, name: row.name, bytes: row.originalBytes,
      edits: existing?.edits ?? [], formFills: existing?.formFills ?? [],
    });
  },
}));
