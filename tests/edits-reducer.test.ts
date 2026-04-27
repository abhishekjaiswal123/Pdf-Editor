import { describe, it, expect, beforeEach } from 'vitest';
import { useDocStore } from '../src/store/docStore';

describe('docStore', () => {
  beforeEach(() => useDocStore.getState().reset());

  it('adds an edit', () => {
    useDocStore.getState().addEdit({
      id: 'e1', pageIndex: 0, kind: 'text',
      x: 10, y: 20, text: 'hi', fontSize: 16, color: '#000',
    });
    expect(useDocStore.getState().edits).toHaveLength(1);
  });

  it('updates an edit', () => {
    useDocStore.getState().addEdit({
      id: 'e1', pageIndex: 0, kind: 'text',
      x: 10, y: 20, text: 'hi', fontSize: 16, color: '#000',
    });
    useDocStore.getState().updateEdit('e1', { x: 99 });
    const e = useDocStore.getState().edits[0];
    expect(e.kind === 'text' && e.x).toBe(99);
  });

  it('removes an edit', () => {
    useDocStore.getState().addEdit({
      id: 'e1', pageIndex: 0, kind: 'text',
      x: 0, y: 0, text: '', fontSize: 16, color: '#000',
    });
    useDocStore.getState().removeEdit('e1');
    expect(useDocStore.getState().edits).toHaveLength(0);
  });

  it('undo restores a removed edit', () => {
    const e = { id: 'e1', pageIndex: 0, kind: 'text' as const,
      x: 0, y: 0, text: 't', fontSize: 16, color: '#000' };
    useDocStore.getState().addEdit(e);
    useDocStore.getState().removeEdit('e1');
    useDocStore.getState().undo();
    expect(useDocStore.getState().edits).toHaveLength(1);
  });
});
