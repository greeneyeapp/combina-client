// store/clothingStore.ts - Tekrarları önlenmiş file system based image storage

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage';
import { deleteImage, checkImageExists, cleanupOrphanedImages } from '@/utils/fileSystemImageManager';

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

  // File system based image storage
  originalImagePath: string;    // "item_123456.jpg"
  thumbnailImagePath: string;   // "item_123456_thumb.jpg"
  
  imageMetadata?: {
    width: number;
    height: number;
    fileSize?: number;
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
  cleanupOrphanedFiles: () => Promise<{ removedCount: number; freedSpace: number }>;
}

// Global validation flag to prevent multiple simultaneous validations
let isGlobalValidationRunning = false;
let validationExecuted = false;

// File system validation function
const validateFileSystemAssets = async (): Promise<{ 
  validCount: number; 
  removedCount: number; 
  updatedCount: number; 
}> => {
  const { clothing, removeClothing } = useClothingStore.getState();
  let validCount = 0;
  let removedCount = 0;
  let updatedCount = 0;

  console.log('🔍 Validating file system assets...');

  for (const item of clothing) {
    if (!item.originalImagePath || !item.thumbnailImagePath) {
      await removeClothing(item.id);
      removedCount++;
      console.log(`🗑️ Removed item ${item.name} - missing image paths`);
      continue;
    }

    try {
      // Check if both original and thumbnail exist
      const originalExists = await checkImageExists(item.originalImagePath, false);
      const thumbnailExists = await checkImageExists(item.thumbnailImagePath, true);
      
      if (originalExists && thumbnailExists) {
        validCount++;
      } else {
        await removeClothing(item.id);
        removedCount++;
        console.log(`🗑️ Removed item ${item.name} - image files missing`);
      }
    } catch (error) {
      console.error(`Error validating files for item ${item.id}:`, error);
      await removeClothing(item.id);
      removedCount++;
    }
  }

  console.log(`📊 File system validation completed: ${validCount} valid, ${updatedCount} updated, ${removedCount} removed`);
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
        };

        set((state) => ({
          clothing: [...state.clothing, processedItem],
        }));

        console.log('✅ Added clothing item with file system storage:', {
          id: item.id,
          originalImage: item.originalImagePath,
          thumbnailImage: item.thumbnailImagePath
        });
      },

      removeClothing: async (id) => {
        const state = get();
        const itemToRemove = state.clothing.find((item) => item.id === id);
        
        if (itemToRemove && itemToRemove.originalImagePath && itemToRemove.thumbnailImagePath) {
          try {
            await deleteImage(itemToRemove.originalImagePath, itemToRemove.thumbnailImagePath);
          } catch (error) {
            console.error('Failed to delete image files:', error);
            // Continue with removal even if file deletion fails
          }
        }

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
          originalImage: updated.originalImagePath,
          thumbnailImage: updated.thumbnailImagePath
        });
      },

      clearAllClothing: async () => {
        const { clothing } = get();
        
        // Delete all image files
        for (const item of clothing) {
          if (item.originalImagePath && item.thumbnailImagePath) {
            try {
              await deleteImage(item.originalImagePath, item.thumbnailImagePath);
            } catch (error) {
              console.error('Failed to delete image files for item:', item.id, error);
            }
          }
        }

        set({
          clothing: [],
          isValidated: false
        });

        // Reset global validation flags
        isGlobalValidationRunning = false;
        validationExecuted = false;
      },

      setValidated: (validated) => set({ isValidated: validated }),
      setValidating: (validating) => set({ isValidating: validating }),

      validateClothingImages: async () => {
        const { isValidated, isValidating } = get();
        
        // Multiple prevention checks
        if (isValidated || isValidating || isGlobalValidationRunning || validationExecuted) {
          console.log('📋 File system validation already completed or in progress, skipping...');
          return { updatedCount: 0, removedCount: 0 };
        }

        console.log('🔄 Starting file system validation...');
        isGlobalValidationRunning = true;
        validationExecuted = true;
        set({ isValidating: true });
        
        try {
          const result = await validateFileSystemAssets();
          set({ isValidated: true, isValidating: false });
          return { updatedCount: result.updatedCount, removedCount: result.removedCount };
        } catch (error) {
          console.error('❌ Error validating images:', error);
          set({ isValidating: false });
          return { updatedCount: 0, removedCount: 0 };
        } finally {
          isGlobalValidationRunning = false;
        }
      },

      cleanupOrphanedFiles: async () => {
        const { clothing } = get();
        
        // Get all used file names
        const usedFileNames = new Set<string>();
        clothing.forEach(item => {
          if (item.originalImagePath) usedFileNames.add(item.originalImagePath);
          if (item.thumbnailImagePath) usedFileNames.add(item.thumbnailImagePath);
        });

        try {
          return await cleanupOrphanedImages(Array.from(usedFileNames));
        } catch (error) {
          console.error('❌ Error cleaning up orphaned files:', error);
          return { removedCount: 0, freedSpace: 0 };
        }
      }
    }),
    {
      name: 'clothing-storage',
      storage: createJSONStorage(() => simpleStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Reset validation state on rehydration
          state.isValidated = false;
          state.isValidating = false;

          // Single validation with multiple safety checks
          if (!validationExecuted && !isGlobalValidationRunning) {
            console.log('📋 Scheduling file system validation after rehydration...');
            
            setTimeout(() => {
              // Final safety check before validation
              if (!validationExecuted && !isGlobalValidationRunning && !state.isValidated && !state.isValidating) {
                console.log('🔄 Executing scheduled file system validation...');
                state.validateClothingImages();
              } else {
                console.log('📋 File system validation already handled, skipping scheduled validation');
              }
            }, 2000); // 2 second delay to ensure everything is loaded
          }
        }
      }
    }
  )
);

// Development utility to reset validation state
if (__DEV__) {
  (global as any).resetClothingValidation = () => {
    const store = useClothingStore.getState();
    store.setValidated(false);
    store.setValidating(false);
    isGlobalValidationRunning = false;
    validationExecuted = false;
    console.log('🔄 Clothing validation state reset');
  };
}