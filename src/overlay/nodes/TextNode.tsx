import { Text } from 'react-konva';
import type { TextEdit } from '../../store/types';
import { useDocStore } from '../../store/docStore';

export function TextNode({ e, selected, onSelect }: { e: TextEdit; selected: boolean; onSelect: () => void }) {
  const update = useDocStore((s) => s.updateEdit);
  return (
    <Text
      x={e.x} y={e.y} text={e.text} fontSize={e.fontSize} fill={e.color}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(ev) => update(e.id, { x: ev.target.x(), y: ev.target.y() })}
      stroke={selected ? '#2563eb' : undefined}
      strokeWidth={selected ? 0.5 : 0}
    />
  );
}
