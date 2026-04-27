# PDF Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully client-side React web app that opens a PDF, edits it (text, freehand/highlight/shapes, images, signatures, form fields), persists in-progress work to IndexedDB, and exports an edited PDF.

**Architecture:** Vite + React + TypeScript SPA. Per-page rendering uses PDF.js as a read-only canvas with a Konva overlay for all edits. Edits are stored as structured objects in a Zustand store, persisted to IndexedDB via `idb`, and merged into the original PDF bytes by `pdf-lib` only at export time. Signatures are rasterized PNGs treated as image edits.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind, pdfjs-dist, pdf-lib, react-konva, signature_pad, idb, Zustand, Vitest, React Testing Library.

---

## File Structure

```
pdf-editor/
  package.json
  vite.config.ts
  tsconfig.json
  tailwind.config.js
  postcss.config.js
  index.html
  src/
    main.tsx                     # React entry
    app/
      App.tsx                    # top-level shell
      EmptyState.tsx             # recent docs + open file
    store/
      types.ts                   # Edit, FormFill, Command, DocState types
      docStore.ts                # Zustand store + actions
      undoStack.ts               # command-stack helpers
    persistence/
      db.ts                      # idb setup, schema, version
      documents.ts               # CRUD for documents store
      edits.ts                   # CRUD for edits store
      signatures.ts              # CRUD for signatures store
      autosave.ts                # debounced subscription glue
    pdf/
      usePdfDocument.ts          # load pdfjs-dist doc from bytes
      PageCanvas.tsx             # renders one page to <canvas>
    overlay/
      PageOverlay.tsx            # Konva Stage for one page
      nodes/
        TextNode.tsx
        ImageNode.tsx
        StrokeNode.tsx
        ShapeNode.tsx
    tools/
      types.ts                   # Tool union, ToolContext
      useActiveTool.ts           # tool selection state hook
      Toolbar.tsx                # tool strip UI
      handlers/
        textHandler.ts
        penHandler.ts
        highlightHandler.ts
        rectHandler.ts
        imageHandler.ts
        signatureHandler.ts
    signature/
      SignatureModal.tsx         # tabs container
      DrawTab.tsx                # signature_pad
      UploadTab.tsx              # luminance threshold
      SavedTab.tsx               # list + select
      stripWhite.ts              # luminance-threshold helper
    forms/
      detectFields.ts            # pdf-lib form-field reader
      FormFieldOverlay.tsx       # absolute-positioned native inputs
    export/
      coords.ts                  # toPdfCoords helper
      exportPdf.ts               # main pipeline
    ui/
      Button.tsx
      Modal.tsx
      Sidebar.tsx                # page thumbnails
      PropertiesPanel.tsx
  tests/
    coords.test.ts
    undoStack.test.ts
    persistence.test.ts
    stripWhite.test.ts
    edits-reducer.test.ts
    exportPdf.test.ts
```

---

## Task 1: Scaffold project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/app/App.tsx`, `.gitignore`

- [ ] **Step 1: Initialize Vite + React + TS template**

```bash
cd /Users/abhishek/work/pdf-editor
npm create vite@latest . -- --template react-ts
```
When prompted "Current directory is not empty", choose **Ignore files and continue**.

- [ ] **Step 2: Install runtime deps**

```bash
npm install pdfjs-dist pdf-lib react-konva konva signature_pad idb zustand
```

- [ ] **Step 3: Install dev deps**

```bash
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom jsdom fake-indexeddb
npx tailwindcss init -p
```

- [ ] **Step 4: Configure Tailwind**

Replace `tailwind.config.js` with:
```js
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

Replace `src/index.css` with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { @apply bg-neutral-100 text-neutral-900; }
```

- [ ] **Step 5: Add Vitest config**

Append to `vite.config.ts`:
```ts
/// <reference types="vitest" />
```
And add `test` block in `defineConfig`:
```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./tests/setup.ts'],
  globals: true,
},
```

Create `tests/setup.ts`:
```ts
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';
```

- [ ] **Step 6: Replace `src/App.tsx` with stub**

```tsx
export default function App() {
  return <div className="p-8 text-2xl">PDF Editor</div>;
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```
Expected: Vite prints a localhost URL with no errors. Stop with Ctrl-C.

- [ ] **Step 8: Verify tests run**

```bash
npm run test -- --run
```
Expected: "No test files found" or 0 tests passing — exit 0.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite+react+ts+tailwind+vitest"
```

---

## Task 2: Core types and Zustand store

**Files:**
- Create: `src/store/types.ts`, `src/store/docStore.ts`, `src/store/undoStack.ts`
- Test: `tests/edits-reducer.test.ts`, `tests/undoStack.test.ts`

- [ ] **Step 1: Write the failing tests for the undo stack**

Create `tests/undoStack.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { createUndoStack } from '../src/store/undoStack';

describe('undoStack', () => {
  it('pushes, undoes, redoes', () => {
    const log: string[] = [];
    const s = createUndoStack(100);
    s.push({ do: () => log.push('do1'), undo: () => log.push('undo1') });
    s.push({ do: () => log.push('do2'), undo: () => log.push('undo2') });
    s.undo(); // undo2
    s.undo(); // undo1
    s.redo(); // do1
    expect(log).toEqual(['undo2', 'undo1', 'do1']);
  });

  it('caps at max entries', () => {
    const s = createUndoStack(2);
    s.push({ do: () => {}, undo: () => {} });
    s.push({ do: () => {}, undo: () => {} });
    s.push({ do: () => {}, undo: () => {} });
    expect(s.size()).toBe(2);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

```bash
npm run test -- --run tests/undoStack.test.ts
```
Expected: cannot find module.

- [ ] **Step 3: Implement `src/store/undoStack.ts`**

```ts
export type Command = { do: () => void; undo: () => void };

export function createUndoStack(max: number) {
  let past: Command[] = [];
  let future: Command[] = [];
  return {
    push(c: Command) {
      past.push(c);
      if (past.length > max) past.shift();
      future = [];
    },
    undo() {
      const c = past.pop();
      if (!c) return;
      c.undo();
      future.push(c);
    },
    redo() {
      const c = future.pop();
      if (!c) return;
      c.do();
      past.push(c);
    },
    size: () => past.length,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    clear() { past = []; future = []; },
  };
}
```

- [ ] **Step 4: Verify undoStack tests pass**

```bash
npm run test -- --run tests/undoStack.test.ts
```
Expected: 2 passing.

- [ ] **Step 5: Define types in `src/store/types.ts`**

```ts
export type EditBase = { id: string; pageIndex: number };

export type TextEdit = EditBase & {
  kind: 'text';
  x: number; y: number;
  text: string;
  fontSize: number;
  color: string;
};

export type ImageEdit = EditBase & {
  kind: 'image';
  x: number; y: number; w: number; h: number; rotation: number;
  dataUrl: string;
  isSignature?: boolean;
};

export type StrokeEdit = EditBase & {
  kind: 'stroke';
  points: number[]; // flat [x,y,x,y,...]
  color: string;
  width: number;
  opacity: number;
};

export type ShapeEdit = EditBase & {
  kind: 'shape';
  type: 'rect' | 'line';
  x: number; y: number; w: number; h: number;
  stroke: string; fill: string | null;
};

export type Edit = TextEdit | ImageEdit | StrokeEdit | ShapeEdit;

export type FormFill = { fieldName: string; value: string | boolean };

export type DocState = {
  docId: string | null;
  name: string;
  bytes: ArrayBuffer | null;
  edits: Edit[];
  formFills: FormFill[];
};
```

- [ ] **Step 6: Write failing test for store reducers**

Create `tests/edits-reducer.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useDocStore } from '../src/store/docStore';

describe('docStore', () => {
  beforeEach(() => useDocStore.getState().reset());

  it('adds an edit', () => {
    useDocStore.getState().addEdit({
      id: 'e1', pageIndex: 0, kind: 'text',
      x: 10, y: 20, text: 'hi', fontSize: 16, color: '#000',
    });
    expect(useDocStore.getState().edits).toHaveLength(1);
  });

  it('updates an edit', () => {
    useDocStore.getState().addEdit({
      id: 'e1', pageIndex: 0, kind: 'text',
      x: 10, y: 20, text: 'hi', fontSize: 16, color: '#000',
    });
    useDocStore.getState().updateEdit('e1', { x: 99 });
    const e = useDocStore.getState().edits[0];
    expect(e.kind === 'text' && e.x).toBe(99);
  });

  it('removes an edit', () => {
    useDocStore.getState().addEdit({
      id: 'e1', pageIndex: 0, kind: 'text',
      x: 0, y: 0, text: '', fontSize: 16, color: '#000',
    });
    useDocStore.getState().removeEdit('e1');
    expect(useDocStore.getState().edits).toHaveLength(0);
  });

  it('undo restores a removed edit', () => {
    const e = { id: 'e1', pageIndex: 0, kind: 'text' as const,
      x: 0, y: 0, text: 't', fontSize: 16, color: '#000' };
    useDocStore.getState().addEdit(e);
    useDocStore.getState().removeEdit('e1');
    useDocStore.getState().undo();
    expect(useDocStore.getState().edits).toHaveLength(1);
  });
});
```

- [ ] **Step 7: Run, verify FAIL**

```bash
npm run test -- --run tests/edits-reducer.test.ts
```

- [ ] **Step 8: Implement `src/store/docStore.ts`**

```ts
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
}));
```

- [ ] **Step 9: Verify all tests pass**

```bash
npm run test -- --run
```
Expected: 6 passing.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(store): edit types, zustand doc store, undo/redo"
```

---

## Task 3: IndexedDB persistence

**Files:**
- Create: `src/persistence/db.ts`, `src/persistence/documents.ts`, `src/persistence/edits.ts`, `src/persistence/signatures.ts`
- Test: `tests/persistence.test.ts`

- [ ] **Step 1: Write failing persistence test**

Create `tests/persistence.test.ts`:
```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { putDocument, getDocument, listDocuments } from '../src/persistence/documents';
import { putEdits, getEdits } from '../src/persistence/edits';
import { putSignature, listSignatures } from '../src/persistence/signatures';

describe('persistence', () => {
  beforeEach(async () => {
    indexedDB.deleteDatabase('pdf-editor');
  });

  it('roundtrips a document', async () => {
    const bytes = new Uint8Array([1,2,3]).buffer;
    await putDocument({ id: 'd1', name: 'a.pdf', originalBytes: bytes, lastOpened: 1 });
    const got = await getDocument('d1');
    expect(got?.name).toBe('a.pdf');
    expect(new Uint8Array(got!.originalBytes)[0]).toBe(1);
  });

  it('lists documents most-recent first', async () => {
    await putDocument({ id: 'a', name: 'a', originalBytes: new ArrayBuffer(0), lastOpened: 1 });
    await putDocument({ id: 'b', name: 'b', originalBytes: new ArrayBuffer(0), lastOpened: 2 });
    const list = await listDocuments();
    expect(list.map(d => d.id)).toEqual(['b', 'a']);
  });

  it('roundtrips edits', async () => {
    await putEdits('d1', [{ id: 'e1', pageIndex: 0, kind: 'text', x:0,y:0,text:'',fontSize:16,color:'#000' }], []);
    const got = await getEdits('d1');
    expect(got?.edits).toHaveLength(1);
  });

  it('roundtrips signatures', async () => {
    await putSignature({ id: 's1', dataUrl: 'data:image/png;base64,xx', createdAt: 1 });
    const list = await listSignatures();
    expect(list).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

```bash
npm run test -- --run tests/persistence.test.ts
```

- [ ] **Step 3: Implement `src/persistence/db.ts`**

```ts
import { openDB, type IDBPDatabase } from 'idb';
import type { Edit, FormFill } from '../store/types';

export type DocumentRow = { id: string; name: string; originalBytes: ArrayBuffer; lastOpened: number };
export type EditsRow = { docId: string; edits: Edit[]; formFills: FormFill[] };
export type SignatureRow = { id: string; dataUrl: string; createdAt: number };

let dbp: Promise<IDBPDatabase> | null = null;
export function db() {
  if (!dbp) {
    dbp = openDB('pdf-editor', 1, {
      upgrade(d) {
        d.createObjectStore('documents', { keyPath: 'id' });
        d.createObjectStore('edits', { keyPath: 'docId' });
        d.createObjectStore('signatures', { keyPath: 'id' });
      },
    });
  }
  return dbp;
}
```

- [ ] **Step 4: Implement `src/persistence/documents.ts`**

```ts
import { db, type DocumentRow } from './db';

export async function putDocument(row: DocumentRow) {
  await (await db()).put('documents', row);
}
export async function getDocument(id: string): Promise<DocumentRow | undefined> {
  return (await db()).get('documents', id);
}
export async function listDocuments(): Promise<DocumentRow[]> {
  const all = (await (await db()).getAll('documents')) as DocumentRow[];
  return all.sort((a, b) => b.lastOpened - a.lastOpened);
}
```

- [ ] **Step 5: Implement `src/persistence/edits.ts`**

```ts
import { db, type EditsRow } from './db';
import type { Edit, FormFill } from '../store/types';

export async function putEdits(docId: string, edits: Edit[], formFills: FormFill[]) {
  await (await db()).put('edits', { docId, edits, formFills });
}
export async function getEdits(docId: string): Promise<EditsRow | undefined> {
  return (await db()).get('edits', docId);
}
```

- [ ] **Step 6: Implement `src/persistence/signatures.ts`**

```ts
import { db, type SignatureRow } from './db';

export async function putSignature(row: SignatureRow) {
  await (await db()).put('signatures', row);
}
export async function listSignatures(): Promise<SignatureRow[]> {
  const all = (await (await db()).getAll('signatures')) as SignatureRow[];
  return all.sort((a, b) => b.createdAt - a.createdAt);
}
export async function deleteSignature(id: string) {
  await (await db()).delete('signatures', id);
}
```

- [ ] **Step 7: Verify tests pass**

```bash
npm run test -- --run tests/persistence.test.ts
```
Expected: 4 passing.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(persistence): idb stores for documents, edits, signatures"
```

---

## Task 4: Autosave glue

**Files:**
- Create: `src/persistence/autosave.ts`

- [ ] **Step 1: Implement debounced autosave subscription**

```ts
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
```

- [ ] **Step 2: Wire into main**

Modify `src/main.tsx` — add after React render:
```ts
import { startAutosave } from './persistence/autosave';
startAutosave();
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(persistence): debounced autosave to indexeddb"
```

---

## Task 5: PDF.js page rendering

**Files:**
- Create: `src/pdf/usePdfDocument.ts`, `src/pdf/PageCanvas.tsx`

- [ ] **Step 1: Configure pdfjs worker**

Create `src/pdf/usePdfDocument.ts`:
```ts
import { useEffect, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export type LoadedPdf = pdfjs.PDFDocumentProxy;

export function usePdfDocument(bytes: ArrayBuffer | null) {
  const [doc, setDoc] = useState<LoadedPdf | null>(null);
  useEffect(() => {
    if (!bytes) { setDoc(null); return; }
    let cancelled = false;
    (async () => {
      const loaded = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
      if (!cancelled) setDoc(loaded);
    })();
    return () => { cancelled = true; };
  }, [bytes]);
  return doc;
}
```

- [ ] **Step 2: Implement `src/pdf/PageCanvas.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import type { LoadedPdf } from './usePdfDocument';

type Props = { doc: LoadedPdf; pageIndex: number; scale: number; onSize?: (w: number, h: number) => void };

export function PageCanvas({ doc, pageIndex, scale, onSize }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale });
      const canvas = ref.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d')!;
      await page.render({ canvasContext: ctx, viewport }).promise;
      onSize?.(viewport.width, viewport.height);
    })();
    return () => { cancelled = true; };
  }, [doc, pageIndex, scale, onSize]);

  return <canvas ref={ref} className="block shadow-md bg-white" />;
}
```

- [ ] **Step 3: Smoke-test in App**

Replace `src/app/App.tsx`:
```tsx
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
```

Update `src/main.tsx` to import `App` from `./app/App`.

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```
Open localhost URL. Upload any PDF. Pages should render.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(pdf): pdfjs page rendering"
```

---

## Task 6: Document loading & opening

**Files:**
- Create: `src/app/EmptyState.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add `openFile` helper to docStore**

In `src/store/docStore.ts`, add to actions:
```ts
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
```
Also add the corresponding signatures to the `Actions` type.

- [ ] **Step 2: Create `src/app/EmptyState.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { listDocuments, type DocumentRow } from '../persistence/documents';
import { useDocStore } from '../store/docStore';

export function EmptyState() {
  const [recent, setRecent] = useState<DocumentRow[]>([]);
  const open = useDocStore((s) => s.openFile);
  const openExisting = useDocStore((s) => s.openExisting);
  useEffect(() => { listDocuments().then(setRecent); }, []);

  return (
    <div className="max-w-xl mx-auto mt-24 text-center">
      <h1 className="text-3xl font-semibold mb-4">PDF Editor</h1>
      <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer">
        Open PDF
        <input type="file" accept="application/pdf" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) open(f); }} />
      </label>
      {recent.length > 0 && (
        <>
          <h2 className="mt-10 mb-2 text-lg">Recent</h2>
          <ul className="text-left">
            {recent.map((r) => (
              <li key={r.id}>
                <button className="text-blue-700 hover:underline"
                  onClick={() => openExisting(r.id)}>{r.name}</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Wire into `App.tsx`**

```tsx
import { useDocStore } from '../store/docStore';
import { EmptyState } from './EmptyState';
import { usePdfDocument } from '../pdf/usePdfDocument';
import { PageCanvas } from '../pdf/PageCanvas';

export default function App() {
  const bytes = useDocStore((s) => s.bytes);
  const doc = usePdfDocument(bytes);
  if (!bytes || !doc) return <EmptyState />;
  return (
    <div className="flex flex-col gap-4 items-center p-4">
      {Array.from({ length: doc.numPages }).map((_, i) => (
        <PageCanvas key={i} doc={doc} pageIndex={i} scale={1.25} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Smoke test**

Open app, upload PDF, refresh — recent list shows it; clicking restores it.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(app): empty state with recent docs"
```

---

## Task 7: Tool selection state and toolbar

**Files:**
- Create: `src/tools/types.ts`, `src/tools/useActiveTool.ts`, `src/tools/Toolbar.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: `src/tools/types.ts`**

```ts
export type Tool = 'select' | 'text' | 'pen' | 'highlight' | 'rect' | 'image' | 'signature';
```

- [ ] **Step 2: `src/tools/useActiveTool.ts`**

```ts
import { create } from 'zustand';
import type { Tool } from './types';

type S = { tool: Tool; setTool: (t: Tool) => void };
export const useActiveTool = create<S>((set) => ({
  tool: 'select',
  setTool: (tool) => set({ tool }),
}));
```

- [ ] **Step 3: `src/tools/Toolbar.tsx`**

```tsx
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
```

- [ ] **Step 4: Wire into App**

```tsx
import { Toolbar } from '../tools/Toolbar';
// ...
return (
  <div className="flex flex-col h-full">
    <Toolbar onExport={() => alert('TODO: export')} />
    <div className="flex-1 overflow-auto flex flex-col gap-4 items-center p-4">
      {Array.from({ length: doc.numPages }).map((_, i) => (
        <PageCanvas key={i} doc={doc} pageIndex={i} scale={1.25} />
      ))}
    </div>
  </div>
);
```

- [ ] **Step 5: Add keyboard shortcuts**

Append to `src/app/App.tsx` inside the component (use `useEffect`):
```tsx
import { useEffect } from 'react';
// ...
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
```

- [ ] **Step 6: Smoke test in browser**

Tools select; undo/redo buttons clickable.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(tools): toolbar, active-tool store, keyboard shortcuts"
```

---

## Task 8: Konva overlay and edit nodes

**Files:**
- Create: `src/overlay/PageOverlay.tsx`, `src/overlay/nodes/TextNode.tsx`, `src/overlay/nodes/ImageNode.tsx`, `src/overlay/nodes/StrokeNode.tsx`, `src/overlay/nodes/ShapeNode.tsx`
- Modify: `src/app/App.tsx` to render overlay over each page.

- [ ] **Step 1: `src/overlay/nodes/TextNode.tsx`**

```tsx
import { Text } from 'react-konva';
import type { TextEdit } from '../../store/types';
import { useDocStore } from '../../store/docStore';

export function TextNode({ e, selected, onSelect }: { e: TextEdit; selected: boolean; onSelect: () => void }) {
  const update = useDocStore((s) => s.updateEdit);
  return (
    <Text
      x={e.x} y={e.y} text={e.text} fontSize={e.fontSize} fill={e.color}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(ev) => update(e.id, { x: ev.target.x(), y: ev.target.y() })}
      stroke={selected ? '#2563eb' : undefined}
      strokeWidth={selected ? 0.5 : 0}
    />
  );
}
```

- [ ] **Step 2: `src/overlay/nodes/ImageNode.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { ImageEdit } from '../../store/types';
import { useDocStore } from '../../store/docStore';

export function ImageNode({ e, onSelect }: { e: ImageEdit; selected: boolean; onSelect: () => void }) {
  const update = useDocStore((s) => s.updateEdit);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const i = new window.Image();
    i.src = e.dataUrl;
    i.onload = () => setImg(i);
  }, [e.dataUrl]);
  if (!img) return null;
  return (
    <KonvaImage
      x={e.x} y={e.y} width={e.w} height={e.h} image={img} rotation={e.rotation}
      draggable onClick={onSelect} onTap={onSelect}
      onDragEnd={(ev) => update(e.id, { x: ev.target.x(), y: ev.target.y() })}
    />
  );
}
```

- [ ] **Step 3: `src/overlay/nodes/StrokeNode.tsx`**

```tsx
import { Line } from 'react-konva';
import type { StrokeEdit } from '../../store/types';

export function StrokeNode({ e }: { e: StrokeEdit; selected: boolean; onSelect: () => void }) {
  return (
    <Line points={e.points} stroke={e.color} strokeWidth={e.width} opacity={e.opacity}
      lineCap="round" lineJoin="round" tension={0.2} listening={false} />
  );
}
```

- [ ] **Step 4: `src/overlay/nodes/ShapeNode.tsx`**

```tsx
import { Rect, Line } from 'react-konva';
import type { ShapeEdit } from '../../store/types';

export function ShapeNode({ e, onSelect }: { e: ShapeEdit; selected: boolean; onSelect: () => void }) {
  if (e.type === 'rect') {
    return <Rect x={e.x} y={e.y} width={e.w} height={e.h}
      stroke={e.stroke} fill={e.fill ?? undefined} onClick={onSelect} onTap={onSelect} />;
  }
  return <Line points={[e.x, e.y, e.x + e.w, e.y + e.h]} stroke={e.stroke} onClick={onSelect} onTap={onSelect} />;
}
```

- [ ] **Step 5: `src/overlay/PageOverlay.tsx`**

```tsx
import { Stage, Layer } from 'react-konva';
import { useState } from 'react';
import { useDocStore } from '../store/docStore';
import { useActiveTool } from '../tools/useActiveTool';
import { TextNode } from './nodes/TextNode';
import { ImageNode } from './nodes/ImageNode';
import { StrokeNode } from './nodes/StrokeNode';
import { ShapeNode } from './nodes/ShapeNode';
import { handlePointer } from '../tools/handlers';

type Props = { pageIndex: number; width: number; height: number };

export function PageOverlay({ pageIndex, width, height }: Props) {
  const edits = useDocStore((s) => s.edits.filter((e) => e.pageIndex === pageIndex));
  const tool = useActiveTool((s) => s.tool);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Stage width={width} height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      onMouseDown={(ev) => handlePointer('down', ev, { tool, pageIndex })}
      onMouseMove={(ev) => handlePointer('move', ev, { tool, pageIndex })}
      onMouseUp={(ev) => handlePointer('up', ev, { tool, pageIndex })}>
      <Layer>
        {edits.map((e) => {
          const sel = e.id === selectedId;
          const onSelect = () => setSelectedId(e.id);
          if (e.kind === 'text')   return <TextNode  key={e.id} e={e} selected={sel} onSelect={onSelect} />;
          if (e.kind === 'image')  return <ImageNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
          if (e.kind === 'stroke') return <StrokeNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
          return <ShapeNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
        })}
      </Layer>
    </Stage>
  );
}
```

- [ ] **Step 6: Stub `src/tools/handlers/index.ts`**

```ts
import type Konva from 'konva';
import type { Tool } from '../types';

export type Phase = 'down' | 'move' | 'up';
export type Ctx = { tool: Tool; pageIndex: number };

export function handlePointer(_phase: Phase, _ev: Konva.KonvaEventObject<MouseEvent>, _ctx: Ctx) {
  // implemented per-tool in later tasks
}
```

- [ ] **Step 7: Wrap PageCanvas + overlay in a `PageView`**

In `src/app/App.tsx`, replace the page-rendering loop:
```tsx
import { useState } from 'react';
import { PageOverlay } from '../overlay/PageOverlay';

function PageView({ doc, pageIndex }: { doc: any; pageIndex: number }) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  return (
    <div className="relative" style={{ width: size.w, height: size.h }}>
      <PageCanvas doc={doc} pageIndex={pageIndex} scale={1.25}
        onSize={(w, h) => setSize({ w, h })} />
      {size.w > 0 && <PageOverlay pageIndex={pageIndex} width={size.w} height={size.h} />}
    </div>
  );
}
// in render:
{Array.from({ length: doc.numPages }).map((_, i) => <PageView key={i} doc={doc} pageIndex={i} />)}
```

- [ ] **Step 8: Smoke test**

Page renders, overlay is empty, no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(overlay): konva stage and edit node components"
```

---

## Task 9: Text, Pen, Highlight, Rect tool handlers

**Files:**
- Create: `src/tools/handlers/textHandler.ts`, `penHandler.ts`, `highlightHandler.ts`, `rectHandler.ts`
- Modify: `src/tools/handlers/index.ts`

- [ ] **Step 1: `textHandler.ts`**

```ts
import type Konva from 'konva';
import { useDocStore } from '../../store/docStore';

export function textDown(ev: Konva.KonvaEventObject<MouseEvent>, pageIndex: number) {
  const stage = ev.target.getStage(); if (!stage) return;
  const pos = stage.getPointerPosition(); if (!pos) return;
  const text = window.prompt('Text:'); if (!text) return;
  useDocStore.getState().addEdit({
    id: crypto.randomUUID(), pageIndex, kind: 'text',
    x: pos.x, y: pos.y, text, fontSize: 16, color: '#111111',
  });
}
```

- [ ] **Step 2: `penHandler.ts`**

```ts
import type Konva from 'konva';
import { useDocStore } from '../../store/docStore';

let currentId: string | null = null;

export function penDown(ev: Konva.KonvaEventObject<MouseEvent>, pageIndex: number, opts: { color: string; width: number; opacity: number }) {
  const stage = ev.target.getStage(); if (!stage) return;
  const pos = stage.getPointerPosition(); if (!pos) return;
  currentId = crypto.randomUUID();
  useDocStore.getState().addEdit({
    id: currentId, pageIndex, kind: 'stroke',
    points: [pos.x, pos.y], color: opts.color, width: opts.width, opacity: opts.opacity,
  });
}

export function penMove(ev: Konva.KonvaEventObject<MouseEvent>) {
  if (!currentId) return;
  const stage = ev.target.getStage(); if (!stage) return;
  const pos = stage.getPointerPosition(); if (!pos) return;
  const e = useDocStore.getState().edits.find((x) => x.id === currentId);
  if (!e || e.kind !== 'stroke') return;
  useDocStore.getState().updateEdit(currentId, { points: [...e.points, pos.x, pos.y] });
}

export function penUp() { currentId = null; }
```

- [ ] **Step 3: `highlightHandler.ts`**

```ts
import { penDown, penMove, penUp } from './penHandler';
import type Konva from 'konva';

export const highlightDown = (ev: Konva.KonvaEventObject<MouseEvent>, pageIndex: number) =>
  penDown(ev, pageIndex, { color: '#fef08a', width: 14, opacity: 0.4 });
export const highlightMove = penMove;
export const highlightUp = penUp;
```

- [ ] **Step 4: `rectHandler.ts`**

```ts
import type Konva from 'konva';
import { useDocStore } from '../../store/docStore';

let id: string | null = null;
let start: { x: number; y: number } | null = null;

export function rectDown(ev: Konva.KonvaEventObject<MouseEvent>, pageIndex: number) {
  const stage = ev.target.getStage(); if (!stage) return;
  const pos = stage.getPointerPosition(); if (!pos) return;
  id = crypto.randomUUID();
  start = { x: pos.x, y: pos.y };
  useDocStore.getState().addEdit({
    id, pageIndex, kind: 'shape', type: 'rect',
    x: pos.x, y: pos.y, w: 0, h: 0, stroke: '#dc2626', fill: null,
  });
}
export function rectMove(ev: Konva.KonvaEventObject<MouseEvent>) {
  if (!id || !start) return;
  const stage = ev.target.getStage(); if (!stage) return;
  const pos = stage.getPointerPosition(); if (!pos) return;
  useDocStore.getState().updateEdit(id, { w: pos.x - start.x, h: pos.y - start.y });
}
export function rectUp() { id = null; start = null; }
```

- [ ] **Step 5: Replace `src/tools/handlers/index.ts`**

```ts
import type Konva from 'konva';
import type { Tool } from '../types';
import { textDown } from './textHandler';
import { penDown, penMove, penUp } from './penHandler';
import { highlightDown, highlightMove, highlightUp } from './highlightHandler';
import { rectDown, rectMove, rectUp } from './rectHandler';

export type Phase = 'down' | 'move' | 'up';
export type Ctx = { tool: Tool; pageIndex: number };

export function handlePointer(phase: Phase, ev: Konva.KonvaEventObject<MouseEvent>, ctx: Ctx) {
  const { tool, pageIndex } = ctx;
  if (tool === 'text' && phase === 'down') return textDown(ev, pageIndex);
  if (tool === 'pen') {
    if (phase === 'down') return penDown(ev, pageIndex, { color: '#111', width: 2, opacity: 1 });
    if (phase === 'move') return penMove(ev);
    if (phase === 'up') return penUp();
  }
  if (tool === 'highlight') {
    if (phase === 'down') return highlightDown(ev, pageIndex);
    if (phase === 'move') return highlightMove(ev);
    if (phase === 'up') return highlightUp();
  }
  if (tool === 'rect') {
    if (phase === 'down') return rectDown(ev, pageIndex);
    if (phase === 'move') return rectMove(ev);
    if (phase === 'up') return rectUp();
  }
}
```

- [ ] **Step 6: Smoke test**

Switch tools, draw on page, see strokes/shapes/text appear. Refresh; they restore.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(tools): text, pen, highlight, rect handlers"
```

---

## Task 10: Image insertion tool

**Files:**
- Create: `src/tools/handlers/imageHandler.ts`
- Modify: `src/tools/handlers/index.ts`

- [ ] **Step 1: `imageHandler.ts`**

```ts
import type Konva from 'konva';
import { useDocStore } from '../../store/docStore';

let pendingDataUrl: string | null = null;

export function imageStartFlow(): Promise<void> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg';
    input.onchange = async () => {
      const f = input.files?.[0]; if (!f) return resolve();
      const reader = new FileReader();
      reader.onload = () => { pendingDataUrl = reader.result as string; resolve(); };
      reader.readAsDataURL(f);
    };
    input.click();
  });
}

export async function imageDown(ev: Konva.KonvaEventObject<MouseEvent>, pageIndex: number) {
  if (!pendingDataUrl) {
    await imageStartFlow();
    if (!pendingDataUrl) return;
  }
  const stage = ev.target.getStage(); if (!stage) return;
  const pos = stage.getPointerPosition(); if (!pos) return;
  const img = new Image();
  img.src = pendingDataUrl;
  await new Promise<void>((r) => { img.onload = () => r(); });
  const maxW = 200;
  const ratio = img.height / img.width;
  const w = Math.min(maxW, img.width);
  useDocStore.getState().addEdit({
    id: crypto.randomUUID(), pageIndex, kind: 'image',
    x: pos.x, y: pos.y, w, h: w * ratio, rotation: 0, dataUrl: pendingDataUrl,
  });
  pendingDataUrl = null;
}
```

- [ ] **Step 2: Wire into handlers index**

Add at top of `src/tools/handlers/index.ts`:
```ts
import { imageDown } from './imageHandler';
```
Inside `handlePointer`:
```ts
if (tool === 'image' && phase === 'down') return imageDown(ev, pageIndex);
```

- [ ] **Step 3: Smoke test**

Select Image tool → file picker pops → click on page → image appears, draggable.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(tools): image insertion"
```

---

## Task 11: Signature modal — strip white helper

**Files:**
- Create: `src/signature/stripWhite.ts`
- Test: `tests/stripWhite.test.ts`

- [ ] **Step 1: Failing test**

`tests/stripWhite.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { stripWhite } from '../src/signature/stripWhite';

describe('stripWhite', () => {
  it('makes near-white pixels transparent', () => {
    // 2x1 image: one white, one black
    const data = new Uint8ClampedArray([255,255,255,255, 0,0,0,255]);
    const out = stripWhite(data, 240);
    expect(out[3]).toBe(0);    // first pixel transparent
    expect(out[7]).toBe(255);  // second pixel opaque
  });
});
```

- [ ] **Step 2: Run, FAIL**

```bash
npm run test -- --run tests/stripWhite.test.ts
```

- [ ] **Step 3: Implement**

```ts
export function stripWhite(data: Uint8ClampedArray, threshold: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data);
  for (let i = 0; i < out.length; i += 4) {
    if (out[i] >= threshold && out[i+1] >= threshold && out[i+2] >= threshold) {
      out[i+3] = 0;
    }
  }
  return out;
}
```

- [ ] **Step 4: Verify pass**

```bash
npm run test -- --run tests/stripWhite.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(signature): luminance threshold helper"
```

---

## Task 12: Signature modal UI

**Files:**
- Create: `src/signature/SignatureModal.tsx`, `src/signature/DrawTab.tsx`, `src/signature/UploadTab.tsx`, `src/signature/SavedTab.tsx`
- Modify: `src/tools/handlers/index.ts`, add `signatureHandler.ts`

- [ ] **Step 1: `DrawTab.tsx`**

```tsx
import { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';

export function DrawTab({ onResult }: { onResult: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [color, setColor] = useState('#111');

  useEffect(() => {
    if (!ref.current) return;
    padRef.current = new SignaturePad(ref.current, { penColor: color, backgroundColor: 'rgba(0,0,0,0)' });
    return () => padRef.current?.off();
  }, []);
  useEffect(() => { if (padRef.current) padRef.current.penColor = color; }, [color]);

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={ref} width={500} height={180} className="border rounded bg-white" />
      <div className="flex gap-2 items-center">
        <button className="px-2 py-1 border rounded" onClick={() => padRef.current?.clear()}>Clear</button>
        <label><input type="radio" checked={color==='#111'} onChange={() => setColor('#111')} /> Black</label>
        <label><input type="radio" checked={color==='#1d4ed8'} onChange={() => setColor('#1d4ed8')} /> Blue</label>
        <button className="ml-auto px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() => {
            if (!padRef.current || padRef.current.isEmpty()) return;
            onResult(padRef.current.toDataURL('image/png'));
          }}>Use</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `UploadTab.tsx`**

```tsx
import { stripWhite } from './stripWhite';

export function UploadTab({ onResult }: { onResult: (dataUrl: string) => void }) {
  return (
    <div>
      <input type="file" accept="image/png,image/jpeg" onChange={async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.src = url;
        await new Promise<void>((r) => { img.onload = () => r(); });
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const id = ctx.getImageData(0, 0, c.width, c.height);
        const stripped = stripWhite(id.data, 235);
        ctx.putImageData(new ImageData(stripped, c.width, c.height), 0, 0);
        onResult(c.toDataURL('image/png'));
      }} />
    </div>
  );
}
```

- [ ] **Step 3: `SavedTab.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { listSignatures, deleteSignature, type SignatureRow } from '../persistence/signatures';

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
```

- [ ] **Step 4: `SignatureModal.tsx`**

```tsx
import { useState } from 'react';
import { DrawTab } from './DrawTab';
import { UploadTab } from './UploadTab';
import { SavedTab } from './SavedTab';
import { putSignature } from '../persistence/signatures';

type Tab = 'draw' | 'upload' | 'saved';

export function SignatureModal({ onClose, onUse }: { onClose: () => void; onUse: (dataUrl: string) => void }) {
  const [tab, setTab] = useState<Tab>('draw');
  const [save, setSave] = useState(false);

  const handle = async (dataUrl: string) => {
    if (save) await putSignature({ id: crypto.randomUUID(), dataUrl, createdAt: Date.now() });
    onUse(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-4 w-[560px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-2 mb-3">
          {(['draw','upload','saved'] as Tab[]).map((t) => (
            <button key={t}
              className={`px-3 py-1 rounded ${tab===t ? 'bg-blue-600 text-white' : 'border'}`}
              onClick={() => setTab(t)}>{t}</button>
          ))}
          <button className="ml-auto" onClick={onClose}>×</button>
        </div>
        {tab === 'draw'   && <DrawTab onResult={handle} />}
        {tab === 'upload' && <UploadTab onResult={handle} />}
        {tab === 'saved'  && <SavedTab onResult={handle} />}
        <label className="mt-3 inline-flex gap-2 items-center">
          <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
          Save for next time
        </label>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: `signatureHandler.ts`**

```ts
import type Konva from 'konva';
import { useDocStore } from '../../store/docStore';

let pending: string | null = null;
export function setPendingSignature(dataUrl: string) { pending = dataUrl; }
export function hasPendingSignature() { return pending !== null; }

export async function signatureDown(ev: Konva.KonvaEventObject<MouseEvent>, pageIndex: number) {
  if (!pending) return;
  const stage = ev.target.getStage(); if (!stage) return;
  const pos = stage.getPointerPosition(); if (!pos) return;
  const img = new Image();
  img.src = pending;
  await new Promise<void>((r) => { img.onload = () => r(); });
  const w = 180;
  const h = w * (img.height / img.width);
  useDocStore.getState().addEdit({
    id: crypto.randomUUID(), pageIndex, kind: 'image', isSignature: true,
    x: pos.x, y: pos.y, w, h, rotation: 0, dataUrl: pending,
  });
  pending = null;
}
```

Append to `handlePointer`:
```ts
import { signatureDown } from './signatureHandler';
// ...
if (tool === 'signature' && phase === 'down') return signatureDown(ev, pageIndex);
```

- [ ] **Step 6: Show modal from App when signature tool activates without pending**

In `src/app/App.tsx`:
```tsx
import { SignatureModal } from '../signature/SignatureModal';
import { setPendingSignature, hasPendingSignature } from '../tools/handlers/signatureHandler';
// ...
const [sigOpen, setSigOpen] = useState(false);
const tool = useActiveTool((s) => s.tool);
useEffect(() => {
  if (tool === 'signature' && !hasPendingSignature()) setSigOpen(true);
}, [tool]);
// in render:
{sigOpen && <SignatureModal onClose={() => setSigOpen(false)} onUse={(url) => setPendingSignature(url)} />}
```

- [ ] **Step 7: Smoke test**

Click Signature tool → modal opens → draw → Use → click page → signature appears.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(signature): modal + draw/upload/saved tabs + placement"
```

---

## Task 13: Form field detection and overlay

**Files:**
- Create: `src/forms/detectFields.ts`, `src/forms/FormFieldOverlay.tsx`
- Modify: `src/app/App.tsx` to render the overlay per page.

- [ ] **Step 1: `detectFields.ts`**

```ts
import { PDFDocument } from 'pdf-lib';

export type DetectedField = {
  name: string;
  type: 'text' | 'checkbox';
  pageIndex: number;
  rect: { x: number; y: number; w: number; h: number }; // in PDF coords (bottom-left origin)
  pageHeight: number;
};

export async function detectFields(bytes: ArrayBuffer): Promise<DetectedField[]> {
  const doc = await PDFDocument.load(bytes);
  const form = doc.getForm();
  const result: DetectedField[] = [];
  for (const f of form.getFields()) {
    const widgets = (f as any).acroField.getWidgets();
    for (const w of widgets) {
      const rect = w.getRectangle();
      const pageRef = w.P();
      const pageIndex = doc.getPages().findIndex((p) => p.ref === pageRef);
      if (pageIndex < 0) continue;
      const ph = doc.getPages()[pageIndex].getHeight();
      const t = f.constructor.name.includes('CheckBox') ? 'checkbox' : 'text';
      result.push({
        name: f.getName(), type: t as any, pageIndex,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        pageHeight: ph,
      });
    }
  }
  return result;
}
```

- [ ] **Step 2: `FormFieldOverlay.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { detectFields, type DetectedField } from './detectFields';
import { useDocStore } from '../store/docStore';

export function FormFieldOverlay({ pageIndex, scale, pageWidth, pageHeight }:
  { pageIndex: number; scale: number; pageWidth: number; pageHeight: number }) {
  const bytes = useDocStore((s) => s.bytes);
  const fills = useDocStore((s) => s.formFills);
  const setFill = useDocStore((s) => s.setFormFill);
  const [fields, setFields] = useState<DetectedField[]>([]);

  useEffect(() => {
    if (!bytes) return;
    detectFields(bytes).then((all) => setFields(all.filter((f) => f.pageIndex === pageIndex)));
  }, [bytes, pageIndex]);

  const valueFor = (name: string) => fills.find((f) => f.fieldName === name)?.value;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {fields.map((f) => {
        const left = f.rect.x * scale;
        const top  = (f.pageHeight - f.rect.y - f.rect.h) * scale;
        const w = f.rect.w * scale;
        const h = f.rect.h * scale;
        const style = { position: 'absolute' as const, left, top, width: w, height: h, pointerEvents: 'auto' as const };
        if (f.type === 'checkbox') {
          return <input key={f.name} type="checkbox" style={style}
            checked={!!valueFor(f.name)}
            onChange={(e) => setFill({ fieldName: f.name, value: e.target.checked })} />;
        }
        return <input key={f.name} type="text" style={style}
          className="border border-blue-400 bg-blue-50/40 px-1 text-sm"
          value={(valueFor(f.name) as string) ?? ''}
          onChange={(e) => setFill({ fieldName: f.name, value: e.target.value })} />;
      })}
    </div>
  );
}
```

- [ ] **Step 3: Render in PageView**

In `App.tsx` `PageView`:
```tsx
import { FormFieldOverlay } from '../forms/FormFieldOverlay';
// after PageOverlay:
<FormFieldOverlay pageIndex={pageIndex} scale={1.25} pageWidth={size.w} pageHeight={size.h} />
```

- [ ] **Step 4: Smoke test with a PDF form**

Use any sample fillable PDF. Inputs should appear positioned over the fields and accept text.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(forms): native input overlay for pdf form fields"
```

---

## Task 14: Coordinate helper

**Files:**
- Create: `src/export/coords.ts`
- Test: `tests/coords.test.ts`

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { toPdfCoords } from '../src/export/coords';

describe('toPdfCoords', () => {
  it('flips Y from top-left to bottom-left and divides by scale', () => {
    // page is 1000pt tall in PDF units; rendered at scale 2 → canvas 2000px tall
    // a click at canvas y=500 with scale 2 → PDF y = 1000 - (500/2) = 750
    expect(toPdfCoords({ pageHeight: 1000, scale: 2, x: 100, y: 500 }))
      .toEqual({ x: 50, y: 750 });
  });
});
```

- [ ] **Step 2: Run, FAIL.**

- [ ] **Step 3: Implement**

```ts
export type CoordInput = { pageHeight: number; scale: number; x: number; y: number };

export function toPdfCoords({ pageHeight, scale, x, y }: CoordInput) {
  return { x: x / scale, y: pageHeight - y / scale };
}
```

- [ ] **Step 4: Verify pass.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(export): coord conversion helper"
```

---

## Task 15: Export pipeline

**Files:**
- Create: `src/export/exportPdf.ts`
- Test: `tests/exportPdf.test.ts`
- Modify: `src/app/App.tsx` to call it from the Export button.

- [ ] **Step 1: Failing test**

```ts
import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { exportPdf } from '../src/export/exportPdf';

async function blankPdfBytes(): Promise<ArrayBuffer> {
  const d = await PDFDocument.create();
  d.addPage([600, 800]);
  return (await d.save()).buffer;
}

describe('exportPdf', () => {
  it('produces a valid PDF with text drawn', async () => {
    const bytes = await blankPdfBytes();
    const out = await exportPdf({
      bytes,
      edits: [{ id: 't', pageIndex: 0, kind: 'text', x: 50, y: 50, text: 'hello', fontSize: 16, color: '#000' }],
      formFills: [],
      pageRenderInfo: [{ pageIndex: 0, scale: 1, pageHeight: 800, strokeImage: null }],
    });
    const back = await PDFDocument.load(out);
    expect(back.getPageCount()).toBe(1);
  });
});
```

- [ ] **Step 2: Run, FAIL.**

- [ ] **Step 3: Implement `exportPdf.ts`**

```ts
import { PDFDocument, rgb } from 'pdf-lib';
import type { Edit, FormFill } from '../store/types';
import { toPdfCoords } from './coords';

export type PageRenderInfo = {
  pageIndex: number;
  scale: number;
  pageHeight: number;     // PDF points
  strokeImage: string | null; // dataURL of rasterized strokes/shapes layer for this page
};

export type ExportArgs = {
  bytes: ArrayBuffer;
  edits: Edit[];
  formFills: FormFill[];
  pageRenderInfo: PageRenderInfo[];
};

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

async function dataUrlToUint8(d: string): Promise<Uint8Array> {
  const res = await fetch(d);
  return new Uint8Array(await res.arrayBuffer());
}

export async function exportPdf(args: ExportArgs): Promise<Uint8Array> {
  const doc = await PDFDocument.load(args.bytes);
  const pages = doc.getPages();

  for (const info of args.pageRenderInfo) {
    const page = pages[info.pageIndex];
    if (!page) continue;
    const pageEdits = args.edits.filter((e) => e.pageIndex === info.pageIndex);

    // Draw the rasterized strokes/shapes layer first (so text/image edits sit above).
    if (info.strokeImage) {
      const png = await doc.embedPng(await dataUrlToUint8(info.strokeImage));
      page.drawImage(png, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    }

    for (const e of pageEdits) {
      if (e.kind === 'text') {
        const { x, y } = toPdfCoords({ pageHeight: info.pageHeight, scale: info.scale, x: e.x, y: e.y + e.fontSize });
        page.drawText(e.text, { x, y, size: e.fontSize / info.scale, color: hexToRgb(e.color) });
      } else if (e.kind === 'image') {
        const bytes = await dataUrlToUint8(e.dataUrl);
        const img = e.dataUrl.startsWith('data:image/png')
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        const { x, y } = toPdfCoords({ pageHeight: info.pageHeight, scale: info.scale, x: e.x, y: e.y + e.h });
        page.drawImage(img, { x, y, width: e.w / info.scale, height: e.h / info.scale, rotate: { type: 'degrees', angle: e.rotation } as any });
      }
      // stroke + shape edits are baked into info.strokeImage by the caller.
    }
  }

  if (args.formFills.length) {
    const form = doc.getForm();
    for (const f of args.formFills) {
      try {
        const field = form.getField(f.name);
        if ((field as any).setText && typeof f.value === 'string') (field as any).setText(f.value);
        else if ((field as any).check && typeof f.value === 'boolean') {
          if (f.value) (field as any).check(); else (field as any).uncheck();
        }
      } catch { /* unknown field */ }
    }
  }

  return await doc.save();
}
```

- [ ] **Step 4: Verify export test passes**

```bash
npm run test -- --run tests/exportPdf.test.ts
```

- [ ] **Step 5: Wire up Export button**

In `App.tsx`, replace `onExport`:
```tsx
import { exportPdf } from '../export/exportPdf';
// inside App component:
const onExport = async () => {
  const state = useDocStore.getState();
  if (!state.bytes || !doc) return;
  const scale = 1.25;
  const pageRenderInfo = [];
  for (let i = 0; i < doc.numPages; i++) {
    const page = await doc.getPage(i + 1);
    const viewport = page.getViewport({ scale });
    // Find the Konva stage for this page and rasterize it (strokes/shapes only)
    const stageEl = document.querySelector(`[data-page-stage="${i}"] canvas`) as HTMLCanvasElement | null;
    pageRenderInfo.push({
      pageIndex: i, scale,
      pageHeight: viewport.height / scale,
      strokeImage: stageEl ? stageEl.toDataURL('image/png') : null,
    });
  }
  const out = await exportPdf({
    bytes: state.bytes, edits: state.edits, formFills: state.formFills, pageRenderInfo,
  });
  const blob = new Blob([out], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = state.name.replace(/\.pdf$/i, '') + '-edited.pdf';
  a.click();
  URL.revokeObjectURL(url);
};
```

- [ ] **Step 6: Tag stages so the export can find them**

In `PageOverlay.tsx`, wrap the `<Stage>` in a div:
```tsx
<div data-page-stage={pageIndex} style={{ position: 'absolute', top: 0, left: 0 }}>
  <Stage ...>
```

NOTE: rasterizing only strokes/shapes (not text/image edits) means we should render text/image nodes on a *separate Konva layer* so the exported `toDataURL` from a "strokes only" layer skips them. Update `PageOverlay.tsx`:

- Render two `<Layer>`s: `strokesLayer` (Stroke + Shape nodes, listening false) and `editsLayer` (Text + Image nodes).
- Add `data-page-strokes={pageIndex}` to the Stage container, but call `stage.findOne('.strokes-layer').toDataURL()` from export instead.

Replace the export `stageEl` lookup with:
```tsx
const stages = (window as any).__pageStages as Map<number, any> | undefined;
const layer = stages?.get(i)?.findOne('.strokes-layer');
const strokeImage = layer ? layer.toDataURL({ pixelRatio: 1 }) : null;
```

In `PageOverlay.tsx`, register stages globally on mount:
```tsx
import { useRef, useEffect } from 'react';
// inside component
const stageRef = useRef<any>(null);
useEffect(() => {
  const map: Map<number, any> = (window as any).__pageStages ||= new Map();
  map.set(pageIndex, stageRef.current);
  return () => { map.delete(pageIndex); };
}, [pageIndex]);
// pass ref={stageRef} to <Stage>
// give stroke layer name="strokes-layer"
```

Two `<Layer>`s in the Stage:
```tsx
<Layer name="strokes-layer">
  {edits.filter(e => e.kind === 'stroke' || e.kind === 'shape').map(...)}
</Layer>
<Layer>
  {edits.filter(e => e.kind === 'text' || e.kind === 'image').map(...)}
</Layer>
```

- [ ] **Step 7: Smoke test the full flow**

Open a PDF, add text + pen + highlight + image + signature + fill a form field, click Export. Open the downloaded PDF in a fresh viewer. All edits visible.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(export): pdf-lib export pipeline + UI export button"
```

---

## Task 16: Sidebar thumbnails and properties panel

**Files:**
- Create: `src/ui/Sidebar.tsx`, `src/ui/PropertiesPanel.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: `Sidebar.tsx`**

```tsx
import { useEffect, useState } from 'react';
import type { LoadedPdf } from '../pdf/usePdfDocument';

export function Sidebar({ doc, onJump }: { doc: LoadedPdf; onJump: (i: number) => void }) {
  const [thumbs, setThumbs] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls: string[] = [];
      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1);
        const viewport = page.getViewport({ scale: 0.2 });
        const c = document.createElement('canvas');
        c.width = viewport.width; c.height = viewport.height;
        await page.render({ canvasContext: c.getContext('2d')!, viewport }).promise;
        urls.push(c.toDataURL('image/png'));
      }
      if (!cancelled) setThumbs(urls);
    })();
    return () => { cancelled = true; };
  }, [doc]);
  return (
    <div className="w-32 border-r overflow-auto p-2 flex flex-col gap-2 bg-white">
      {thumbs.map((src, i) => (
        <button key={i} onClick={() => onJump(i)} className="border hover:border-blue-500 rounded">
          <img src={src} className="w-full" />
          <div className="text-xs text-center">{i + 1}</div>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Wire jump to anchor**

Give each PageView `id={'page-' + i}` and `onJump` calls `document.getElementById('page-'+i)?.scrollIntoView({behavior:'smooth'})`.

- [ ] **Step 3: `PropertiesPanel.tsx` (minimal: delete + font size for selected text)**

Skip if not selected. Selection state lifts up out of `PageOverlay` into a small Zustand store:

Create `src/store/selectionStore.ts`:
```ts
import { create } from 'zustand';
type S = { id: string | null; setId: (id: string | null) => void };
export const useSelection = create<S>((set) => ({ id: null, setId: (id) => set({ id }) }));
```
Have `PageOverlay` use `useSelection` instead of local state.

`src/ui/PropertiesPanel.tsx`:
```tsx
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
```

- [ ] **Step 4: Wire into App**

```tsx
<Toolbar onExport={onExport} />
<PropertiesPanel />
<div className="flex-1 flex overflow-hidden">
  <Sidebar doc={doc} onJump={(i) => document.getElementById('page-'+i)?.scrollIntoView({behavior:'smooth'})} />
  <div className="flex-1 overflow-auto flex flex-col gap-4 items-center p-4">
    {Array.from({ length: doc.numPages }).map((_, i) => (
      <div key={i} id={'page-'+i}><PageView doc={doc} pageIndex={i} /></div>
    ))}
  </div>
</div>
```

- [ ] **Step 5: Smoke test**

Thumbs render and click jumps; click an edit → properties panel appears; Delete works.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(ui): sidebar thumbnails and properties panel"
```

---

## Task 17: Final manual smoke test + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Run full test suite**

```bash
npm run test -- --run
```
Expected: all tests pass (coords, undoStack, edits-reducer, persistence, stripWhite, exportPdf).

- [ ] **Step 2: Manual smoke test**

Open the dev server, then:
1. Open a multi-page PDF.
2. Add a text edit; move it; undo; redo.
3. Draw a pen stroke and a highlight.
4. Insert a rectangle.
5. Insert an image (any PNG).
6. Open the Signature modal: draw, save, close, place.
7. Fill a form field if PDF has one.
8. Refresh tab → all edits restored.
9. Export → open the downloaded PDF in Preview/Acrobat → all edits present.

- [ ] **Step 3: README**

Create `README.md`:
````md
# PDF Editor

Client-side PDF editor. Open a PDF, add text/annotations/images/signatures, fill forms, export.

## Run

```bash
npm install
npm run dev
```

## Test

```bash
npm test
```

## Stack

Vite, React, TypeScript, Tailwind, pdfjs-dist, pdf-lib, react-konva, signature_pad, idb, Zustand, Vitest.
````

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: readme; final pass"
```
