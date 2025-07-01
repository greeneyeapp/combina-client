// utils/migrationHelper.ts - Eski sistemden temizlik için

import { useClothingStore } from '@/store/clothingStore';
import { validateGalleryUri } from '@/utils/galleryImageStorage';

/**
 * App başlangıcında çalıştırılabilecek temizlik fonksiyonu
 * Eski sistem item'larını ve geçersiz referansları temizler
 */
export const performMigrationCleanup = async (): Promise<{
  removedInvalidItems: number;
  migratedItems: number;
  totalProcessed: number;
}> => {
  console.log('🧹 Starting migration cleanup...');
  
  const { clothing, setClothing, migrateToNewImageSystem } = useClothingStore.getState();
  
  let removedInvalidItems = 0;
  let migratedItems = 0;
  
  // 1. Migration yap (eski imageUri -> originalImageUri)
  try {
    const migrationResult = await migrateToNewImageSystem();
    migratedItems = migrationResult.migratedCount;
    console.log(`✅ Migration: ${migratedItems} items migrated`);
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
  
  // 2. Geçersiz URI'leri olan item'ları temizle
  const validItems = [];
  
  for (const item of clothing) {
    let isValid = false;
    
    // Yeni sistem kontrolü
    if (item.originalImageUri) {
      isValid = await validateGalleryUri(item.originalImageUri);
    }
    
    // Eski sistem kontrolü (fallback)
    if (!isValid && item.imageUri) {
      try {
        if (item.imageUri.startsWith('http')) {
          isValid = true; // Network URL'leri kabul et
        } else if (item.imageUri.startsWith('file://')) {
          // Bu muhtemelen geçersiz eski dosya URI'si
          isValid = false;
        }
      } catch {
        isValid = false;
      }
    }
    
    if (isValid) {
      validItems.push(item);
    } else {
      removedInvalidItems++;
      console.warn(`🗑️ Removing invalid item: ${item.name} (${item.id})`);
    }
  }
  
  // 3. Temizlenmiş listeyi kaydet
  if (removedInvalidItems > 0) {
    setClothing(validItems);
    console.log(`✅ Cleanup: ${removedInvalidItems} invalid items removed`);
  }
  
  const result = {
    removedInvalidItems,
    migratedItems,
    totalProcessed: clothing.length
  };
  
  console.log('🎉 Migration cleanup completed:', result);
  return result;
};

/**
 * Sadece log spam yapan item'ları sessizce temizle
 */
export const quickCleanupInvalidItems = async () => {
  const { clothing, setClothing } = useClothingStore.getState();
  
  // Sadece açıkça geçersiz olan URI'leri temizle (broken file:// paths)
  const validItems = clothing.filter(item => {
    // Eğer sadece eski sistem imageUri varsa ve bu file:// ile başlıyorsa muhtemelen bozuk
    if (!item.originalImageUri && item.imageUri?.startsWith('file://')) {
      console.log(`🧹 Quick cleanup: removing item with broken file URI: ${item.name}`);
      return false;
    }
    return true;
  });
  
  if (validItems.length !== clothing.length) {
    setClothing(validItems);
    console.log(`✅ Quick cleanup: ${clothing.length - validItems.length} items removed`);
  }
};