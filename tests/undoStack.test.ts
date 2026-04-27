import { describe, it, expect } from 'vitest';
import { createUndoStack } from '../src/store/undoStack';

describe('undoStack', () => {
  it('pushes, undoes, redoes', () => {
    const log: string[] = [];
    const s = createUndoStack(100);
    s.push({ do: () => log.push('do1'), undo: () => log.push('undo1') });
    s.push({ do: () => log.push('do2'), undo: () => log.push('undo2') });
    s.undo(); // undo2
    s.undo(); // undo1
    s.redo(); // do1
    expect(log).toEqual(['undo2', 'undo1', 'do1']);
  });

  it('caps at max entries', () => {
    const s = createUndoStack(2);
    s.push({ do: () => {}, undo: () => {} });
    s.push({ do: () => {}, undo: () => {} });
    s.push({ do: () => {}, undo: () => {} });
    expect(s.size()).toBe(2);
  });
});
