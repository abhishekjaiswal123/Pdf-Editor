import { useDocStore } from '../store/docStore';
import { putEdits } from './edits';

let timer: ReturnType<typeof setTimeout> | null = null;

export function startAutosave() {
  return useDocStore.subscribe((state) => {
    if (!state.docId) return;
    if (timer) clearTimeout(timer);
    const docId = state.docId;
    const edits = state.edits;
    const fills = state.formFills;
    timer = setTimeout(() => {
      putEdits(docId, edits, fills).catch((e) => console.error('autosave failed', e));
    }, 500);
  });
}
