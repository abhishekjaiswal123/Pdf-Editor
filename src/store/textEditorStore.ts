import { create } from 'zustand';

type Pos = { pageIndex: number; x: number; y: number };
type S = {
  active: Pos | null;
  begin: (p: Pos) => void;
  cancel: () => void;
};

export const useTextEditor = create<S>((set) => ({
  active: null,
  begin: (active) => set({ active }),
  cancel: () => set({ active: null }),
}));
