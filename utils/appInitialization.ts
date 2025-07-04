import { ensurePermanentDirectories, migrateLegacyImages } from '@/utils/permanentImageStorage';
import { useClothingStore } from '@/store/clothingStore';

export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app with permanent storage...');

    // 1. Kalıcı dizinleri oluştur
    await ensurePermanentDirectories();
    console.log('✅ Permanent directories initialized');

    // 2. Legacy migration (async)
    setTimeout(async () => {
      try {
        const { migrateToPermanentStorage } = useClothingStore.getState();
        await migrateToPermanentStorage();
        console.log('🔄 Legacy migration completed');
      } catch (error) {
        console.error('❌ Legacy migration failed:', error);
      }
    }, 1000);

    // 3. Görsel validation (async)
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

    console.log('✅ App initialization completed with permanent storage');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
};