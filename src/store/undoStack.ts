export type Command = { do: () => void; undo: () => void };

export function createUndoStack(max: number) {
  let past: Command[] = [];
  let future: Command[] = [];
  return {
    push(c: Command) {
      past.push(c);
      if (past.length > max) past.shift();
      future = [];
    },
    undo() {
      const c = past.pop();
      if (!c) return;
      c.undo();
      future.push(c);
    },
    redo() {
      const c = future.pop();
      if (!c) return;
      c.do();
      past.push(c);
    },
    size: () => past.length,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    clear() { past = []; future = []; },
  };
}
