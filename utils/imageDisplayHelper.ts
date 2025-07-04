import { ClothingItem } from '@/store/clothingStore';
import { getPermanentImagePaths, validatePermanentImage } from './permanentImageStorage';

export const getDisplayImageUri = async (item: ClothingItem): Promise<string> => {
  if (item.isImageMissing) return '';

  try {
    const { originalPath, thumbnailPath } = await getPermanentImagePaths(item.id);
    
    // Önce thumbnail dene (daha hızlı)
    if (thumbnailPath && await validatePermanentImage(thumbnailPath)) {
      return thumbnailPath;
    }
    
    // Sonra original dene
    if (originalPath && await validatePermanentImage(originalPath)) {
      return originalPath;
    }
    
    // Legacy system fallback
    if (item.thumbnailImageUri && await validatePermanentImage(item.thumbnailImageUri)) {
      return item.thumbnailImageUri;
    }
    
    if (item.originalImageUri && await validatePermanentImage(item.originalImageUri)) {
      return item.originalImageUri;
    }
    
    return '';
  } catch (error) {
    console.error('Error getting display image URI:', error);
    return '';
  }
};

export const getDisplayImageUriSync = (item: ClothingItem): string => {
  if (item.isImageMissing) return '';
  
  // Legacy support için sync path'leri kontrol et
  if (item.thumbnailImageUri) return item.thumbnailImageUri;
  if (item.originalImageUri) return item.originalImageUri;
  
  return '';
};

export const getImageDebugInfo = (item: ClothingItem) => {
  return {
    id: item.id,
    name: item.name,
    hasOriginalUri: !!item.originalImageUri,
    hasThumbnailUri: !!item.thumbnailImageUri,
    isImageMissing: !!item.isImageMissing,
    system: 'permanent_storage'
  };
};