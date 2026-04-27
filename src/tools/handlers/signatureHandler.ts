import type Konva from 'konva';
import { useDocStore } from '../../store/docStore';

let pending: string | null = null;
export function setPendingSignature(dataUrl: string) { pending = dataUrl; }
export function hasPendingSignature() { return pending !== null; }

export async function signatureDown(ev: Konva.KonvaEventObject<MouseEvent>, pageIndex: number) {
  if (!pending) return;
  const url = pending;
  const stage = ev.target.getStage(); if (!stage) return;
  const pos = stage.getPointerPosition(); if (!pos) return;
  const img = new Image();
  img.src = url;
  await new Promise<void>((r) => { img.onload = () => r(); });
  const w = 180;
  const h = w * (img.height / img.width);
  useDocStore.getState().addEdit({
    id: crypto.randomUUID(), pageIndex, kind: 'image', isSignature: true,
    x: pos.x, y: pos.y, w, h, rotation: 0, dataUrl: url,
  });
  pending = null;
}
