// kodlar/store/clothingStore.ts

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage'; // Basit storage
import { 
  validateGalleryUri, 
  cleanupUnusedThumbnails,
  GalleryImageResult 
} from '@/utils/galleryImageStorage';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string;
  notes: string;
  
  // YENİ: Galeri referans sistemi
  originalImageUri: string;       // Gerçek galeri URI'si (content:// veya file://)
  thumbnailImageUri?: string;     // Cache'deki thumbnail (optional)
  galleryAssetId?: string;        // MediaLibrary asset ID (backup)
  
  // Eski sistem (migration için)
  imageUri?: string;              // DEPRECATED - sadece migration için
  
  createdAt: string;
  
  // Metadata
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
  validateClothingImages: () => Promise<{ removedCount: number } | void>;
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
  
  // YENİ: Galeri referans sistemi fonksiyonları
  migrateToNewImageSystem: () => Promise<{ migratedCount: number; failedCount: number }>;
  validateGalleryReferences: () => Promise<{ validCount: number; invalidCount: number }>;
  cleanupThumbnailCache: () => Promise<{ deletedCount: number; freedSpace: number }>;
}

// Görsel URI'sinin hala geçerli olup olmadığını kontrol et
const checkImageExists = async (item: ClothingItem): Promise<boolean> => {
  try {
    // Yeni sistem: originalImageUri kontrolü
    if (item.originalImageUri) {
      return await validateGalleryUri(item.originalImageUri);
    }
    
    // Eski sistem: imageUri kontrolü (migration için)
    if (item.imageUri) {
      // HTTP/HTTPS URL'leri için
      if (item.imageUri.startsWith('http')) {
        return true; // Network URL'leri için varsayılan olarak true döndür
      }
      
      // File system URI'leri için basit bir kontrol
      if (item.imageUri.startsWith('file://')) {
        const response = await fetch(item.imageUri, { method: 'HEAD' });
        return response.ok;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`Error checking image exists for item: ${item.id}`, error);
    return false;
  }
};

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export const useClothingStore = create<ClothingState>()(
  persist(
    (set, get) => ({
      clothing: [],
      isValidated: false,
      isValidating: false,
      
      // YENİ FONKSİYONUN TANIMI
      setClothing: (newClothing) => set({ clothing: newClothing }),
      
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
      
      clearAllClothing: () => set({ 
        clothing: [],
        isValidated: false 
      }),
      
      setValidated: (validated) => set({ isValidated: validated }),
      setValidating: (validating) => set({ isValidating: validating }),
      
      validateClothingImages: async () => {
        const { clothing, isValidated, isValidating } = get();
        
        if (isValidated || isValidating) return;
        
        set({ isValidating: true });
                
        try {
          if (clothing.length === 0) {
            set({ isValidated: true, isValidating: false });
            return;
          }
          
          const validItems: ClothingItem[] = [];
          let removedCount = 0;
          
          for (const item of clothing) {
            const exists = await checkImageExists(item);
            if (exists) {
              validItems.push(item);
            } else {
              removedCount++;
              console.warn(`Removing item ${item.name} - image no longer exists`);
            }
          }
          
          if (removedCount > 0) {
            set({ 
              clothing: validItems,
              isValidated: true,
              isValidating: false 
            });
            return { removedCount };
          } else {
            set({ 
              isValidated: true,
              isValidating: false 
            });
            console.log('All clothing images are valid');
          }
          
        } catch (error) {
          console.error('Error validating images:', error);
          set({ 
            isValidated: true,
            isValidating: false 
          }); 
        }
      },
      
      // YENİ: Eski sistem -> Yeni sistem migration
      migrateToNewImageSystem: async () => {
        const { clothing } = get();
        const itemsToMigrate = clothing.filter(item => item.imageUri && !item.originalImageUri);
        
        if (itemsToMigrate.length === 0) {
          return { migratedCount: 0, failedCount: 0 };
        }
        
        console.log(`Starting migration for ${itemsToMigrate.length} items...`);
        
        let migratedCount = 0;
        let failedCount = 0;
        const updatedClothing = [...clothing];
        
        for (const item of itemsToMigrate) {
          try {
            // Eski imageUri'yi originalImageUri olarak kullan
            const itemIndex = updatedClothing.findIndex(c => c.id === item.id);
            if (itemIndex !== -1) {
              updatedClothing[itemIndex] = {
                ...item,
                originalImageUri: item.imageUri!,
                // imageUri'yi kaldırma - backward compatibility için tut
              };
              migratedCount++;
            }
          } catch (error) {
            console.error(`Failed to migrate item ${item.id}:`, error);
            failedCount++;
          }
        }
        
        if (migratedCount > 0) {
          set({ clothing: updatedClothing });
          console.log(`Migration completed: ${migratedCount} migrated, ${failedCount} failed`);
        }
        
        return { migratedCount, failedCount };
      },
      
      // YENİ: Galeri referanslarını doğrula
      validateGalleryReferences: async () => {
        const { clothing } = get();
        let validCount = 0;
        let invalidCount = 0;
        
        for (const item of clothing) {
          if (item.originalImageUri) {
            const isValid = await validateGalleryUri(item.originalImageUri);
            if (isValid) {
              validCount++;
            } else {
              invalidCount++;
              console.warn(`Invalid gallery reference for item: ${item.name} (${item.id})`);
            }
          }
        }
        
        console.log(`Gallery validation: ${validCount} valid, ${invalidCount} invalid`);
        return { validCount, invalidCount };
      },
      
      // YENİ: Thumbnail cache temizliği
      cleanupThumbnailCache: async () => {
        const { clothing } = get();
        const activeItemIds = clothing.map(item => item.id);
        
        try {
          const result = await cleanupUnusedThumbnails(activeItemIds);
          console.log(`Thumbnail cleanup: ${result.deletedCount} deleted, ${result.freedSpace} bytes freed`);
          return result;
        } catch (error) {
          console.error('Error during thumbnail cleanup:', error);
          return { deletedCount: 0, freedSpace: 0 };
        }
      }
    }),
    {
      name: 'clothing-storage-v2', // Version bump for clean migration
      storage: createJSONStorage(() => simpleStorage),
      
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isValidated = false;
          state.isValidating = false;
        }
      },
    }
  )
);