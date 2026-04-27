import type Konva from 'konva';
import type { Tool } from '../types';

export type Phase = 'down' | 'move' | 'up';
export type Ctx = { tool: Tool; pageIndex: number };

export function handlePointer(_phase: Phase, _ev: Konva.KonvaEventObject<MouseEvent>, _ctx: Ctx) {
  // implemented per-tool in later tasks
}
