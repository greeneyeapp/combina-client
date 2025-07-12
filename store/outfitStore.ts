import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage'; // Güncellendi

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
  
  // YENİ: Orphaned outfits temizleme
  cleanupOrphanedOutfits: (validClothingIds: string[]) => Promise<{ removedCount: number }>;
}

export const useOutfitStore = create<OutfitState>()(
  persist(
    (set, get) => ({
      outfits: [],
      addOutfit: (outfit) => set((state) => ({
        outfits: [outfit, ...state.outfits]
      })),
      removeOutfit: (id) => set((state) => ({
        outfits: state.outfits.filter((outfit) => outfit.id !== id)
      })),
      clearAllOutfits: () => set({ outfits: [] }),
      
      // YENİ: Tamamen orphaned outfit'leri temizle
      cleanupOrphanedOutfits: async (validClothingIds: string[]) => {
        const { outfits } = get();
        const validClothingIdSet = new Set(validClothingIds);
        
        // Tamamen geçersiz outfit'leri bul (hiç item'ı kalmamış)
        const validOutfits = outfits.filter(outfit => {
          const validItems = outfit.items.filter(itemId => validClothingIdSet.has(itemId));
          return validItems.length > 0; // En az 1 item varsa tutulur
        });
        
        const removedCount = outfits.length - validOutfits.length;
        
        if (removedCount > 0) {
          set({ outfits: validOutfits });
          console.log(`Cleaned up ${removedCount} orphaned outfits`);
        }
        
        return { removedCount };
      }
    }),
    {
      name: 'outfit-storage',
      storage: createJSONStorage(() => simpleStorage),
    }
  )
);