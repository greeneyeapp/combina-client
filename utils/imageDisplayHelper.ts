// utils/imageDisplayHelper.ts - Kalıcı asset sistemi için display fonksiyonları
import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { ClothingItem } from '@/store/clothingStore';
import { getCurrentUriFromPersistent } from './galleryImageStorage';

/**
 * Clothing item için en iyi display URI'sini döndürür
 * iOS restart problemlerini çözer - Asset ID tabanlı
 */
export const getDisplayImageUri = async (item: ClothingItem): Promise<string> => {
  // Eğer resim kayıp olarak işaretlenmişse
  if (item.isImageMissing) {
    return '';
  }

  // 1. ÖNCE THUMBNAIL DENE (her zaman güvenilir, local file)
  if (item.thumbnailImageUri) {
    console.log('📸 Using thumbnail for display');
    return item.thumbnailImageUri;
  }

  // 2. PERSISTENT ORIGINAL URI'YI ÇÖZÜMLE
  if (item.originalImageUri) {
    try {
      const currentUri = await getCurrentUriFromPersistent(item.originalImageUri);
      
      if (currentUri) {
        console.log('📱 Retrieved fresh URI from persistent asset');
        return currentUri;
      } else {
        console.warn('⚠️ Could not resolve persistent URI, asset may be deleted');
        return '';
      }
    } catch (error) {
      console.error('❌ Error resolving persistent URI:', error);
      return '';
    }
  }

  // 3. LEGACY SUPPORT (eski sistem)
  if (item.imageUri) {
    console.log('🔄 Using legacy imageUri');
    return item.imageUri;
  }

  return '';
};

/**
 * Sync version - async olmayan durumlar için
 * Sadece thumbnail ve legacy URI'leri kontrol eder
 */
export const getDisplayImageUriSync = (item: ClothingItem): string => {
  if (item.isImageMissing) {
    return '';
  }

  // Thumbnail öncelikli (her zaman güvenilir)
  if (item.thumbnailImageUri) {
    return item.thumbnailImageUri;
  }

  // iOS ph:// URI'leri sync olarak çözülemez
  if (Platform.OS === 'ios' && item.originalImageUri?.startsWith('ph://')) {
    console.warn('⚠️ iOS ph:// URI detected in sync call, returning empty (use async version)');
    return '';
  }

  // Android content:// veya legacy file:// URI'ler
  if (item.originalImageUri) {
    return item.originalImageUri;
  }

  // Legacy support
  if (item.imageUri) {
    return item.imageUri;
  }

  return '';
};

/**
 * Clothing item'ın resminin geçerli olup olmadığını kontrol eder
 */
export const validateItemImage = async (item: ClothingItem): Promise<boolean> => {
  if (item.isImageMissing) {
    return false;
  }

  // Thumbnail varsa her zaman geçerli (local file)
  if (item.thumbnailImageUri) {
    return true;
  }

  // Original URI kontrolü
  if (item.originalImageUri) {
    try {
      const currentUri = await getCurrentUriFromPersistent(item.originalImageUri);
      return !!currentUri;
    } catch {
      return false;
    }
  }

  return false;
};

/**
 * Bir item'ın thumbnail'inin mevcut olup olmadığını kontrol eder
 */
export const hasThumbnail = (item: ClothingItem): boolean => {
  return !!item.thumbnailImageUri;
};

/**
 * Bir item'ın asset ID'sinin mevcut olup olmadığını kontrol eder
 */
export const hasAssetId = (item: ClothingItem): boolean => {
  return !!item.galleryAssetId || 
         (Platform.OS === 'ios' && !!item.originalImageUri?.startsWith('ph://'));
};

/**
 * iOS'ta ph:// URI'den asset ID çıkarır
 */
export const extractAssetId = (uri: string): string | null => {
  if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
    return uri.replace('ph://', '');
  }
  return null;
};

/**
 * Bir item için debug bilgilerini döndürür
 */
export const getImageDebugInfo = (item: ClothingItem) => {
  return {
    id: item.id,
    name: item.name,
    hasOriginalUri: !!item.originalImageUri,
    hasThumbnailUri: !!item.thumbnailImageUri,
    hasGalleryAssetId: !!item.galleryAssetId,
    isImageMissing: !!item.isImageMissing,
    originalUriType: item.originalImageUri?.startsWith('ph://') ? 'ph://' : 
                    item.originalImageUri?.startsWith('content://') ? 'content://' :
                    item.originalImageUri?.startsWith('file://') ? 'file://' : 'unknown',
    platform: Platform.OS
  };
};