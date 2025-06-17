import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string;
  notes: string;
  imageUri: string;
  createdAt: string;
};

interface ClothingState {
  clothing: ClothingItem[];
  addClothing: (item: ClothingItem) => void;
  removeClothing: (id: string) => void;
  updateClothing: (id: string, updatedItem: Partial<ClothingItem>) => void;
  clearAllClothing: () => void;
}

export const useClothingStore = create<ClothingState>()(
  persist(
    (set) => ({
      clothing: [],
      addClothing: (item) => set((state) => {
        return { clothing: [...state.clothing, item] };
      }),
      removeClothing: (id) => set((state) => ({
        clothing: state.clothing.filter((item) => item.id !== id)
      })),
      updateClothing: (id, updatedItem) => set((state) => ({
        clothing: state.clothing.map((item) =>
          item.id === id ? { ...item, ...updatedItem } : item
        ),
      })),
      clearAllClothing: () => set({ clothing: [] }),
    }),
    {
      name: 'clothing-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);