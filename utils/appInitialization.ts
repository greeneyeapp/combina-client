// utils/appInitialization.ts
import { ensureThumbnailCacheExists } from '@/utils/galleryImageStorage';
import { quickCleanupInvalidItems } from '@/utils/migrationHelper';

// Uygulama başlangıcında çalışacak doğrulama fonksiyonu
export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app...');

    // Thumbnail cache klasörünü oluştur
    await ensureThumbnailCacheExists();
    console.log('✅ Thumbnail cache directory initialized');

    // Hızlı temizlik - broken file URI'leri kaldır (log spam'ı engeller)
    setTimeout(async () => {
      try {
        await quickCleanupInvalidItems();
      } catch (error) {
        console.warn('⚠️ Quick cleanup failed:', error);
      }
    }, 2000); // 2 saniye sonra çalıştır

    console.log('✅ App initialization completed');
  } catch (error) {
    console.error('❌ App initialization failed:', error);
  }
};