import { create } from 'zustand';
import type { Tool } from './types';

type S = { tool: Tool; setTool: (t: Tool) => void };
export const useActiveTool = create<S>((set) => ({
  tool: 'select',
  setTool: (tool) => set({ tool }),
}));
