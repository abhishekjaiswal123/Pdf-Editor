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
