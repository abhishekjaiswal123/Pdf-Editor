import { Rect, Line } from 'react-konva';
import type { ShapeEdit } from '../../store/types';

export function ShapeNode({ e, onSelect }: { e: ShapeEdit; selected: boolean; onSelect: () => void }) {
  if (e.type === 'rect') {
    return <Rect x={e.x} y={e.y} width={e.w} height={e.h}
      stroke={e.stroke} fill={e.fill ?? undefined} onClick={onSelect} onTap={onSelect} />;
  }
  return <Line points={[e.x, e.y, e.x + e.w, e.y + e.h]} stroke={e.stroke} onClick={onSelect} onTap={onSelect} />;
}
