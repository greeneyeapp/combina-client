// store/clothingStore.ts - Dosya sistemi tabanlı görüntü depolama ve yetim dosya temizleme

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

  // Dosya sistemi tabanlı görüntü depolama
  originalImagePath: string;    // "item_123456.jpg"
  thumbnailImagePath: string;   // "item_123456_thumb.jpg"
  
  imageMetadata?: {
    width: number;
    height: number;
    fileSize?: number;
  };

  // Görüntü dosyası eksikse işaretlemek için
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
  validateClothingImages: () => Promise<{ updatedCount: number; removedCount: number }>;
  setValidated: (validated: boolean) => void;
  setValidating: (validating: boolean) => void;
  // Yetim kalmış dosyaları temizleme fonksiyonu
  cleanupOrphanedFiles: () => Promise<{ removedCount: number; freedSpace: number }>;
}

// Birden fazla eşzamanlı doğrulamayı önlemek için genel bayraklar
let isGlobalValidationRunning = false;
let validationExecuted = false;

// Dosya sistemi varlıklarını doğrulayan yardımcı fonksiyon
const validateFileSystemAssets = async (): Promise<{ 
  validCount: number; 
  removedCount: number; 
  updatedCount: number; 
}> => {
  const { clothing, removeClothing } = useClothingStore.getState();
  let validCount = 0;
  let removedCount = 0;
  let updatedCount = 0;

  console.log('🔍 Dosya sistemi varlıkları doğrulanıyor...');

  for (const item of clothing) {
    // Eğer ürünün görsel yolları eksikse, ürünü kaldır
    if (!item.originalImagePath || !item.thumbnailImagePath) {
      await removeClothing(item.id);
      removedCount++;
      console.log(`🗑️ Ürün kaldırıldı: ${item.name} - eksik görsel yolları`);
      continue;
    }

    try {
      // Hem orijinal hem de thumbnail dosyasının var olup olmadığını kontrol et
      const originalExists = await checkImageExists(item.originalImagePath, false);
      const thumbnailExists = await checkImageExists(item.thumbnailImagePath, true);
      
      if (originalExists && thumbnailExists) {
        validCount++;
      } else {
        // Eğer dosyalardan biri bile yoksa, ürünü kaldır
        await removeClothing(item.id);
        removedCount++;
        console.log(`🗑️ Ürün kaldırıldı: ${item.name} - görsel dosyaları eksik`);
      }
    } catch (error) {
      console.error(`Ürün ${item.id} için dosyaları doğrularken hata:`, error);
      await removeClothing(item.id);
      removedCount++;
    }
  }

  console.log(`📊 Dosya sistemi doğrulaması tamamlandı: ${validCount} geçerli, ${updatedCount} güncellendi, ${removedCount} kaldırıldı`);
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

        console.log('✅ Dosya sistemi depolaması ile giysi eklendi:', {
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
            // İlgili görsel dosyalarını sil
            await deleteImage(itemToRemove.originalImagePath, itemToRemove.thumbnailImagePath);
          } catch (error) {
            console.error('Görsel dosyaları silinemedi:', error);
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

        console.log('✅ Giysi güncellendi:', {
          id,
          originalImage: updated.originalImagePath,
          thumbnailImage: updated.thumbnailImagePath
        });
      },

      clearAllClothing: async () => {
        const { clothing } = get();
        
        // Tüm görsel dosyalarını sil
        for (const item of clothing) {
          if (item.originalImagePath && item.thumbnailImagePath) {
            try {
              await deleteImage(item.originalImagePath, item.thumbnailImagePath);
            } catch (error) {
              console.error('Ürün için görsel dosyaları silinemedi:', item.id, error);
            }
          }
        }

        set({
          clothing: [],
          isValidated: false
        });

        isGlobalValidationRunning = false;
        validationExecuted = false;
      },

      setValidated: (validated) => set({ isValidated: validated }),
      setValidating: (validating) => set({ isValidating: validating }),

      validateClothingImages: async () => {
        const { isValidated, isValidating } = get();
        
        if (isValidated || isValidating || isGlobalValidationRunning || validationExecuted) {
          console.log('📋 Dosya sistemi doğrulaması zaten tamamlandı veya devam ediyor, atlanıyor...');
          return { updatedCount: 0, removedCount: 0 };
        }

        console.log('🔄 Dosya sistemi doğrulaması başlatılıyor...');
        isGlobalValidationRunning = true;
        validationExecuted = true;
        set({ isValidating: true });
        
        try {
          const result = await validateFileSystemAssets();
          set({ isValidated: true, isValidating: false });
          return { updatedCount: result.updatedCount, removedCount: result.removedCount };
        } catch (error) {
          console.error('❌ Görselleri doğrularken hata:', error);
          set({ isValidating: false });
          return { updatedCount: 0, removedCount: 0 };
        } finally {
          isGlobalValidationRunning = false;
        }
      },

      cleanupOrphanedFiles: async () => {
        const { clothing } = get();
        
        // Gardıroptaki tüm ürünlere ait kullanılan görsel dosyalarının adlarını bir sete topla
        const usedFileNames = new Set<string>();
        clothing.forEach(item => {
          if (item.originalImagePath) usedFileNames.add(item.originalImagePath);
          if (item.thumbnailImagePath) usedFileNames.add(item.thumbnailImagePath);
        });

        try {
          // fileSystemImageManager'daki ana temizleme fonksiyonunu çağır
          return await cleanupOrphanedImages(Array.from(usedFileNames));
        } catch (error) {
          console.error('❌ clothingStore: Yetim dosyaları temizlerken hata oluştu:', error);
          return { removedCount: 0, freedSpace: 0 };
        }
      }
    }),
    {
      name: 'clothing-storage',
      storage: createJSONStorage(() => simpleStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Yeniden yüklemede doğrulama durumunu sıfırla
          state.isValidated = false;
          state.isValidating = false;

          if (!validationExecuted && !isGlobalValidationRunning) {
            console.log('📋 Yeniden yükleme sonrası dosya sistemi doğrulaması planlanıyor...');
            
            setTimeout(() => {
              if (!validationExecuted && !isGlobalValidationRunning && !state.isValidated && !state.isValidating) {
                console.log('🔄 Planlanmış dosya sistemi doğrulaması çalıştırılıyor...');
                state.validateClothingImages();
              } else {
                console.log('📋 Dosya sistemi doğrulaması zaten işlendi, planlanmış doğrulama atlanıyor');
              }
            }, 2000); // Her şeyin yüklendiğinden emin olmak için 2 saniye gecikme
          }
        }
      }
    }
  )
);

// Geliştirme için doğrulama durumunu sıfırlama aracı
if (__DEV__) {
  (global as any).resetClothingValidation = () => {
    const store = useClothingStore.getState();
    store.setValidated(false);
    store.setValidating(false);
    isGlobalValidationRunning = false;
    validationExecuted = false;
    console.log('🔄 Giysi doğrulama durumu sıfırlandı');
  };
}
