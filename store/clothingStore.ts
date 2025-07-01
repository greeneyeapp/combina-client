// kodlar/store/clothingStore.ts

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage';
import { 
  validateGalleryUri, 
  cleanupUnusedThumbnails,
} from '@/utils/galleryImageStorage';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string;
  notes: string;
  
  originalImageUri: string;
  thumbnailImageUri?: string;
  galleryAssetId?: string;
  
  imageUri?: string; // DEPRECATED
  
  createdAt: string;
  
  imageMetadata?: {
    width: number;
    height: number;
    fileSize?: number;
    mimeType?: string;
  };

  // YENİ: Resmin kayıp olup olmadığını belirten işaret
  isImageMissing?: boolean;
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
  validateClothingImages: () => Promise<{ updatedCount: number }>; // Artık silinen değil, güncellenen sayısını döndürecek
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
  
  cleanupThumbnailCache: () => Promise<{ deletedCount: number; freedSpace: number }>;
}

const checkImageExists = async (item: ClothingItem): Promise<boolean> => {
    if (item.isImageMissing) return false; // Zaten kayıp olarak işaretliyse tekrar kontrol etme
    if (!item.originalImageUri) return false; // Ana referans yoksa geçersizdir
    return await validateGalleryUri(item.originalImageUri);
};

export const useClothingStore = create<ClothingState>()(
  persist(
    (set, get) => ({
      clothing: [],
      isValidated: false,
      isValidating: false,
      
      setClothing: (newClothing) => set({ clothing: newClothing }),
      
      addClothing: (item) => set((state) => ({ 
        clothing: [...state.clothing, { ...item, isImageMissing: false }] // Eklerken işaretin false olduğundan emin ol
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
        isValidated: false 
      }),
      
      setValidated: (validated) => set({ isValidated: validated }),
      setValidating: (validating) => set({ isValidating: validating }),
      
      // *** EN ÖNEMLİ DEĞİŞİKLİK BURADA ***
      // Bu fonksiyon artık veri SİLMİYOR, sadece İŞARETLİYOR.
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
              // Resim yoksa ve daha önce işaretlenmemişse, güncelle.
              updateClothing(item.id, { isImageMissing: true });
              updatedCount++;
              console.warn(`Marking item as missing image: ${item.name}`);
            } else if (exists && item.isImageMissing) {
              // Resim geri gelmişse (örn: yedekten), işareti kaldır.
              updateClothing(item.id, { isImageMissing: false });
              console.log(`Image found again for item: ${item.name}`);
            }
          }
          
          set({ isValidated: true, isValidating: false });
          if(updatedCount > 0) {
              console.log(`${updatedCount} items marked with missing images.`);
          } else {
              console.log('All clothing images are valid.');
          }
          return { updatedCount };
          
        } catch (error) {
          console.error('Error validating images:', error);
          set({ isValidating: false }); 
          return { updatedCount: 0 };
        }
      },
      
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
      name: 'clothing-storage-v2',
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