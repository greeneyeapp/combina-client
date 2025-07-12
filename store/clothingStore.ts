// store/clothingStore.ts - Clean gallery reference system only

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage';
import * as MediaLibrary from 'expo-media-library';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  colors?: string[];
  season: string[];
  style: string;
  notes: string;
  createdAt: string;

  // Gallery reference system
  galleryAssetId?: string;  // MediaLibrary.Asset.id
  
  isImageMissing?: boolean;
  imageMetadata?: {
    width: number;
    height: number;
    fileSize?: number;
    mimeType?: string;
  };
};

interface ClothingState {
  clothing: ClothingItem[];
  isValidated: boolean;
  isValidating: boolean;

  setClothing: (newClothing: ClothingItem[]) => void;
  addClothing: (item: ClothingItem) => void;
  removeClothing: (id: string) => void;
  updateClothing: (id: string, updatedItem: Partial<ClothingItem>) => void;
  clearAllClothing: () => void;
  validateClothingImages: () => Promise<{ updatedCount: number; removedCount: number }>;
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
}

// Gallery asset helper
const getAssetById = async (assetId: string): Promise<MediaLibrary.Asset | null> => {
  try {
    let found: MediaLibrary.Asset | null = null;
    let after: string | undefined = undefined;
    
    while (!found) {
      const batch = await MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: [MediaLibrary.MediaType.photo],
        after,
      });
      
      found = batch.assets.find(a => a.id === assetId) || null;
      
      if (!batch.hasNextPage) break;
      after = batch.endCursor;
    }
    
    return found;
  } catch (error) {
    console.error('Error getting asset by ID:', error);
    return null;
  }
};

// Gallery validation function
const validateGalleryAssets = async (): Promise<{ 
  validCount: number; 
  removedCount: number; 
  updatedCount: number; 
}> => {
  const { clothing, updateClothing, removeClothing } = useClothingStore.getState();
  let validCount = 0;
  let removedCount = 0;
  let updatedCount = 0;

  console.log('🔍 Validating gallery assets...');

  for (const item of clothing) {
    if (!item.galleryAssetId) {
      if (!item.isImageMissing) {
        await updateClothing(item.id, { isImageMissing: true });
        updatedCount++;
      }
      continue;
    }

    try {
      const asset = await getAssetById(item.galleryAssetId);
      
      if (asset) {
        validCount++;
        if (item.isImageMissing) {
          await updateClothing(item.id, { isImageMissing: false });
          updatedCount++;
        }
      } else {
        await removeClothing(item.id);
        removedCount++;
        console.log(`🗑️ Removed item ${item.name} - gallery asset deleted`);
      }
    } catch (error) {
      console.error(`Error validating asset for item ${item.id}:`, error);
      await removeClothing(item.id);
      removedCount++;
    }
  }

  console.log(`📊 Gallery validation completed: ${validCount} valid, ${updatedCount} updated, ${removedCount} removed`);
  return { validCount, removedCount, updatedCount };
};

export const useClothingStore = create<ClothingState>()(
  persist(
    (set, get) => ({
      clothing: [],
      isValidated: false,
      isValidating: false,

      setClothing: (newClothing) => set({ clothing: newClothing }),

      addClothing: (item) => {
        const processedItem = {
          ...item,
          colors: item.colors || [item.color],
          isImageMissing: !item.galleryAssetId,
        };

        set((state) => ({
          clothing: [...state.clothing, processedItem],
        }));

        console.log('✅ Added clothing item with gallery reference:', {
          id: item.id,
          galleryAssetId: item.galleryAssetId
        });
      },

      removeClothing: (id) => {
        set((state) => ({
          clothing: state.clothing.filter((item) => item.id !== id)
        }));
      },

      updateClothing: (id, updatedItem) => {
        const state = get();
        const currentItem = state.clothing.find((item) => item.id === id);
        if (!currentItem) return;

        const updated = {
          ...currentItem,
          ...updatedItem,
        };

        if (updated.colors && updated.colors.length > 0) {
          updated.color = updated.colors[0];
        }

        set({
          clothing: state.clothing.map((item) =>
            item.id === id ? updated : item
          ),
        });

        console.log('✅ Updated clothing item:', {
          id,
          galleryAssetId: updated.galleryAssetId
        });
      },

      clearAllClothing: () => {
        set({
          clothing: [],
          isValidated: false
        });
      },

      setValidated: (validated) => set({ isValidated: validated }),
      setValidating: (validating) => set({ isValidating: validating }),

      validateClothingImages: async () => {
        const { isValidated, isValidating } = get();
        if (isValidated || isValidating) return { updatedCount: 0, removedCount: 0 };

        set({ isValidating: true });
        
        try {
          const result = await validateGalleryAssets();
          set({ isValidated: true, isValidating: false });
          return { updatedCount: result.updatedCount, removedCount: result.removedCount };
        } catch (error) {
          console.error('❌ Error validating images:', error);
          set({ isValidating: false });
          return { updatedCount: 0, removedCount: 0 };
        }
      }
    }),
    {
      name: 'clothing-storage',
      storage: createJSONStorage(() => simpleStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isValidated = false;
          state.isValidating = false;

          // Sadece validation
          setTimeout(() => {
            state.validateClothingImages();
          }, 1000);
        }
      }
    }
  )
);