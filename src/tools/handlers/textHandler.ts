import type Konva from 'konva';
import { useTextEditor } from '../../store/textEditorStore';

export function textDown(ev: Konva.KonvaEventObject<MouseEvent>, pageIndex: number) {
  const stage = ev.target.getStage();
  if (!stage) return;
  const pos = stage.getPointerPosition();
  if (!pos) return;
  useTextEditor.getState().begin({ pageIndex, x: pos.x, y: pos.y });
}
