import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useClothingStore } from '@/store/clothingStore';

// 🔧 FIX: Relative paths kullanarak UUID değişikliğinden koruma
const PERMANENT_IMAGES_SUBDIR = 'permanent_images/';
const PERMANENT_THUMBNAILS_SUBDIR = 'permanent_thumbnails/';
const IMAGE_REGISTRY_KEY = 'permanent_image_registry_v1';

// 🔧 FIX: Dynamic path builders - UUID değişse bile çalışır
const getPermanentImagesDir = () => FileSystem.documentDirectory + PERMANENT_IMAGES_SUBDIR;
const getPermanentThumbnailsDir = () => FileSystem.documentDirectory + PERMANENT_THUMBNAILS_SUBDIR;

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
  originalPath: string;    // ⚠️ Bu da relative olacak
  thumbnailPath: string;   // ⚠️ Bu da relative olacak
  createdAt: number;
  fileSize: number;
  // 🔧 NEW: Relative paths için flag
  isRelativePath?: boolean;
}

// Kalıcı dizinleri oluştur
export const ensurePermanentDirectories = async (): Promise<void> => {
  try {
    const dirs = [getPermanentImagesDir(), getPermanentThumbnailsDir()];

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

// 🔧 FIX: Relative path oluşturma helper
const getRelativeImagePaths = (itemId: string, extension: string = 'jpg') => {
  const originalFileName = `${itemId}_original.${extension}`;
  const thumbnailFileName = `${itemId}_thumb.jpg`;

  return {
    originalRelativePath: PERMANENT_IMAGES_SUBDIR + originalFileName,
    thumbnailRelativePath: PERMANENT_THUMBNAILS_SUBDIR + thumbnailFileName,
    originalAbsolutePath: getPermanentImagesDir() + originalFileName,
    thumbnailAbsolutePath: getPermanentThumbnailsDir() + thumbnailFileName
  };
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

    // 🔧 FIX: Relative ve absolute path'leri al
    const {
      originalRelativePath,
      thumbnailRelativePath,
      originalAbsolutePath,
      thumbnailAbsolutePath
    } = getRelativeImagePaths(itemId, safeExtension);

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
        to: originalAbsolutePath
      });

      // Geçici dosyayı temizle
      if (optimizedImage.uri !== sourceUri) {
        await FileSystem.deleteAsync(optimizedImage.uri, { idempotent: true });
      }

      // Dosya boyutunu al
      const originalFileInfo = await FileSystem.getInfoAsync(originalAbsolutePath);
      originalFileSize = originalFileInfo.size || 0;

      console.log('✅ Original image copied successfully');
    } catch (error) {
      console.error('❌ Error copying original image:', error);
      throw new Error('Failed to copy original image');
    }

    // 2. Thumbnail oluştur
    try {
      const thumbnailImage = await ImageManipulator.manipulateAsync(
        originalAbsolutePath, // Kalıcı dosyadan thumbnail oluştur
        [{ resize: { width: 300 } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );

      await FileSystem.copyAsync({
        from: thumbnailImage.uri,
        to: thumbnailAbsolutePath
      });

      // Geçici thumbnail'i temizle
      await FileSystem.deleteAsync(thumbnailImage.uri, { idempotent: true });

      console.log('✅ Thumbnail created successfully');
    } catch (error) {
      console.error('❌ Error creating thumbnail:', error);
      // Thumbnail başarısız olursa orijinali kullan
      await FileSystem.copyAsync({
        from: originalAbsolutePath,
        to: thumbnailAbsolutePath
      });
    }

    // 🔧 FIX: Registry'yi relative path'lerle güncelle
    await updateImageRegistry(itemId, originalRelativePath, thumbnailRelativePath, originalFileSize);

    const result: PermanentImageResult = {
      originalImagePath: originalAbsolutePath,  // Client'a absolute path döndür
      thumbnailImagePath: thumbnailAbsolutePath, // Client'a absolute path döndür
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
      const { originalAbsolutePath, thumbnailAbsolutePath } = getRelativeImagePaths(itemId);
      await FileSystem.deleteAsync(originalAbsolutePath, { idempotent: true });
      await FileSystem.deleteAsync(thumbnailAbsolutePath, { idempotent: true });
    } catch (cleanupError) {
      console.error('Error cleaning up after failure:', cleanupError);
    }

    throw error;
  }
};

// 🔧 FIX: Image registry'yi relative path'lerle güncelle
const updateImageRegistry = async (
  itemId: string,
  originalRelativePath: string,   // ✅ Relative path
  thumbnailRelativePath: string,  // ✅ Relative path
  fileSize: number
): Promise<void> => {
  try {
    const registryStr = await AsyncStorage.getItem(IMAGE_REGISTRY_KEY);
    const registry: Record<string, ImageRegistryEntry> = registryStr ? JSON.parse(registryStr) : {};

    registry[itemId] = {
      itemId,
      originalPath: originalRelativePath,    // ✅ Relative path kaydediliyor
      thumbnailPath: thumbnailRelativePath,  // ✅ Relative path kaydediliyor
      createdAt: Date.now(),
      fileSize,
      isRelativePath: true  // ✅ Bu yeni bir relative path olduğunu işaretle
    };

    await AsyncStorage.setItem(IMAGE_REGISTRY_KEY, JSON.stringify(registry));
    console.log('📝 Registry updated with relative paths for:', itemId);
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

// 🔧 FIX: Item'ın görsellerini al - legacy absolute path'leri migrate et
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

    let originalAbsolutePath: string;
    let thumbnailAbsolutePath: string;

    // 🔧 LEGACY MIGRATION: Eski absolute path'leri relative'e çevir
    if (entry.isRelativePath) {
      // Yeni format: relative path
      originalAbsolutePath = FileSystem.documentDirectory + entry.originalPath;
      thumbnailAbsolutePath = FileSystem.documentDirectory + entry.thumbnailPath;
    } else {
      // Eski format: absolute path - Bu durumda dosyalar kaybolmuş olabilir
      originalAbsolutePath = entry.originalPath;
      thumbnailAbsolutePath = entry.thumbnailPath;

      // ⚠️ Eski absolute path'ler UUID değişimi nedeniyle artık çalışmıyor olabilir
      console.warn('⚠️ Legacy absolute path detected for item:', itemId);

      // Eğer eski absolute path çalışmıyorsa, relative path'e migrate etmeye çalış
      const originalExists = await validatePermanentImage(originalAbsolutePath);
      const thumbnailExists = await validatePermanentImage(thumbnailAbsolutePath);

      if (!originalExists && !thumbnailExists) {
        // Dosyalar bulunamadı, belki relative path'te vardır?
        const { originalAbsolutePath: newOriginal, thumbnailAbsolutePath: newThumbnail } = getRelativeImagePaths(itemId);

        const newOriginalExists = await validatePermanentImage(newOriginal);
        const newThumbnailExists = await validatePermanentImage(newThumbnail);

        if (newOriginalExists || newThumbnailExists) {
          // Dosyalar yeni konumda bulundu! Registry'yi güncelle
          const { originalRelativePath, thumbnailRelativePath } = getRelativeImagePaths(itemId);
          await updateImageRegistry(itemId, originalRelativePath, thumbnailRelativePath, entry.fileSize);

          originalAbsolutePath = newOriginal;
          thumbnailAbsolutePath = newThumbnail;
          console.log('✅ Migrated legacy paths to relative for item:', itemId);
        }
      }
    }

    // Dosyaların varlığını kontrol et
    const originalExists = await validatePermanentImage(originalAbsolutePath);
    const thumbnailExists = await validatePermanentImage(thumbnailAbsolutePath);

    return {
      originalPath: originalExists ? originalAbsolutePath : null,
      thumbnailPath: thumbnailExists ? thumbnailAbsolutePath : null
    };
  } catch (error) {
    console.error('Error getting permanent image paths:', error);
    return { originalPath: null, thumbnailPath: null };
  }
};

// 🔧 FIX: Registry migration - tüm absolute path'leri relative'e çevir
export const migrateRegistryToRelativePaths = async (): Promise<{ migratedCount: number }> => {
  try {
    const registryStr = await AsyncStorage.getItem(IMAGE_REGISTRY_KEY);
    if (!registryStr) return { migratedCount: 0 };

    const registry: Record<string, ImageRegistryEntry> = JSON.parse(registryStr);
    let migratedCount = 0;

    for (const [itemId, entry] of Object.entries(registry)) {
      if (!entry.isRelativePath) {
        // Bu bir eski absolute path entry'si
        const { originalRelativePath, thumbnailRelativePath } = getRelativeImagePaths(itemId);

        registry[itemId] = {
          ...entry,
          originalPath: originalRelativePath,
          thumbnailPath: thumbnailRelativePath,
          isRelativePath: true
        };

        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      await AsyncStorage.setItem(IMAGE_REGISTRY_KEY, JSON.stringify(registry));
      console.log(`🔄 Migrated ${migratedCount} registry entries to relative paths`);
    }

    return { migratedCount };
  } catch (error) {
    console.error('Error migrating registry to relative paths:', error);
    return { migratedCount: 0 };
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
        // 🔧 FIX: Relative/absolute path'e göre dosya yolunu belirle
        let originalPath: string;
        let thumbnailPath: string;

        if (entry.isRelativePath) {
          originalPath = FileSystem.documentDirectory + entry.originalPath;
          thumbnailPath = FileSystem.documentDirectory + entry.thumbnailPath;
        } else {
          originalPath = entry.originalPath;
          thumbnailPath = entry.thumbnailPath;
        }

        // Dosyaları sil
        try {
          const originalInfo = await FileSystem.getInfoAsync(originalPath);
          if (originalInfo.exists) {
            freedSpace += originalInfo.size || 0;
            await FileSystem.deleteAsync(originalPath, { idempotent: true });
            deletedCount++;
          }

          const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailPath);
          if (thumbnailInfo.exists) {
            freedSpace += thumbnailInfo.size || 0;
            await FileSystem.deleteAsync(thumbnailPath, { idempotent: true });
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

    // 🔧 FIX: Registry migration de dahil et
    const registryMigration = await migrateRegistryToRelativePaths();

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

    // 🔧 MIGRATE: Eski clothing item görsellerini kalıcı dizine taşı
    const { clothing, updateClothing } = useClothingStore.getState();
    let migratedImageCount = 0;

    for (const item of clothing) {
      if (!item.originalImageUri) continue;

      const isLegacyPath = item.originalImageUri.startsWith('file:///') &&
        !item.originalImageUri.includes('permanent_images');

      if (!isLegacyPath) continue;

      try {
        const extension = item.originalImageUri.split('.').pop() || 'jpg';
        const newFileName = `${item.id}_original.${extension}`;
        const newPath = `${FileSystem.documentDirectory}permanent_images/${newFileName}`;

        await FileSystem.copyAsync({
          from: item.originalImageUri,
          to: newPath,
        });

        updateClothing(item.id, {
          originalImageUri: newPath,
        });

        console.log(`✅ Migrated image for item ${item.id}`);
        migratedImageCount++;
      } catch (e) {
        console.warn(`❌ Failed to migrate image for item ${item.id}:`, e);
      }
    }

    const totalMigrated = registryMigration.migratedCount + migratedImageCount;

    console.log(`✅ Legacy migration completed (registry: ${registryMigration.migratedCount}, images: ${migratedImageCount})`);
    return { migratedCount: totalMigrated };

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
        // 🔧 FIX: Relative/absolute path'e göre dosya yolunu belirle
        let originalPath: string;
        let thumbnailPath: string;

        if (entry.isRelativePath) {
          originalPath = FileSystem.documentDirectory + entry.originalPath;
          thumbnailPath = FileSystem.documentDirectory + entry.thumbnailPath;
        } else {
          originalPath = entry.originalPath;
          thumbnailPath = entry.thumbnailPath;
        }

        const originalInfo = await FileSystem.getInfoAsync(originalPath);
        const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailPath);

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