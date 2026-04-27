import { PDFDocument, rgb, degrees } from 'pdf-lib';
import type { Edit, FormFill } from '../store/types';
import { toPdfCoords } from './coords';

export type PageRenderInfo = {
  pageIndex: number;
  scale: number;
  pageHeight: number; // PDF points
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
  const expanded = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(expanded, 16);
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

    // Bake rasterized strokes/shapes layer (from Konva canvas) into the page
    if (info.strokeImage) {
      const png = await doc.embedPng(await dataUrlToUint8(info.strokeImage));
      page.drawImage(png, { x: 0, y: 0, width: page.getWidth(), height: page.getHeight() });
    }

    for (const e of pageEdits) {
      if (e.kind === 'text') {
        const { x, y } = toPdfCoords({
          pageHeight: info.pageHeight, scale: info.scale,
          x: e.x, y: e.y + e.fontSize,
        });
        page.drawText(e.text, { x, y, size: e.fontSize / info.scale, color: hexToRgb(e.color) });
      } else if (e.kind === 'image') {
        const bytes = await dataUrlToUint8(e.dataUrl);
        const img = e.dataUrl.startsWith('data:image/png')
          ? await doc.embedPng(bytes)
          : await doc.embedJpg(bytes);
        const { x, y } = toPdfCoords({
          pageHeight: info.pageHeight, scale: info.scale,
          x: e.x, y: e.y + e.h,
        });
        page.drawImage(img, {
          x, y, width: e.w / info.scale, height: e.h / info.scale,
          rotate: degrees(e.rotation),
        });
      }
      // stroke + shape edits are baked into info.strokeImage by the caller.
    }
  }

  if (args.formFills.length) {
    const form = doc.getForm();
    for (const f of args.formFills) {
      try {
        const field = form.getField(f.fieldName);
        const anyField = field as any;
        if (typeof anyField.setText === 'function' && typeof f.value === 'string') {
          anyField.setText(f.value);
        } else if (typeof anyField.check === 'function' && typeof f.value === 'boolean') {
          if (f.value) anyField.check(); else anyField.uncheck();
        }
      } catch { /* unknown field – skip gracefully */ }
    }
  }

  return await doc.save();
}
