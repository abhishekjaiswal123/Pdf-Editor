import { Stage, Layer } from 'react-konva';
import { useState } from 'react';
import { useDocStore } from '../store/docStore';
import { useActiveTool } from '../tools/useActiveTool';
import { TextNode } from './nodes/TextNode';
import { ImageNode } from './nodes/ImageNode';
import { StrokeNode } from './nodes/StrokeNode';
import { ShapeNode } from './nodes/ShapeNode';
import { handlePointer } from '../tools/handlers';

type Props = { pageIndex: number; width: number; height: number };

export function PageOverlay({ pageIndex, width, height }: Props) {
  // NOTE: s.edits.filter(...) returns a new array every render — Zustand will re-render
  // on every store change regardless of whether this page's edits changed. This is
  // acceptable for correctness; memoization with useShallow or a selector can be added
  // later if performance becomes an issue.
  const edits = useDocStore((s) => s.edits.filter((e) => e.pageIndex === pageIndex));
  const tool = useActiveTool((s) => s.tool);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <Stage width={width} height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      onMouseDown={(ev) => handlePointer('down', ev, { tool, pageIndex })}
      onMouseMove={(ev) => handlePointer('move', ev, { tool, pageIndex })}
      onMouseUp={(ev) => handlePointer('up', ev, { tool, pageIndex })}>
      <Layer>
        {edits.map((e) => {
          const sel = e.id === selectedId;
          const onSelect = () => setSelectedId(e.id);
          if (e.kind === 'text')   return <TextNode  key={e.id} e={e} selected={sel} onSelect={onSelect} />;
          if (e.kind === 'image')  return <ImageNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
          if (e.kind === 'stroke') return <StrokeNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
          return <ShapeNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
        })}
      </Layer>
    </Stage>
  );
}
