# PDF Editor

Client-side PDF editor. Open a PDF, add text/annotations/images/signatures, fill forms, export.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints. All editing happens in your browser; nothing is uploaded.

## Test

```bash
npm test
```

## Features

- Open and view multi-page PDFs
- Add text, freehand pen strokes, highlights, rectangles
- Insert images and signatures (draw, upload, or saved)
- Fill native PDF form fields
- Undo/redo (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z)
- In-progress edits autosaved to IndexedDB
- Export the edited PDF (download)

## Stack

Vite, React, TypeScript, Tailwind, pdfjs-dist, pdf-lib, react-konva, signature_pad, idb, Zustand, Vitest.

## Manual smoke test

1. Open a multi-page PDF.
2. Add text, pen, highlight, rect, image, and signature edits.
3. Fill any form fields.
4. Refresh the tab → edits restore.
5. Export → open the downloaded PDF in any viewer → all edits visible.
