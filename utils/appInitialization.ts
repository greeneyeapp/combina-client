// utils/appInitialization.ts - Asset ID migration dahil
import { ensureThumbnailCacheExists, migrateFromCacheToAppSupport } from '@/utils/galleryImageStorage';
import { quickCleanupInvalidItems } from '@/utils/migrationHelper';
import { useClothingStore } from '@/store/clothingStore';

// Uygulama başlangıcında çalışacak doğrulama fonksiyonu
export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app...');

    // 1. Cache'den persistent directory'ye migration
    try {
      const migrationResult = await migrateFromCacheToAppSupport();
      if (migrationResult.migratedCount > 0) {
        console.log(`📦 Migrated ${migrationResult.migratedCount} thumbnails to persistent storage`);
      }
    } catch (error) {
      console.error('❌ Thumbnail migration failed:', error);
    }

    // 2. Persistent thumbnail directory'sini oluştur
    await ensureThumbnailCacheExists();
    console.log('✅ Persistent thumbnail directory initialized');

    // 3. Asset ID migration (async olarak çalıştır)
    setTimeout(async () => {
      try {
        const { migrateToAssetIdSystem } = useClothingStore.getState();
        const assetMigrationResult = await migrateToAssetIdSystem();
        if (assetMigrationResult.migratedCount > 0) {
          console.log(`🔄 Asset ID migration: ${assetMigrationResult.migratedCount} items migrated`);
        }
      } catch (error) {
        console.error('❌ Asset ID migration failed:', error);
      }
    }, 1000);

    // 4. Hızlı temizlik - broken file URI'leri kaldır (log spam'ı engeller)
    setTimeout(async () => {
      try {
        await quickCleanupInvalidItems();
      } catch (error) {
        console.warn('⚠️ Quick cleanup failed:', error);
      }
    }, 2000);

    console.log('✅ App initialization completed');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
};