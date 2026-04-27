import { create } from 'zustand';
type S = { id: string | null; setId: (id: string | null) => void };
export const useSelection = create<S>((set) => ({ id: null, setId: (id) => set({ id }) }));
