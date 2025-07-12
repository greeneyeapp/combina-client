// store/clothingStore.ts - UUID değişimi migration'ı eklendi

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage';
import { validatePermanentImage, migrateLegacyImages, migrateRegistryToRelativePaths } from '@/utils/permanentImageStorage';
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

  // Kalıcı dosya yolları
  originalImageUri?: string;
  thumbnailImageUri?: string;

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
  isRegistryMigrated: boolean; // 🔧 NEW: Registry migration flag

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

  // 🔧 NEW: Registry migration için
  migrateRegistryPaths: () => Promise<{ migratedCount: number }>;
  setRegistryMigrated: (migrated: boolean) => void;

  // YENİ: Çoklu renk migration fonksiyonu
  migrateToMultiColor: () => Promise<{ migratedCount: number }>;
}

const checkImageExists = async (item: ClothingItem): Promise<boolean> => {
  if (item.isImageMissing) return false;

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
      isRegistryMigrated: false, // 🔧 NEW

      setClothing: (newClothing) => set({ clothing: newClothing }),

      addClothing: async (item) => {
        try {
          let newImageUri = item.originalImageUri;

          const shouldCopy =
            newImageUri &&
            newImageUri.startsWith('file://') &&
            !newImageUri.includes('permanent_images');

          if (shouldCopy) {
            const extension = newImageUri.split('.').pop() || 'jpg';
            const newFileName = `${item.id}_original.${extension}`;
            const newPath = `${FileSystem.documentDirectory}permanent_images/${newFileName}`;

            await FileSystem.copyAsync({
              from: newImageUri,
              to: newPath,
            });

            newImageUri = newPath;
          }

          const processedItem = {
            ...item,
            originalImageUri: newImageUri,
            colors: item.colors || [item.color],
            isImageMissing: false,
          };

          set((state) => ({
            clothing: [...state.clothing, processedItem],
          }));
        } catch (error) {
          console.error('❌ Failed to store clothing item with image:', error);
        }
      },

      removeClothing: async (id) => {
        const { clothing } = get();
        const item = clothing.find((c) => c.id === id);

        if (item) {
          const urisToDelete = [item.originalImageUri, item.thumbnailImageUri].filter(Boolean);

          for (const uri of urisToDelete) {
            try {
              const fileInfo = await FileSystem.getInfoAsync(uri!);
              if (fileInfo.exists) {
                await FileSystem.deleteAsync(uri!, { idempotent: true });
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


      updateClothing: async (id, updatedItem) => {
        try {
          const state = get();
          const currentItem = state.clothing.find((item) => item.id === id);
          if (!currentItem) return;

          let newImageUri = updatedItem.originalImageUri || currentItem.originalImageUri;

          const shouldCopy =
            newImageUri &&
            newImageUri.startsWith('file://') &&
            !newImageUri.includes('permanent_images');

          if (shouldCopy) {
            const extension = newImageUri.split('.').pop() || 'jpg';
            const newFileName = `${id}_original.${extension}`;
            const newPath = `${FileSystem.documentDirectory}permanent_images/${newFileName}`;

            await FileSystem.copyAsync({
              from: newImageUri,
              to: newPath,
            });

            newImageUri = newPath;
          }

          const updated = {
            ...currentItem,
            ...updatedItem,
            originalImageUri: newImageUri,
          };

          // Çoklu renk güncellemesi varsa color’ı da eşitle
          if (updated.colors && updated.colors.length > 0) {
            updated.color = updated.colors[0];
          }

          set({
            clothing: state.clothing.map((item) =>
              item.id === id ? updated : item
            ),
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
      setRegistryMigrated: (migrated) => set({ isRegistryMigrated: migrated }), // 🔧 NEW

      // 🔧 NEW: Registry migration fonksiyonu
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
              updateClothing(item.id, {
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
      name: 'clothing-storage-v6', // 🔧 Version bump for UUID migration
      version: 6, // Bu, depolama şemasının 6. versiyonu
      storage: createJSONStorage(() => simpleStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isValidated = false;
          state.isValidating = false;

          // 🔧 NEW: Registry migration'ı da sıfırla (her başlangıçta kontrol edilsin)
          // Bu sayede UUID değişimi durumunda migration otomatik çalışır
          if (state.isRegistryMigrated) {
            // Geliştirme aşamasında her zaman migration kontrol etsin
            state.isRegistryMigrated = false;
          }

          // Registry migration'ı önce çalıştır
          setTimeout(() => {
            state.migrateRegistryPaths();
          }, 500);

          // Multi-color migration'ı sonra çalıştır
          setTimeout(() => {
            state.migrateToMultiColor();
          }, 1000);
        }
      },
      // Gelecekteki şema değişiklikleri için migration fonksiyonu
      migrate: (persistedState, version) => {
        if (version < 6) {
          console.warn('🔄 Migrating clothing storage from version', version, 'to version 6');
          // v6'ya migration: registry migration flag eklendi
          (persistedState as any).isRegistryMigrated = false;
        }
        return persistedState;
      },
    }
  )
);