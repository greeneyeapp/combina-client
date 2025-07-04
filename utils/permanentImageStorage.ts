import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Kalıcı depolama dizinleri (uygulama güncellemelerinde korunur)
const PERMANENT_IMAGES_DIR = FileSystem.documentDirectory + 'permanent_images/';
const PERMANENT_THUMBNAILS_DIR = FileSystem.documentDirectory + 'permanent_thumbnails/';
const IMAGE_REGISTRY_KEY = 'permanent_image_registry_v1';

export interface PermanentImageResult {
  originalImagePath: string;    // Kalıcı full-size görsel
  thumbnailImagePath: string;   // Kalıcı thumbnail
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    mimeType: string;
    createdAt: number;
  };
}

interface ImageRegistryEntry {
  itemId: string;
  originalPath: string;
  thumbnailPath: string;
  createdAt: number;
  fileSize: number;
}

// Kalıcı dizinleri oluştur
export const ensurePermanentDirectories = async (): Promise<void> => {
  try {
    const dirs = [PERMANENT_IMAGES_DIR, PERMANENT_THUMBNAILS_DIR];
    
    for (const dir of dirs) {
      const dirInfo = await FileSystem.getInfoAsync(dir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        console.log('📁 Created permanent directory:', dir);
      }
    }
  } catch (error) {
    console.error('❌ Error creating permanent directories:', error);
    throw error;
  }
};

// Görsel permission kontrolü
export const checkImagePermissions = async (): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking image permissions:', error);
    return false;
  }
};

// Asset'ten kalıcı dosya kopyalama
export const copyAssetToPermanentStorage = async (
  itemId: string,
  asset: MediaLibrary.Asset
): Promise<PermanentImageResult> => {
  try {
    await ensurePermanentDirectories();
    
    console.log('🔄 Copying asset to permanent storage:', {
      assetId: asset.id,
      itemId,
      platform: Platform.OS
    });

    // En güvenilir source URI'yi al
    let sourceUri = asset.uri;
    
    // iOS için localUri tercih et
    if (Platform.OS === 'ios') {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
        if (assetInfo.localUri) {
          sourceUri = assetInfo.localUri;
          console.log('📱 iOS: Using localUri for copying');
        }
      } catch (error) {
        console.warn('⚠️ iOS: Could not get localUri, using asset.uri');
      }
    }

    // Dosya uzantısını belirle
    const extension = asset.filename?.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExtension = ['jpg', 'jpeg', 'png', 'webp'].includes(extension) ? extension : 'jpg';
    
    // Kalıcı dosya yolları
    const originalFileName = `${itemId}_original.${safeExtension}`;
    const thumbnailFileName = `${itemId}_thumb.jpg`;
    const originalPath = PERMANENT_IMAGES_DIR + originalFileName;
    const thumbnailPath = PERMANENT_THUMBNAILS_DIR + thumbnailFileName;

    // 1. Orijinal görseli kopyala
    let originalFileSize = 0;
    try {
      // Büyük görselleri optimize et (max 1920px width)
      const optimizedImage = await ImageManipulator.manipulateAsync(
        sourceUri,
        asset.width > 1920 ? [{ resize: { width: 1920 } }] : [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );

      await FileSystem.copyAsync({
        from: optimizedImage.uri,
        to: originalPath
      });

      // Geçici dosyayı temizle
      if (optimizedImage.uri !== sourceUri) {
        await FileSystem.deleteAsync(optimizedImage.uri, { idempotent: true });
      }

      // Dosya boyutunu al
      const originalFileInfo = await FileSystem.getInfoAsync(originalPath);
      originalFileSize = originalFileInfo.size || 0;
      
      console.log('✅ Original image copied successfully');
    } catch (error) {
      console.error('❌ Error copying original image:', error);
      throw new Error('Failed to copy original image');
    }

    // 2. Thumbnail oluştur
    try {
      const thumbnailImage = await ImageManipulator.manipulateAsync(
        originalPath, // Kalıcı dosyadan thumbnail oluştur
        [{ resize: { width: 300 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );

      await FileSystem.copyAsync({
        from: thumbnailImage.uri,
        to: thumbnailPath
      });

      // Geçici thumbnail'i temizle
      await FileSystem.deleteAsync(thumbnailImage.uri, { idempotent: true });
      
      console.log('✅ Thumbnail created successfully');
    } catch (error) {
      console.error('❌ Error creating thumbnail:', error);
      // Thumbnail başarısız olursa orijinali kullan
      await FileSystem.copyAsync({
        from: originalPath,
        to: thumbnailPath
      });
    }

    // 3. Registry'yi güncelle
    await updateImageRegistry(itemId, originalPath, thumbnailPath, originalFileSize);

    const result: PermanentImageResult = {
      originalImagePath: originalPath,
      thumbnailImagePath: thumbnailPath,
      metadata: {
        width: asset.width,
        height: asset.height,
        fileSize: originalFileSize,
        mimeType: asset.mimeType || 'image/jpeg',
        createdAt: Date.now()
      }
    };

    console.log('🎉 Asset copied to permanent storage successfully');
    return result;

  } catch (error) {
    console.error('❌ Error in copyAssetToPermanentStorage:', error);
    
    // Hata durumunda partial dosyaları temizle
    try {
      const originalPath = PERMANENT_IMAGES_DIR + `${itemId}_original.jpg`;
      const thumbnailPath = PERMANENT_THUMBNAILS_DIR + `${itemId}_thumb.jpg`;
      await FileSystem.deleteAsync(originalPath, { idempotent: true });
      await FileSystem.deleteAsync(thumbnailPath, { idempotent: true });
    } catch (cleanupError) {
      console.error('Error cleaning up after failure:', cleanupError);
    }
    
    throw error;
  }
};

// Image registry güncelle
const updateImageRegistry = async (
  itemId: string,
  originalPath: string,
  thumbnailPath: string,
  fileSize: number
): Promise<void> => {
  try {
    const registryStr = await AsyncStorage.getItem(IMAGE_REGISTRY_KEY);
    const registry: Record<string, ImageRegistryEntry> = registryStr ? JSON.parse(registryStr) : {};
    
    registry[itemId] = {
      itemId,
      originalPath,
      thumbnailPath,
      createdAt: Date.now(),
      fileSize
    };
    
    await AsyncStorage.setItem(IMAGE_REGISTRY_KEY, JSON.stringify(registry));
  } catch (error) {
    console.error('Error updating image registry:', error);
  }
};

// Dosya var mı kontrol et
export const validatePermanentImage = async (imagePath: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imagePath);
    return fileInfo.exists && (fileInfo.size || 0) > 0;
  } catch (error) {
    return false;
  }
};

// Item'ın görsellerini al
export const getPermanentImagePaths = async (itemId: string): Promise<{
  originalPath: string | null;
  thumbnailPath: string | null;
}> => {
  try {
    const registryStr = await AsyncStorage.getItem(IMAGE_REGISTRY_KEY);
    if (!registryStr) return { originalPath: null, thumbnailPath: null };
    
    const registry: Record<string, ImageRegistryEntry> = JSON.parse(registryStr);
    const entry = registry[itemId];
    
    if (!entry) return { originalPath: null, thumbnailPath: null };
    
    // Dosyaların varlığını kontrol et
    const originalExists = await validatePermanentImage(entry.originalPath);
    const thumbnailExists = await validatePermanentImage(entry.thumbnailPath);
    
    return {
      originalPath: originalExists ? entry.originalPath : null,
      thumbnailPath: thumbnailExists ? entry.thumbnailPath : null
    };
  } catch (error) {
    console.error('Error getting permanent image paths:', error);
    return { originalPath: null, thumbnailPath: null };
  }
};

// Kullanılmayan görselleri temizle
export const cleanupUnusedImages = async (activeItemIds: string[]): Promise<{
  deletedCount: number;
  freedSpace: number;
}> => {
  try {
    const registryStr = await AsyncStorage.getItem(IMAGE_REGISTRY_KEY);
    if (!registryStr) return { deletedCount: 0, freedSpace: 0 };
    
    const registry: Record<string, ImageRegistryEntry> = JSON.parse(registryStr);
    const activeItemIdSet = new Set(activeItemIds);
    
    let deletedCount = 0;
    let freedSpace = 0;
    const newRegistry: Record<string, ImageRegistryEntry> = {};
    
    for (const [itemId, entry] of Object.entries(registry)) {
      if (activeItemIdSet.has(itemId)) {
        newRegistry[itemId] = entry;
      } else {
        // Dosyaları sil
        try {
          const originalInfo = await FileSystem.getInfoAsync(entry.originalPath);
          if (originalInfo.exists) {
            freedSpace += originalInfo.size || 0;
            await FileSystem.deleteAsync(entry.originalPath, { idempotent: true });
            deletedCount++;
          }
          
          const thumbnailInfo = await FileSystem.getInfoAsync(entry.thumbnailPath);
          if (thumbnailInfo.exists) {
            freedSpace += thumbnailInfo.size || 0;
            await FileSystem.deleteAsync(entry.thumbnailPath, { idempotent: true });
            deletedCount++;
          }
        } catch (error) {
          console.error('Error deleting image files:', error);
        }
      }
    }
    
    await AsyncStorage.setItem(IMAGE_REGISTRY_KEY, JSON.stringify(newRegistry));
    console.log(`🧹 Cleaned up ${deletedCount} unused images, freed ${freedSpace} bytes`);
    return { deletedCount, freedSpace };
    
  } catch (error) {
    console.error('Error cleaning up unused images:', error);
    return { deletedCount: 0, freedSpace: 0 };
  }
};

// Legacy sistem migration
export const migrateLegacyImages = async (): Promise<{ migratedCount: number }> => {
  try {
    console.log('🔄 Starting legacy image migration...');
    
    // Legacy cache temizliği
    const legacyCacheKeys = [
      'thumbnail_cache_map',
      'thumbnail_cache_map_v2',
      'thumbnail_cache_map_v3'
    ];
    
    for (const key of legacyCacheKeys) {
      await AsyncStorage.removeItem(key);
    }
    
    // Legacy cache dizinini temizle
    const legacyCacheDir = FileSystem.cacheDirectory + 'thumbnails/';
    try {
      const legacyDirInfo = await FileSystem.getInfoAsync(legacyCacheDir);
      if (legacyDirInfo.exists) {
        await FileSystem.deleteAsync(legacyCacheDir, { idempotent: true });
        console.log('🧹 Removed legacy cache directory');
      }
    } catch (error) {
      console.warn('Could not remove legacy cache directory:', error);
    }
    
    console.log('✅ Legacy migration completed');
    return { migratedCount: 0 };
    
  } catch (error) {
    console.error('❌ Legacy migration failed:', error);
    return { migratedCount: 0 };
  }
};

// Storage istatistikleri
export const getStorageStats = async (): Promise<{
  totalImages: number;
  totalSize: number;
  formattedSize: string;
}> => {
  try {
    const registryStr = await AsyncStorage.getItem(IMAGE_REGISTRY_KEY);
    if (!registryStr) return { totalImages: 0, totalSize: 0, formattedSize: '0 KB' };
    
    const registry: Record<string, ImageRegistryEntry> = JSON.parse(registryStr);
    let totalSize = 0;
    let validImages = 0;
    
    for (const entry of Object.values(registry)) {
      try {
        const originalInfo = await FileSystem.getInfoAsync(entry.originalPath);
        const thumbnailInfo = await FileSystem.getInfoAsync(entry.thumbnailPath);
        
        if (originalInfo.exists) {
          totalSize += originalInfo.size || 0;
          validImages++;
        }
        
        if (thumbnailInfo.exists) {
          totalSize += thumbnailInfo.size || 0;
        }
      } catch (error) {
        // Skip missing files
      }
    }
    
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 KB';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };
    
    return {
      totalImages: validImages,
      totalSize,
      formattedSize: formatFileSize(totalSize)
    };
    
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalImages: 0, totalSize: 0, formattedSize: '0 KB' };
  }
};