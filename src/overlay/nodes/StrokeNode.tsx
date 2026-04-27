import { Line } from 'react-konva';
import type { StrokeEdit } from '../../store/types';

export function StrokeNode({ e }: { e: StrokeEdit; selected: boolean; onSelect: () => void }) {
  return (
    <Line points={e.points} stroke={e.color} strokeWidth={e.width} opacity={e.opacity}
      lineCap="round" lineJoin="round" tension={0.2} listening={false} />
  );
}
