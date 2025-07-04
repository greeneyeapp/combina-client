// store/clothingStore.ts - Asset ID migration ile güncellenmiş
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage';
import { Platform } from 'react-native';
import { validateGalleryUri } from '@/utils/galleryImageStorage';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string;
  notes: string;
  
  originalImageUri: string;    // Yeni sistem: iOS'ta ph://, Android'de content://
  thumbnailImageUri?: string;  // Local thumbnail path
  galleryAssetId?: string;     // MediaLibrary asset ID
  
  imageUri?: string;          // DEPRECATED - legacy support
  
  createdAt: string;
  
  imageMetadata?: {
    width: number;
    height: number;
    fileSize?: number;
    mimeType?: string;
  };

  isImageMissing?: boolean;   // Resmin kayıp olup olmadığını belirten işaret
};

interface ClothingState {
  clothing: ClothingItem[];
  isValidated: boolean;
  isValidating: boolean;
  isMigrated: boolean;        // Asset ID migration durumu
  
  setClothing: (newClothing: ClothingItem[]) => void;
  addClothing: (item: ClothingItem) => void;
  removeClothing: (id: string) => void;
  updateClothing: (id: string, updatedItem: Partial<ClothingItem>) => void;
  clearAllClothing: () => void;
  validateClothingImages: () => Promise<{ updatedCount: number }>;
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
  
  // Asset ID migration
  migrateToAssetIdSystem: () => Promise<{ migratedCount: number }>;
  setMigrated: (migrated: boolean) => void;
  
  cleanupThumbnailCache: () => Promise<{ deletedCount: number; freedSpace: number }>;
}

const checkImageExists = async (item: ClothingItem): Promise<boolean> => {
    if (item.isImageMissing) return false;
    if (!item.originalImageUri) return false;
    return await validateGalleryUri(item.originalImageUri);
};

/**
 * Legacy file:// URI'lerini asset ID tabanlı sisteme migrate eder
 */
const migrateItemToAssetId = (item: ClothingItem): ClothingItem => {
  // Eğer zaten yeni formattaysa migration gerekmez
  if (Platform.OS === 'ios' && item.originalImageUri?.startsWith('ph://')) {
    return item; // Zaten yeni format
  }
  
  if (Platform.OS === 'android' && item.originalImageUri?.startsWith('content://')) {
    return item; // Android için zaten doğru format
  }

  // Legacy file:// URI'leri için asset ID sistemi
  if (item.galleryAssetId) {
    // Asset ID varsa persistent URI oluştur
    const persistentUri = Platform.OS === 'ios' 
      ? `ph://${item.galleryAssetId}`
      : item.originalImageUri; // Android için mevcut URI'yi kullan

    return {
      ...item,
      originalImageUri: persistentUri
    };
  }

  // Asset ID yoksa item'ı kayıp olarak işaretle
  console.warn('⚠️ Migrating item without asset ID to missing:', item.name);
  return {
    ...item,
    isImageMissing: true
  };
};

export const useClothingStore = create<ClothingState>()(
  persist(
    (set, get) => ({
      clothing: [],
      isValidated: false,
      isValidating: false,
      isMigrated: false,
      
      setClothing: (newClothing) => set({ clothing: newClothing }),
      
      addClothing: (item) => set((state) => ({ 
        clothing: [...state.clothing, { ...item, isImageMissing: false }]
      })),
      
      removeClothing: (id) => set((state) => ({
        clothing: state.clothing.filter((item) => item.id !== id)
      })),
      
      updateClothing: (id, updatedItem) => set((state) => ({
        clothing: state.clothing.map((item) =>
          item.id === id ? { ...item, ...updatedItem } : item
        ),
      })),
      
      clearAllClothing: () => set({ 
        clothing: [],
        isValidated: false,
        isMigrated: false
      }),
      
      setValidated: (validated) => set({ isValidated: validated }),
      setValidating: (validating) => set({ isValidating: validating }),
      setMigrated: (migrated) => set({ isMigrated: migrated }),
      
      // Asset ID Migration
      migrateToAssetIdSystem: async () => {
        const { clothing, isMigrated } = get();
        
        if (isMigrated) {
          console.log('✅ Asset ID migration already completed');
          return { migratedCount: 0 };
        }
        
        console.log('🔄 Starting asset ID migration...');
        
        let migratedCount = 0;
        const migratedItems = clothing.map(item => {
          const originalUri = item.originalImageUri;
          const migratedItem = migrateItemToAssetId(item);
          
          if (migratedItem.originalImageUri !== originalUri || migratedItem.isImageMissing !== item.isImageMissing) {
            migratedCount++;
            console.log(`📦 Migrated item: ${item.name}`);
          }
          
          return migratedItem;
        });
        
        set({ 
          clothing: migratedItems,
          isMigrated: true 
        });
        
        console.log(`✅ Asset ID migration completed: ${migratedCount} items migrated`);
        return { migratedCount };
      },
      
      validateClothingImages: async () => {
        const { clothing, isValidated, isValidating, updateClothing } = get();
        
        if (isValidated || isValidating) return { updatedCount: 0 };
        
        set({ isValidating: true });
                
        let updatedCount = 0;
        try {
          if (clothing.length === 0) {
            set({ isValidated: true, isValidating: false });
            return { updatedCount: 0 };
          }
          
          for (const item of clothing) {
            const exists = await checkImageExists(item);
            if (!exists && !item.isImageMissing) {
              updateClothing(item.id, { isImageMissing: true });
              updatedCount++;
              console.warn(`⚠️ Marking item as missing image: ${item.name}`);
            } else if (exists && item.isImageMissing) {
              updateClothing(item.id, { isImageMissing: false });
              console.log(`✅ Image found again for item: ${item.name}`);
            }
          }
          
          set({ isValidated: true, isValidating: false });
          if(updatedCount > 0) {
              console.log(`📊 ${updatedCount} items marked with missing images.`);
          } else {
              console.log('✅ All clothing images are valid.');
          }
          return { updatedCount };
          
        } catch (error) {
          console.error('❌ Error validating images:', error);
          set({ isValidating: false }); 
          return { updatedCount: 0 };
        }
      },
      
      cleanupThumbnailCache: async () => {
        const { clothing } = get();
        const activeItemIds = clothing.map(item => item.id);
        
        try {
          const { cleanupUnusedThumbnails } = await import('@/utils/galleryImageStorage');
          const result = await cleanupUnusedThumbnails(activeItemIds);
          console.log(`🧹 Thumbnail cleanup: ${result.deletedCount} deleted, ${result.freedSpace} bytes freed`);
          return result;
        } catch (error) {
          console.error('❌ Error during thumbnail cleanup:', error);
          return { deletedCount: 0, freedSpace: 0 };
        }
      }
    }),
    {
      name: 'clothing-storage-v3', // Version bump for asset ID system
      storage: createJSONStorage(() => simpleStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isValidated = false;
          state.isValidating = false;
          // isMigrated durumunu koru - persist edilmiş değeri kullan
        }
      },
    }
  )
);