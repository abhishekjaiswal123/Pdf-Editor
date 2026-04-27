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
  const url = pendingDataUrl;
  const stage = ev.target.getStage(); if (!stage) return;
  const pos = stage.getPointerPosition(); if (!pos) return;
  const img = new Image();
  img.src = url;
  await new Promise<void>((r) => { img.onload = () => r(); });
  const maxW = 200;
  const ratio = img.height / img.width;
  const w = Math.min(maxW, img.width);
  useDocStore.getState().addEdit({
    id: crypto.randomUUID(), pageIndex, kind: 'image',
    x: pos.x, y: pos.y, w, h: w * ratio, rotation: 0, dataUrl: url,
  });
  pendingDataUrl = null;
}
