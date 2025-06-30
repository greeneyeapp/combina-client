import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { fileSystemStorage } from '@/utils/fileSystemStorage';

export type Outfit = {
  id: string;
  items: string[]; // Array of clothing item ids
  occasion: string;
  weather: string;
  date: string;
  description: string;     // eklendi
  suggestion_tip: string;  // eklendi
};

interface OutfitState {
  outfits: Outfit[];
  addOutfit: (outfit: Outfit) => void;
  removeOutfit: (id: string) => void;
  clearAllOutfits: () => void;
}

export const useOutfitStore = create<OutfitState>()(
  persist(
    (set) => ({
      outfits: [],
      addOutfit: (outfit) => set((state) => ({
        outfits: [outfit, ...state.outfits]
      })),
      removeOutfit: (id) => set((state) => ({
        outfits: state.outfits.filter((outfit) => outfit.id !== id)
      })),
      clearAllOutfits: () => set({ outfits: [] }),
    }),
    {
      name: 'outfit-storage',
      storage: createJSONStorage(() => fileSystemStorage),
    }
  )
);