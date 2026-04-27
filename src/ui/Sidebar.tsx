import { useEffect, useState } from 'react';
import type { LoadedPdf } from '../pdf/usePdfDocument';

export function Sidebar({ doc, onJump }: { doc: LoadedPdf; onJump: (i: number) => void }) {
  const [thumbs, setThumbs] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const urls: string[] = [];
      for (let i = 0; i < doc.numPages; i++) {
        const page = await doc.getPage(i + 1);
        const viewport = page.getViewport({ scale: 0.2 });
        const c = document.createElement('canvas');
        c.width = viewport.width; c.height = viewport.height;
        await page.render({ canvas: c, viewport } as any).promise;
        urls.push(c.toDataURL('image/png'));
      }
      if (!cancelled) setThumbs(urls);
    })();
    return () => { cancelled = true; };
  }, [doc]);
  return (
    <div className="w-32 border-r overflow-auto p-2 flex flex-col gap-2 bg-white">
      {thumbs.map((src, i) => (
        <button key={i} onClick={() => onJump(i)} className="border hover:border-blue-500 rounded">
          <img src={src} className="w-full" />
          <div className="text-xs text-center">{i + 1}</div>
        </button>
      ))}
    </div>
  );
}
