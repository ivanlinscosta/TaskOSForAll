import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ContextMode = 'work' | 'life';

interface AppState {
  contextMode: ContextMode;
  sidebarCollapsed: boolean;
  vagasAtivas: boolean;
  vagasDismissed: boolean;
  user: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
    photoURL?: string;
  } | null;
  setContextMode: (mode: ContextMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setUser: (user: AppState['user']) => void;
  setVagasAtivas: (v: boolean) => void;
  setVagasDismissed: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      contextMode: 'work',
      sidebarCollapsed: false,
      vagasAtivas: false,
      vagasDismissed: false,
      user: null,
      setContextMode: (mode) => set({ contextMode: mode }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setUser: (user) => set({ user }),
      setVagasAtivas: (v) => set({ vagasAtivas: v }),
      setVagasDismissed: (v) => set({ vagasDismissed: v }),
    }),
    {
      name: 'taskos-forall-storage',
    },
  ),
);
