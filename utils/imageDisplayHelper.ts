// utils/imageDisplayHelper.ts - Relative path desteği eklendi

import { ClothingItem } from '@/store/clothingStore';
import { 
  getPermanentImagePaths, 
  validatePermanentImage, 
  getAbsolutePathFromRelative 
} from './permanentImageStorage';

// ✅ FIX: Relative path destekli görsel alma
export const getDisplayImageUri = async (item: ClothingItem): Promise<string> => {
  if (item.isImageMissing) return '';

  try {
    // 1. Registry'den path'leri al (relative döner)
    const { originalPath, thumbnailPath } = await getPermanentImagePaths(item.id);
    
    // 2. Önce thumbnail dene (daha hızlı)
    if (thumbnailPath) {
      const thumbnailAbsolute = getAbsolutePathFromRelative(thumbnailPath);
      if (await validatePermanentImage(thumbnailAbsolute)) {
        return thumbnailAbsolute;
      }
    }
    
    // 3. Sonra original dene
    if (originalPath) {
      const originalAbsolute = getAbsolutePathFromRelative(originalPath);
      if (await validatePermanentImage(originalAbsolute)) {
        return originalAbsolute;
      }
    }
    
    // 4. Legacy system fallback - item'da saklanan path'ler
    if (item.thumbnailImageUri) {
      const thumbnailAbsolute = getAbsolutePathFromRelative(item.thumbnailImageUri);
      if (await validatePermanentImage(thumbnailAbsolute)) {
        return thumbnailAbsolute;
      }
    }
    
    if (item.originalImageUri) {
      const originalAbsolute = getAbsolutePathFromRelative(item.originalImageUri);
      if (await validatePermanentImage(originalAbsolute)) {
        return originalAbsolute;
      }
    }
    
    console.warn(`⚠️ No valid image found for item: ${item.id} (${item.name})`);
    return '';
    
  } catch (error) {
    console.error('❌ Error getting display image URI for item:', item.id, error);
    return '';
  }
};

// ✅ FIX: Sync version için relative path desteği
export const getDisplayImageUriSync = (item: ClothingItem): string => {
  if (item.isImageMissing) return '';
  
  // Legacy support için sync path'leri kontrol et
  // Relative path'leri absolute'e çevir
  if (item.thumbnailImageUri) {
    return getAbsolutePathFromRelative(item.thumbnailImageUri);
  }
  
  if (item.originalImageUri) {
    return getAbsolutePathFromRelative(item.originalImageUri);
  }
  
  return '';
};

// ✅ Enhanced debug info
export const getImageDebugInfo = (item: ClothingItem) => {
  return {
    id: item.id,
    name: item.name,
    hasOriginalUri: !!item.originalImageUri,
    hasThumbnailUri: !!item.thumbnailImageUri,
    originalUri: item.originalImageUri,
    thumbnailUri: item.thumbnailImageUri,
    isImageMissing: !!item.isImageMissing,
    system: 'relative_path_storage',
    // ✅ Path type detection
    originalIsRelative: item.originalImageUri ? !item.originalImageUri.startsWith('/') : false,
    thumbnailIsRelative: item.thumbnailImageUri ? !item.thumbnailImageUri.startsWith('/') : false
  };
};

// ✅ NEW: Batch image validation helper
export const validateMultipleImages = async (items: ClothingItem[]): Promise<{
  validItems: ClothingItem[];
  invalidItems: ClothingItem[];
  results: Array<{ id: string; hasValidImage: boolean; error?: string }>;
}> => {
  const results: Array<{ id: string; hasValidImage: boolean; error?: string }> = [];
  const validItems: ClothingItem[] = [];
  const invalidItems: ClothingItem[] = [];

  for (const item of items) {
    try {
      const displayUri = await getDisplayImageUri(item);
      const hasValidImage = !!displayUri;
      
      results.push({ id: item.id, hasValidImage });
      
      if (hasValidImage) {
        validItems.push(item);
      } else {
        invalidItems.push(item);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ id: item.id, hasValidImage: false, error: errorMessage });
      invalidItems.push(item);
    }
  }

  return { validItems, invalidItems, results };
};

// ✅ NEW: Image path migration helper
export const migrateImagePathsForItem = (item: ClothingItem): {
  needsMigration: boolean;
  migratedItem?: ClothingItem;
} => {
  let needsMigration = false;
  const migratedItem = { ...item };

  // Check if originalImageUri needs migration (absolute to relative)
  if (item.originalImageUri && item.originalImageUri.startsWith('/')) {
    migratedItem.originalImageUri = item.originalImageUri.replace(/^.*\/permanent_images\//, 'permanent_images/');
    needsMigration = true;
  }

  // Check if thumbnailImageUri needs migration
  if (item.thumbnailImageUri && item.thumbnailImageUri.startsWith('/')) {
    migratedItem.thumbnailImageUri = item.thumbnailImageUri.replace(/^.*\/permanent_thumbnails\//, 'permanent_thumbnails/');
    needsMigration = true;
  }

  return { needsMigration, migratedItem: needsMigration ? migratedItem : undefined };
};