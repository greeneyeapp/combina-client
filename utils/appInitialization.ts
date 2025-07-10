import { ensurePermanentDirectories, migrateLegacyImages, migrateRegistryToRelativePaths } from '@/utils/permanentImageStorage';
import { useClothingStore } from '@/store/clothingStore';

export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app with permanent storage...');

    // 1. Kalıcı dizinleri oluştur
    await ensurePermanentDirectories();
    console.log('✅ Permanent directories initialized');

    // 🔧 FIX: 2. UUID değişimi için registry migration (ÖNCE YAPILMALI)
    setTimeout(async () => {
      try {
        console.log('🔄 Starting registry migration to relative paths...');
        const registryResult = await migrateRegistryToRelativePaths();
        if (registryResult.migratedCount > 0) {
          console.log(`✅ Registry migration completed: ${registryResult.migratedCount} entries migrated`);
        }
      } catch (error) {
        console.error('❌ Registry migration failed:', error);
      }
    }, 500);

    // 3. Legacy migration (async)
    setTimeout(async () => {
      try {
        const { migrateToPermanentStorage } = useClothingStore.getState();
        await migrateToPermanentStorage();
        console.log('🔄 Legacy migration completed');
      } catch (error) {
        console.error('❌ Legacy migration failed:', error);
      }
    }, 1000);

    // 4. Görsel validation (async) - Registry migration'dan sonra
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
    }, 2000);

    console.log('✅ App initialization completed with UUID-resistant storage');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
};