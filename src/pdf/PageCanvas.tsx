import { useEffect, useRef } from 'react';
import type { LoadedPdf } from './usePdfDocument';

type Props = { doc: LoadedPdf; pageIndex: number; scale: number; onSize?: (w: number, h: number) => void };

export function PageCanvas({ doc, pageIndex, scale, onSize }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const page = await doc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale });
      const canvas = ref.current;
      if (!canvas || cancelled) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      onSize?.(viewport.width, viewport.height);
    })();
    return () => { cancelled = true; };
  }, [doc, pageIndex, scale, onSize]);

  return <canvas ref={ref} className="block shadow-md bg-white" />;
}
