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
