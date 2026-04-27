import { useEffect, useState } from 'react';
import { detectFields, type DetectedField } from './detectFields';
import { useDocStore } from '../store/docStore';

export function FormFieldOverlay({ pageIndex, scale }:
  { pageIndex: number; scale: number }) {
  const bytes = useDocStore((s) => s.bytes);
  const fills = useDocStore((s) => s.formFills);
  const setFill = useDocStore((s) => s.setFormFill);
  const [fields, setFields] = useState<DetectedField[]>([]);

  useEffect(() => {
    if (!bytes) return;
    let cancelled = false;
    detectFields(bytes.slice(0)).then((all) => {
      if (!cancelled) setFields(all.filter((f) => f.pageIndex === pageIndex));
    });
    return () => { cancelled = true; };
  }, [bytes, pageIndex]);

  const valueFor = (name: string) => fills.find((f) => f.fieldName === name)?.value;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {fields.map((f) => {
        const left = f.rect.x * scale;
        const top  = (f.pageHeight - f.rect.y - f.rect.h) * scale;
        const w = f.rect.w * scale;
        const h = f.rect.h * scale;
        const style = { position: 'absolute' as const, left, top, width: w, height: h, pointerEvents: 'auto' as const };
        if (f.type === 'checkbox') {
          return <input key={f.name} type="checkbox" style={style}
            checked={!!valueFor(f.name)}
            onChange={(e) => setFill({ fieldName: f.name, value: e.target.checked })} />;
        }
        return <input key={f.name} type="text" style={style}
          className="border border-blue-400 bg-blue-50/40 px-1 text-sm"
          value={(valueFor(f.name) as string) ?? ''}
          onChange={(e) => setFill({ fieldName: f.name, value: e.target.value })} />;
      })}
    </div>
  );
}
