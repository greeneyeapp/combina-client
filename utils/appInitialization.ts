import { ensurePermanentDirectories, migrateLegacyImages, migrateRegistryToRelativePaths } from '@/utils/permanentImageStorage';
import { useClothingStore } from '@/store/clothingStore';

export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app with permanent storage...');

    // 1. Kalıcı dizinleri oluştur
    await ensurePermanentDirectories();
    console.log('✅ Permanent directories initialized');

    // ✅ 2. Tüm legacy migration işlemlerini yap
    const { migratedCount } = await migrateLegacyImages();
    console.log(`✅ Legacy image migration completed: ${migratedCount} items migrated`);

    // 3. Ekstra validation (opsiyonel ama güzel)
    setTimeout(async () => {
      try {
        const { validateClothingImages } = useClothingStore.getState();
        const result = await validateClothingImages();
        if (result.updatedCount > 0 || result.removedCount > 0) {
          console.log(`📊 Image validation: ${result.updatedCount} updated, ${result.removedCount} removed`);
        }
      } catch (error) {
        console.warn('⚠️ Image validation failed:', error);
      }
    }, 1000);

    console.log('✅ App initialization completed with UUID-resistant storage');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
};