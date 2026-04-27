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
