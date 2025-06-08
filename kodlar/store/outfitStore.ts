import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Outfit = {
  id: string;
  items: string[]; // Array of clothing item ids
  occasion: string;
  weather: string;
  date: string;
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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);