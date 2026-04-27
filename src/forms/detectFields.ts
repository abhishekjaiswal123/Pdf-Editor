import { PDFDocument } from 'pdf-lib';

export type DetectedField = {
  name: string;
  type: 'text' | 'checkbox';
  pageIndex: number;
  rect: { x: number; y: number; w: number; h: number }; // PDF coords (bottom-left origin)
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
        name: f.getName(), type: t as 'text' | 'checkbox', pageIndex,
        rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height },
        pageHeight: ph,
      });
    }
  }
  return result;
}
