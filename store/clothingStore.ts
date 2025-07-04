import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage';
import { validatePermanentImage, migrateLegacyImages } from '@/utils/permanentImageStorage';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string;
  notes: string;
  
  // YENİ SİSTEM: Kalıcı dosya yolları
  originalImageUri?: string;    // Kalıcı original image path
  thumbnailImageUri?: string;   // Kalıcı thumbnail path
  
  createdAt: string;
  
  imageMetadata?: {
    width: number;
    height: number;
    fileSize?: number;
    mimeType?: string;
  };

  isImageMissing?: boolean;
};

interface ClothingState {
  clothing: ClothingItem[];
  isValidated: boolean;
  isValidating: boolean;
  isMigrated: boolean;
  
  setClothing: (newClothing: ClothingItem[]) => void;
  addClothing: (item: ClothingItem) => void;
  removeClothing: (id: string) => void;
  updateClothing: (id: string, updatedItem: Partial<ClothingItem>) => void;
  clearAllClothing: () => void;
  validateClothingImages: () => Promise<{ updatedCount: number; removedCount: number }>;
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
  migrateToPermanentStorage: () => Promise<{ migratedCount: number }>;
  setMigrated: (migrated: boolean) => void;
}

const checkImageExists = async (item: ClothingItem): Promise<boolean> => {
  if (item.isImageMissing) return false;
  
  // Yeni sistem kontrolü
  if (item.originalImageUri && await validatePermanentImage(item.originalImageUri)) {
    return true;
  }
  
  if (item.thumbnailImageUri && await validatePermanentImage(item.thumbnailImageUri)) {
    return true;
  }
  
  return false;
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
      
      migrateToPermanentStorage: async () => {
        const { isMigrated } = get();
        
        if (isMigrated) {
          console.log('✅ Permanent storage migration already completed');
          return { migratedCount: 0 };
        }
        
        console.log('🔄 Starting permanent storage migration...');
        
        try {
          await migrateLegacyImages();
          set({ isMigrated: true });
          console.log('✅ Permanent storage migration completed');
          return { migratedCount: 1 };
        } catch (error) {
          console.error('❌ Permanent storage migration failed:', error);
          return { migratedCount: 0 };
        }
      },
      
      validateClothingImages: async () => {
        const { clothing, isValidated, isValidating, updateClothing, removeClothing } = get();
        
        if (isValidated || isValidating) return { updatedCount: 0, removedCount: 0 };
        
        set({ isValidating: true });
                
        let updatedCount = 0;
        let removedCount = 0;
        
        try {
          if (clothing.length === 0) {
            set({ isValidated: true, isValidating: false });
            return { updatedCount: 0, removedCount: 0 };
          }
          
          const itemsToRemove: string[] = [];
          
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
            
            // Eğer görsel tamamen yoksa ve zaten missing olarak işaretliyse, item'ı kaldır
            if (!exists && item.isImageMissing) {
              itemsToRemove.push(item.id);
            }
          }
          
          // Tamamen kayıp item'ları kaldır
          for (const itemId of itemsToRemove) {
            removeClothing(itemId);
            removedCount++;
          }
          
          set({ isValidated: true, isValidating: false });
          
          if (updatedCount > 0 || removedCount > 0) {
            console.log(`📊 Validation completed: ${updatedCount} updated, ${removedCount} removed`);
          } else {
            console.log('✅ All clothing images are valid.');
          }
          
          return { updatedCount, removedCount };
          
        } catch (error) {
          console.error('❌ Error validating images:', error);
          set({ isValidating: false }); 
          return { updatedCount: 0, removedCount: 0 };
        }
      }
    }),
    {
      name: 'clothing-storage-v4', // Version bump for permanent storage
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