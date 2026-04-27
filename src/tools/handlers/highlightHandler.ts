import { penDown, penMove, penUp } from './penHandler';
import type Konva from 'konva';

export const highlightDown = (ev: Konva.KonvaEventObject<MouseEvent>, pageIndex: number) =>
  penDown(ev, pageIndex, { color: '#fef08a', width: 14, opacity: 0.4 });
export const highlightMove = penMove;
export const highlightUp = penUp;
