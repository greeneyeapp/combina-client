import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Inspiration = {
  id: string;
  url: string;
  imageUrl: string | null;
  note: string;
  createdAt: string;
};

interface InspirationState {
  inspirations: Inspiration[];
  addInspiration: (inspiration: Inspiration) => void;
  removeInspiration: (id: string) => void;
  updateInspiration: (id: string, updatedInspiration: Partial<Inspiration>) => void;
  clearAllInspirations: () => void;
}

export const useInspirationStore = create<InspirationState>()(
  persist(
    (set) => ({
      inspirations: [],
      addInspiration: (inspiration) => set((state) => ({ 
        inspirations: [inspiration, ...state.inspirations] 
      })),
      removeInspiration: (id) => set((state) => ({ 
        inspirations: state.inspirations.filter((inspiration) => inspiration.id !== id) 
      })),
      updateInspiration: (id, updatedInspiration) => set((state) => ({
        inspirations: state.inspirations.map((inspiration) => 
          inspiration.id === id ? { ...inspiration, ...updatedInspiration } : inspiration
        ),
      })),
      clearAllInspirations: () => set({ inspirations: [] }),
    }),
    {
      name: 'inspiration-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);