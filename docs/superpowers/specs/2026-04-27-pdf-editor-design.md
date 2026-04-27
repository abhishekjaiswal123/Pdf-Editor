# PDF Editor — Design

**Date:** 2026-04-27
**Status:** Approved (brainstorm)

## Summary

A single-user, fully client-side web app for editing PDFs in the browser. Supports adding text, freehand annotations, images, signatures, and filling existing form fields. Edits are stored as structured data in IndexedDB so in-progress work survives across sessions; the final PDF is generated only on export.

## Goals

- Open a PDF, edit it, export an edited PDF — all in the browser, no backend.
- Edits remain editable until export (move, resize, delete, undo).
- In-progress edits persist across browser sessions.
- Reusable signatures stored locally.

## Non-Goals

- No OCR or modification of existing PDF text content.
- No page reordering, deletion, rotation, or PDF merging.
- No cloud sync, accounts, sharing, or collaboration.
- No vector-preserved signatures (signatures are rasterized PNGs).
- No encrypted-PDF support beyond what `pdf-lib` handles natively.

## Tech Stack

- **Vite + React + TypeScript** — app shell.
- **Tailwind CSS** — styling.
- **pdfjs-dist** — render PDF pages to canvas.
- **pdf-lib** — write edits into the PDF on export; read/fill form fields.
- **react-konva (Konva)** — overlay editing layer per page (text, shapes, images, signature placement, freehand strokes).
- **signature_pad** — "Draw your signature" canvas inside the signature modal.
- **idb** — typed wrapper over IndexedDB for persistence.
- **Zustand** — document state + undo/redo command stack.

## Architecture

Single-page app, no backend. All state lives in the browser.

```
App Shell (toolbar, page nav, sidebar)
  PageView (one per PDF page)
    Layer 1: PDF render (PDF.js canvas)         — read-only
    Layer 2: Edit overlay (Konva stage)         — all edits
  Document store (Zustand)
    - original PDF bytes
    - edits[] per page (typed objects)
    - form field values
    - undo/redo command stack
  IndexedDB (persisted on every change, debounced ~500ms)
  Export: pdf-lib merges edits into original bytes → download
```

**Core principle:** edits are structured data, not baked into the PDF until export. Re-saving never degrades quality, and any edit stays editable.

## Data Model

```ts
type Edit =
  | { id; pageIndex; kind: 'text'; x; y; text; fontSize; color }
  | { id; pageIndex; kind: 'image'; x; y; w; h; rotation; dataUrl }
  | { id; pageIndex; kind: 'stroke'; points: number[]; color; width; opacity }
  | { id; pageIndex; kind: 'shape'; type: 'rect' | 'line'; x; y; w; h; stroke; fill }

type FormFill = { fieldName: string; value: string | boolean }

type Command = { do: () => void; undo: () => void }   // for undo stack
```

Signatures are stored as `kind: 'image'` edits — the signature flow just produces a PNG dataURL, then placement is identical to inserting any image.

## IndexedDB Schema

Three object stores:

- **`documents`** — `{ id, name, originalBytes: ArrayBuffer, lastOpened: number }`
- **`edits`** — `{ docId, edits: Edit[], formFills: FormFill[] }`
- **`signatures`** — `{ id, dataUrl, createdAt }` — saved across documents.

App load shows a "Recent documents" list on the empty state; opening one restores bytes and replays edits.

## UI Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [Open PDF]  [Undo] [Redo]   ─── Tools ───   [Export PDF]    │
│  Select  Text  Pen  Highlight  Rect  Image  Signature        │
├────────┬─────────────────────────────────────────────────────┤
│ Pages  │              Page canvas (PDF + overlay)            │
│ [ 1 ]  │              vertically scrolled                    │
│ [ 2 ]  │                                                     │
│ [ 3 ]  │              Properties panel appears here          │
│        │              when an edit is selected               │
└────────┴─────────────────────────────────────────────────────┘
```

- **Top bar:** open file, undo/redo, export. Tool strip beneath.
- **Left sidebar:** clickable thumbnail page navigator.
- **Main area:** all pages stacked vertically. Each page = PDF canvas + Konva overlay.
- **Properties panel:** inline below the toolbar when a node is selected (font size, color, delete).

## Tool Behavior

- **Select** — default; click any edit to move/resize/edit; corner handles for resize.
- **Text** — click to place a text node; immediately enters edit mode.
- **Pen** — drag to draw a freehand stroke (configurable color/width).
- **Highlight** — same as Pen but thicker, ~30% opacity, multiply blend.
- **Rect** — drag to draw a rectangle (toggle fill / outline in props panel).
- **Image** — opens file picker; resulting node is placed at click point with resize handles.
- **Signature** — opens signature modal (below); on accept, places a draggable image node.

**Form fields:** when `pdf-lib`'s `getForm()` reports fields, render native HTML inputs absolutely positioned over the matching page region. Always editable; no tool needed. Values stored in `formFills`.

## Signature Flow

Modal with three tabs:

- **Draw** — `signature_pad` canvas, transparent background, black/blue pen, Clear button.
- **Upload** — file picker (PNG/JPG); luminance-threshold pass strips white background so the signature sits naturally on the page.
- **Saved** — list of previously-saved signatures from IndexedDB; click to reuse.

A "Save for next time" checkbox persists the signature to the `signatures` store. On accept, the modal closes and the cursor becomes a placement preview; clicking on a page drops it as a regular image edit.

## Undo / Redo

- Command stack in the Zustand store. Each mutating user action pushes a `Command` with `do` / `undo` functions.
- Cap at 100 entries; oldest dropped.
- Shortcuts: `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`.

## Export Pipeline

`src/export/exportPdf.ts`:

1. `PDFDocument.load(originalBytes)`.
2. For each page:
   - Draw `text` edits with `page.drawText()` (Y-flipped to bottom-left origin).
   - Embed images (incl. signatures) via `embedPng` / `embedJpg`, draw with `drawImage`.
   - Rasterize Konva strokes/shapes for that page to PNG via `stage.toDataURL()`, embed, draw across the page.
3. Fill form fields via `getForm().getTextField(name).setText(value)` etc.
4. (Optional toggle) `form.flatten()` to bake form values in.
5. `saveAsBase64()` → trigger download as `<originalName>-edited.pdf`.

**Coordinate helper** (`src/export/coords.ts`): single `toPdfCoords(pageHeight, x, y)` used wherever export converts from PDF.js (top-left) to pdf-lib (bottom-left). One source of truth, easy to test.

## Module Layout

```
src/
  app/                  app shell, routing-free top-level layout
  store/                Zustand store, command stack
  persistence/          IndexedDB wrappers (documents, edits, signatures)
  pdf/                  PDF.js render hooks
  overlay/              Konva components (text, stroke, image, shape nodes)
  tools/                tool definitions, pointer handlers
  signature/            signature modal + signature_pad integration
  forms/                form-field detection & overlay inputs
  export/               pdf-lib export pipeline + coord helpers
  ui/                   shared components (toolbar, sidebar, modal)
```

## Testing

- **Unit tests (Vitest):** coordinate helper, edit reducers, command stack, IndexedDB serialization round-trip.
- **Component tests:** signature modal flow, form-field overlay rendering, tool selection state.
- **Manual smoke test before each release:** open a PDF with a form, add one of each edit type, refresh the page, verify edits restore, export, verify the exported PDF in a fresh viewer.

## Risks / Open Questions

- **Large PDFs in IndexedDB.** Storing original bytes per document could exceed quota on big files; if it becomes an issue, prompt the user before persisting documents over ~50MB.
- **Form-field coordinate mapping.** PDF.js annotation rects vs. pdf-lib field positions sometimes drift; verify on a real form during implementation.
- **Highlight blend mode** in canvas export — multiply blending may not survive rasterization cleanly; fall back to fixed-alpha overlay if needed.
