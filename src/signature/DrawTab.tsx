import { useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';

export function DrawTab({ onResult }: { onResult: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [color, setColor] = useState('#111');

  useEffect(() => {
    if (!ref.current) return;
    padRef.current = new SignaturePad(ref.current, { penColor: color, backgroundColor: 'rgba(0,0,0,0)' });
    return () => padRef.current?.off();
  }, []);
  useEffect(() => { if (padRef.current) padRef.current.penColor = color; }, [color]);

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={ref} width={500} height={180} className="border rounded bg-white" />
      <div className="flex gap-2 items-center">
        <button className="px-2 py-1 border rounded" onClick={() => padRef.current?.clear()}>Clear</button>
        <label><input type="radio" checked={color==='#111'} onChange={() => setColor('#111')} /> Black</label>
        <label><input type="radio" checked={color==='#1d4ed8'} onChange={() => setColor('#1d4ed8')} /> Blue</label>
        <button className="ml-auto px-3 py-1 bg-blue-600 text-white rounded"
          onClick={() => {
            if (!padRef.current || padRef.current.isEmpty()) return;
            onResult(padRef.current.toDataURL('image/png'));
          }}>Use</button>
      </div>
    </div>
  );
}
