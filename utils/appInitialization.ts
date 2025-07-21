// utils/appInitialization.ts - Yetim dosyaları otomatik temizleyen yapı

import { useClothingStore } from '@/store/clothingStore';
import { initializeFileSystem, getFileSystemHealth, clearTempDirectory } from '@/utils/fileSystemImageManager';

// Tekrarlanan başlatmayı önlemek için genel durum (singleton)
let isInitializing = false;
let isInitialized = false;
let initializationPromise: Promise<any> | null = null;

/**
 * Uygulamayı başlatan ana fonksiyon.
 * Dosya sistemini kurar, geçici dosyaları ve yetim görselleri temizler.
 */
export const initializeApp = async () => {
  // Eğer zaten başlatılmışsa tekrar başlatma
  if (isInitialized) {
    console.log('📋 Uygulama zaten başlatılmış, atlanıyor...');
    return { success: true, system: 'file_system_storage', cached: true };
  }

  // Eğer başlatma işlemi devam ediyorsa, bitmesini bekle
  if (isInitializing) {
    console.log('⏳ Uygulama başlatılıyor, bekleniyor...');
    return await initializationPromise;
  }

  isInitializing = true;
  
  // Asıl başlatma işlemini gerçekleştir ve promise'i sakla
  initializationPromise = performInitialization();
  
  try {
    const result = await initializationPromise;
    isInitialized = true;
    return result;
  } catch (error) {
    console.error('❌ Uygulama başlatma başarısız:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Bilinmeyen hata' };
  } finally {
    isInitializing = false;
    initializationPromise = null;
  }
};

/**
 * Başlatma adımlarını yürüten iç fonksiyon.
 */
const performInitialization = async () => {
  try {
    // 1. Dosya sistemini (gerekli klasörleri) initialize et
    await initializeFileSystem();

    // 2. Uygulama başlarken geçici klasörü (varsa kalıntıları) temizle
    await clearTempDirectory();

    // 3. Gardıropla eşleşmeyen "yetim" görselleri temizle
    // Bu çağrı, clothingStore verileri yüklendikten sonra çalışacaktır.
    console.log('🧹 Yetim görsel temizleme işlemi başlatılıyor...');
    const cleanupResult = await useClothingStore.getState().cleanupOrphanedFiles();
    if (cleanupResult.removedCount > 0) {
      console.log(
        `✅ Yetim görsel temizliği tamamlandı: ${cleanupResult.removedCount} dosya silindi, ` +
        `${Math.round(cleanupResult.freedSpace / 1024)} KB alan boşaltıldı.`
      );
    } else {
      console.log('✅ Yetim görsel bulunamadı, temizliğe gerek yok.');
    }

    return {
      success: true,
      system: 'file_system_storage',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Uygulama başlangıç hatası:', error);
    throw error;
  }
};

/**
 * Dosya sistemi sağlık durumunu teşhis eder (Depolama Yönetimi ekranı için).
 */
export const diagnoseFileSystemHealth = async (t?: (key: string, options?: any) => string): Promise<{
  totalItems: number;
  withValidPaths: number;
  withMissingPaths: number;
  systemHealth: {
    isHealthy: boolean;
    totalFiles: number;
    totalSize: number;
    issues: string[];
  };
}> => {
  const translate = t || ((key: string) => key);
  
  try {
    const { clothing } = useClothingStore.getState();
    
    let withValidPaths = 0;
    let withMissingPaths = 0;
    
    for (const item of clothing) {
      if (item.originalImagePath && item.thumbnailImagePath) {
        withValidPaths++;
      } else {
        withMissingPaths++;
      }
    }
    
    const systemHealth = await getFileSystemHealth();
    
    return {
      totalItems: clothing.length,
      withValidPaths,
      withMissingPaths,
      systemHealth
    };
    
  } catch (error) {
    console.error('❌ Dosya sistemi teşhisi başarısız:', error);
    return {
      totalItems: 0,
      withValidPaths: 0,
      withMissingPaths: 0,
      systemHealth: {
        isHealthy: false,
        totalFiles: 0,
        totalSize: 0,
        issues: [translate('appInit.diagnosisFailed')]
      }
    };
  }
};

/**
 * Başlatma durumunu sıfırlar (geliştirme/test için).
 */
export const resetInitializationState = () => {
  isInitializing = false;
  isInitialized = false;
  initializationPromise = null;
  console.log('🔄 Başlatma durumu sıfırlandı');
};

/**
 * Uygulamanın başlatılıp başlatılmadığını kontrol eder.
 */
export const isAppInitialized = () => isInitialized;
