import { useEffect, useRef, useState } from 'react';
import { useTextEditor } from '../store/textEditorStore';
import { useDocStore } from '../store/docStore';

const FONT_SIZE = 16;

export function TextEditor({ pageIndex }: { pageIndex: number }) {
  const active = useTextEditor((s) => s.active);
  const cancel = useTextEditor((s) => s.cancel);
  const addEdit = useDocStore((s) => s.addEdit);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState('');

  const isMine = active?.pageIndex === pageIndex;

  useEffect(() => {
    if (isMine) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isMine]);

  if (!active || !isMine) return null;

  const commit = () => {
    const text = value.trim();
    if (text) {
      addEdit({
        id: crypto.randomUUID(),
        pageIndex,
        kind: 'text',
        x: active.x,
        y: active.y,
        text,
        fontSize: FONT_SIZE,
        color: '#111111',
      });
    }
    cancel();
  };

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); cancel(); }
      }}
      placeholder="Type text…"
      style={{
        position: 'absolute',
        left: active.x,
        top: active.y,
        border: '1px dashed #2563eb',
        background: 'rgba(255,255,255,0.95)',
        font: `${FONT_SIZE}px sans-serif`,
        color: '#111',
        padding: '1px 4px',
        outline: 'none',
        zIndex: 30,
        minWidth: 100,
      }}
    />
  );
}
