import type Konva from 'konva';
import type { Tool } from '../types';
import { textDown } from './textHandler';
import { penDown, penMove, penUp } from './penHandler';
import { highlightDown, highlightMove, highlightUp } from './highlightHandler';
import { rectDown, rectMove, rectUp } from './rectHandler';
import { imageDown } from './imageHandler';
import { signatureDown } from './signatureHandler';

export type Phase = 'down' | 'move' | 'up';
export type Ctx = { tool: Tool; pageIndex: number };

export function handlePointer(phase: Phase, ev: Konva.KonvaEventObject<MouseEvent>, ctx: Ctx) {
  const { tool, pageIndex } = ctx;
  if (tool === 'signature' && phase === 'down') return signatureDown(ev, pageIndex);
  if (tool === 'text' && phase === 'down') return textDown(ev, pageIndex);
  if (tool === 'pen') {
    if (phase === 'down') return penDown(ev, pageIndex, { color: '#111', width: 2, opacity: 1 });
    if (phase === 'move') return penMove(ev);
    if (phase === 'up') return penUp();
  }
  if (tool === 'highlight') {
    if (phase === 'down') return highlightDown(ev, pageIndex);
    if (phase === 'move') return highlightMove(ev);
    if (phase === 'up') return highlightUp();
  }
  if (tool === 'rect') {
    if (phase === 'down') return rectDown(ev, pageIndex);
    if (phase === 'move') return rectMove(ev);
    if (phase === 'up') return rectUp();
  }
  if (tool === 'image' && phase === 'down') return imageDown(ev, pageIndex);
}
