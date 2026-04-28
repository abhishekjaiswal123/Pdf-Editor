import { Stage, Layer } from 'react-konva';
import { useEffect, useMemo, useRef } from 'react';
import type Konva from 'konva';
import { useDocStore } from '../store/docStore';
import { useActiveTool } from '../tools/useActiveTool';
import { TextNode } from './nodes/TextNode';
import { ImageNode } from './nodes/ImageNode';
import { StrokeNode } from './nodes/StrokeNode';
import { ShapeNode } from './nodes/ShapeNode';
import { handlePointer } from '../tools/handlers';
import { useSelection } from '../store/selectionStore';

type Props = { pageIndex: number; width: number; height: number };

// Global registry so the imperative export pipeline can find each page's Konva Stage
// and rasterize the strokes layer without threading refs through the React tree.
declare global {
  interface Window { __pageStages?: Map<number, Konva.Stage>; }
}

export function PageOverlay({ pageIndex, width, height }: Props) {
  const allEdits = useDocStore((s) => s.edits);
  const edits = useMemo(
    () => allEdits.filter((e) => e.pageIndex === pageIndex),
    [allEdits, pageIndex],
  );
  const tool = useActiveTool((s) => s.tool);
  const selectedId = useSelection((s) => s.id);
  const setSelectedId = useSelection((s) => s.setId);
  const stageRef = useRef<Konva.Stage | null>(null);

  useEffect(() => {
    const map = (window.__pageStages ||= new Map<number, Konva.Stage>());
    if (stageRef.current) map.set(pageIndex, stageRef.current);
    return () => { map.delete(pageIndex); };
  }, [pageIndex]);

  // Split edits into two layers:
  //   strokes-layer – rasterized to PNG on export (strokes & shapes)
  //   text/image layer – embedded natively into the PDF (not rasterized)
  const strokesAndShapes = edits.filter((e) => e.kind === 'stroke' || e.kind === 'shape');
  const textsAndImages = edits.filter((e) => e.kind === 'text' || e.kind === 'image');

  return (
    <Stage
      ref={stageRef}
      width={width} height={height}
      style={{ position: 'absolute', top: 0, left: 0 }}
      onMouseDown={(ev) => handlePointer('down', ev, { tool, pageIndex })}
      onMouseMove={(ev) => handlePointer('move', ev, { tool, pageIndex })}
      onMouseUp={(ev) => handlePointer('up', ev, { tool, pageIndex })}
    >
      <Layer name="strokes-layer">
        {strokesAndShapes.map((e) => {
          const sel = e.id === selectedId;
          const onSelect = () => setSelectedId(e.id);
          if (e.kind === 'stroke') return <StrokeNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
          return <ShapeNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
        })}
      </Layer>
      <Layer>
        {textsAndImages.map((e) => {
          const sel = e.id === selectedId;
          const onSelect = () => setSelectedId(e.id);
          if (e.kind === 'text') return <TextNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
          return <ImageNode key={e.id} e={e} selected={sel} onSelect={onSelect} />;
        })}
      </Layer>
    </Stage>
  );
}
