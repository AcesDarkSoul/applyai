import { create } from 'zustand';

interface DrawerState {
  /** Left navigation drawer */
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  /** Right profile / settings drawer */
  profileOpen: boolean;
  setProfileOpen: (open: boolean) => void;
  toggleProfile: () => void;
  closeAll: () => void;
}

export const useDrawerStore = create<DrawerState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open, ...(open ? { profileOpen: false } : {}) }),
  toggle: () => {
    const next = !get().open;
    set({ open: next, ...(next ? { profileOpen: false } : {}) });
  },
  profileOpen: false,
  setProfileOpen: (profileOpen) =>
    set({ profileOpen, ...(profileOpen ? { open: false } : {}) }),
  toggleProfile: () => {
    const next = !get().profileOpen;
    set({ profileOpen: next, ...(next ? { open: false } : {}) });
  },
  closeAll: () => set({ open: false, profileOpen: false }),
}));
