// store/clothingStore.ts - UUID değişimi migration'ı eklendi + RELATIVE PATH

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage';
import { 
  validatePermanentImage, 
  migrateLegacyImages, 
  migrateRegistryToRelativePaths, 
  getAbsolutePathFromRelative,
  getRelativePathFromAbsolute
} from '@/utils/permanentImageStorage';
import * as FileSystem from 'expo-file-system';

export type ClothingItem = {
  id: string;
  name: string;
  category: string;
  color: string; // Ana renk (backward compatibility için)
  colors?: string[]; // YENİ: Çoklu renk desteği
  season: string[];
  style: string;
  notes: string;

  // ✅ FIX: Kalıcı dosya yolları - ARTIK RELATIVE PATH
  originalImageUri?: string;   // ✅ Relative path: "permanent_images/item_original.jpg"
  thumbnailImageUri?: string;  // ✅ Relative path: "permanent_thumbnails/item_thumb.jpg"

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
  isRegistryMigrated: boolean;

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

  // Registry migration için
  migrateRegistryPaths: () => Promise<{ migratedCount: number }>;
  setRegistryMigrated: (migrated: boolean) => void;

  // YENİ: Çoklu renk migration fonksiyonu
  migrateToMultiColor: () => Promise<{ migratedCount: number }>;
  
  // ✅ NEW: Absolute/Relative path migration
  migrateToRelativePaths: () => Promise<{ migratedCount: number }>;
};

// ✅ FIX: Image existence checker - relative path desteği
const checkImageExists = async (item: ClothingItem): Promise<boolean> => {
  if (item.isImageMissing) return false;

  // ✅ Relative path'leri absolute'e çevir
  if (item.originalImageUri) {
    const absolutePath = getAbsolutePathFromRelative(item.originalImageUri);
    if (await validatePermanentImage(absolutePath)) {
      return true;
    }
  }

  if (item.thumbnailImageUri) {
    const absolutePath = getAbsolutePathFromRelative(item.thumbnailImageUri);
    if (await validatePermanentImage(absolutePath)) {
      return true;
    }
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
      isRegistryMigrated: false,

      setClothing: (newClothing) => set({ clothing: newClothing }),

      // ✅ FIX: addClothing - relative path olarak kaydet
      addClothing: async (item) => {
        try {
          // ✅ Gelen path'i relative'e çevir (eğer absolute ise)
          let newOriginalImageUri = item.originalImageUri;
          let newThumbnailImageUri = item.thumbnailImageUri;

          if (newOriginalImageUri) {
            newOriginalImageUri = getRelativePathFromAbsolute(newOriginalImageUri);
          }

          if (newThumbnailImageUri) {
            newThumbnailImageUri = getRelativePathFromAbsolute(newThumbnailImageUri);
          }

          const processedItem = {
            ...item,
            originalImageUri: newOriginalImageUri,
            thumbnailImageUri: newThumbnailImageUri,
            colors: item.colors || [item.color],
            isImageMissing: false,
          };

          set((state) => ({
            clothing: [...state.clothing, processedItem],
          }));

          console.log('✅ Added clothing item with relative paths:', {
            id: item.id,
            originalImageUri: newOriginalImageUri,
            thumbnailImageUri: newThumbnailImageUri
          });

        } catch (error) {
          console.error('❌ Failed to store clothing item with image:', error);
        }
      },

      removeClothing: async (id) => {
        const { clothing } = get();
        const item = clothing.find((c) => c.id === id);

        if (item) {
          // ✅ Relative path'leri absolute'e çevir ve sil
          const urisToDelete = [item.originalImageUri, item.thumbnailImageUri]
            .filter(Boolean)
            .map(uri => getAbsolutePathFromRelative(uri!));

          for (const uri of urisToDelete) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(uri);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(uri, { idempotent: true });
                console.log(`🗑️ Deleted image file: ${uri}`);
              }
            } catch (error) {
              console.warn(`⚠️ Could not delete image file (${uri}):`, error);
            }
          }
        }

        set((state) => ({
          clothing: state.clothing.filter((item) => item.id !== id)
        }));
      },

      // ✅ FIX: updateClothing - relative path olarak kaydet
      updateClothing: async (id, updatedItem) => {
        try {
          const state = get();
          const currentItem = state.clothing.find((item) => item.id === id);
          if (!currentItem) return;

          // ✅ Path'leri relative'e çevir
          let newOriginalImageUri = updatedItem.originalImageUri || currentItem.originalImageUri;
          let newThumbnailImageUri = updatedItem.thumbnailImageUri || currentItem.thumbnailImageUri;

          if (newOriginalImageUri) {
            newOriginalImageUri = getRelativePathFromAbsolute(newOriginalImageUri);
          }

          if (newThumbnailImageUri) {
            newThumbnailImageUri = getRelativePathFromAbsolute(newThumbnailImageUri);
          }

          const updated = {
            ...currentItem,
            ...updatedItem,
            originalImageUri: newOriginalImageUri,
            thumbnailImageUri: newThumbnailImageUri,
          };

          // Çoklu renk güncellemesi varsa color'ı da eşitle
          if (updated.colors && updated.colors.length > 0) {
            updated.color = updated.colors[0];
          }

          set({
            clothing: state.clothing.map((item) =>
              item.id === id ? updated : item
            ),
          });

          console.log('✅ Updated clothing item with relative paths:', {
            id,
            originalImageUri: newOriginalImageUri,
            thumbnailImageUri: newThumbnailImageUri
          });

        } catch (error) {
          console.error('❌ Failed to update clothing item:', error);
        }
      },

      clearAllClothing: async () => {
        try {
          const permanentImageDir = `${FileSystem.documentDirectory}permanent_images/`;
          const dirInfo = await FileSystem.getInfoAsync(permanentImageDir);

          if (dirInfo.exists) {
            await FileSystem.deleteAsync(permanentImageDir, { idempotent: true });
            console.log('🧹 Cleared permanent_images directory');
          }
        } catch (error) {
          console.warn('⚠️ Could not clear permanent_images directory:', error);
        }

        set({
          clothing: [],
          isValidated: false,
          isMigrated: false,
          isRegistryMigrated: false
        });
      },

      setValidated: (validated) => set({ isValidated: validated }),
      setValidating: (validating) => set({ isValidating: validating }),
      setMigrated: (migrated) => set({ isMigrated: migrated }),
      setRegistryMigrated: (migrated) => set({ isRegistryMigrated: migrated }),

      // Registry migration fonksiyonu
      migrateRegistryPaths: async () => {
        const { isRegistryMigrated } = get();

        if (isRegistryMigrated) {
          console.log('✅ Registry migration already completed');
          return { migratedCount: 0 };
        }

        console.log('🔄 Starting registry paths migration...');

        try {
          const result = await migrateRegistryToRelativePaths();
          set({ isRegistryMigrated: true });
          console.log(`✅ Registry migration completed: ${result.migratedCount} entries migrated`);
          return result;
        } catch (error) {
          console.error('❌ Registry migration failed:', error);
          return { migratedCount: 0 };
        }
      },

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

      // YENİ: Çoklu renk migration
      migrateToMultiColor: async () => {
        const { clothing, updateClothing } = get();
        let migratedCount = 0;

        console.log('🔄 Starting multi-color migration...');

        try {
          for (const item of clothing) {
            // Eğer colors field'ı yoksa ve color varsa, colors oluştur
            if (!item.colors && item.color) {
              await updateClothing(item.id, {
                colors: [item.color]
              });
              migratedCount++;
              console.log(`✅ Migrated item ${item.name} to multi-color format`);
            }
          }

          console.log(`✅ Multi-color migration completed: ${migratedCount} items migrated`);
          return { migratedCount };
        } catch (error) {
          console.error('❌ Multi-color migration failed:', error);
          return { migratedCount: 0 };
        }
      },

      // ✅ NEW: Absolute'den Relative path'e migration
      migrateToRelativePaths: async () => {
        const { clothing, updateClothing } = get();
        let migratedCount = 0;

        console.log('🔄 Starting absolute to relative path migration...');

        try {
          for (const item of clothing) {
            let needsUpdate = false;
            const updates: Partial<ClothingItem> = {};

            // originalImageUri kontrolü
            if (item.originalImageUri && item.originalImageUri.startsWith(FileSystem.documentDirectory!)) {
              updates.originalImageUri = getRelativePathFromAbsolute(item.originalImageUri);
              needsUpdate = true;
            }

            // thumbnailImageUri kontrolü
            if (item.thumbnailImageUri && item.thumbnailImageUri.startsWith(FileSystem.documentDirectory!)) {
              updates.thumbnailImageUri = getRelativePathFromAbsolute(item.thumbnailImageUri);
              needsUpdate = true;
            }

            if (needsUpdate) {
              await updateClothing(item.id, updates);
              migratedCount++;
              console.log(`✅ Migrated item ${item.name} to relative paths`);
            }
          }

          console.log(`✅ Relative path migration completed: ${migratedCount} items migrated`);
          return { migratedCount };
        } catch (error) {
          console.error('❌ Relative path migration failed:', error);
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
              await updateClothing(item.id, { isImageMissing: true });
              updatedCount++;
              console.warn(`⚠️ Marking item as missing image: ${item.name}`);
            } else if (exists && item.isImageMissing) {
              await updateClothing(item.id, { isImageMissing: false });
              console.log(`✅ Image found again for item: ${item.name}`);
            }

            if (!exists && item.isImageMissing) {
              itemsToRemove.push(item.id);
            }
          }

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
      name: 'clothing-storage-v7', // ✅ Version bump for relative path migration
      version: 7, // Bu, depolama şemasının 7. versiyonu
      storage: createJSONStorage(() => simpleStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isValidated = false;
          state.isValidating = false;

          // Registry migration'ı da sıfırla (her başlangıçta kontrol edilsin)
          if (state.isRegistryMigrated) {
            state.isRegistryMigrated = false;
          }

          // Migration sırası önemli:
          // 1. Registry migration'ı önce çalıştır
          setTimeout(() => {
            state.migrateRegistryPaths();
          }, 500);

          // 2. Relative path migration'ı çalıştır
          setTimeout(() => {
            state.migrateToRelativePaths();
          }, 1000);

          // 3. Multi-color migration'ı sonra çalıştır
          setTimeout(() => {
            state.migrateToMultiColor();
          }, 1500);
        }
      },
      // Gelecekteki şema değişiklikleri için migration fonksiyonu
      migrate: (persistedState, version) => {
        if (version < 7) {
          console.warn('🔄 Migrating clothing storage from version', version, 'to version 7');
          // v7'ye migration: relative path migration flag eklendi
          (persistedState as any).isRegistryMigrated = false;
        }
        return persistedState;
      },
    }
  )
);