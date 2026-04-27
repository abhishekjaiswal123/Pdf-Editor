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
