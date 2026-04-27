import { useEffect, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import type { ImageEdit } from '../../store/types';
import { useDocStore } from '../../store/docStore';

export function ImageNode({ e, onSelect }: { e: ImageEdit; selected: boolean; onSelect: () => void }) {
  const update = useDocStore((s) => s.updateEdit);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  useEffect(() => {
    const i = new window.Image();
    i.src = e.dataUrl;
    i.onload = () => setImg(i);
  }, [e.dataUrl]);
  if (!img) return null;
  return (
    <KonvaImage
      x={e.x} y={e.y} width={e.w} height={e.h} image={img} rotation={e.rotation}
      draggable onClick={onSelect} onTap={onSelect}
      onDragEnd={(ev) => update(e.id, { x: ev.target.x(), y: ev.target.y() })}
    />
  );
}
