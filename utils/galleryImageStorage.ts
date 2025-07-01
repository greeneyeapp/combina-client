// utils/galleryImageStorage.ts
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THUMBNAIL_CACHE_DIR = FileSystem.cacheDirectory + 'thumbnails/';
const THUMBNAIL_CACHE_KEY = 'thumbnail_cache_map';

export interface GalleryImageResult {
  originalUri: string;      // Gerçek galeri URI'si
  thumbnailUri: string;     // Cache'deki thumbnail
  assetId?: string;         // MediaLibrary asset ID (backup)
  metadata: {
    width: number;
    height: number;
    fileSize?: number;
    mimeType?: string;
  };
}

interface CachedThumbnail {
  itemId: string;
  thumbnailPath: string;
  createdAt: number;
  originalUri: string;
}

// Thumbnail cache directory'sini oluştur
export const ensureThumbnailCacheExists = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(THUMBNAIL_CACHE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(THUMBNAIL_CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error creating thumbnail cache directory:', error);
  }
};

// Galeri seçim permission'ları kontrol et
export const checkGalleryPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking gallery permissions:', error);
    return false;
  }
};

// Platform'a göre gerçek galeri URI'sini al
export const getRealGalleryUri = async (asset: MediaLibrary.Asset): Promise<string> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS: MediaLibrary.getAssetInfoAsync() ile gerçek localUri'yi al
      const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
      return assetInfo.localUri || asset.uri;
    } else {
      // Android: asset.uri zaten content:// formatında gerçek referans
      return asset.uri;
    }
  } catch (error) {
    console.error('Error getting real gallery URI:', error);
    // Fallback olarak asset.uri döndür
    return asset.uri;
  }
};

// Thumbnail oluştur ve cache'e kaydet
export const createCachedThumbnail = async (
  itemId: string,
  originalUri: string
): Promise<string> => {
  try {
    await ensureThumbnailCacheExists();
    
    // Thumbnail dosya adı
    const thumbnailFileName = `thumb_${itemId}.jpg`;
    const thumbnailPath = THUMBNAIL_CACHE_DIR + thumbnailFileName;
    
    // Eğer thumbnail zaten varsa, onu döndür
    const existingThumb = await FileSystem.getInfoAsync(thumbnailPath);
    if (existingThumb.exists) {
      console.log('Using existing thumbnail for item:', itemId);
      return thumbnailPath;
    }
    
    // Yeni thumbnail oluştur
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      originalUri,
      [{ resize: { width: 200 } }], // 200px genişlik
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false
      }
    );
    
    // Thumbnail'i cache dizinine kopyala
    await FileSystem.copyAsync({
      from: manipulatedImage.uri,
      to: thumbnailPath
    });
    
    // Geçici dosyayı temizle
    if (manipulatedImage.uri !== originalUri) {
      await FileSystem.deleteAsync(manipulatedImage.uri, { idempotent: true });
    }
    
    // Cache map'ini güncelle
    await updateThumbnailCache(itemId, thumbnailPath, originalUri);
    
    console.log('Created new thumbnail for item:', itemId);
    return thumbnailPath;
    
  } catch (error) {
    console.error('Error creating cached thumbnail:', error);
    throw error;
  }
};

// Thumbnail cache map'ini güncelle
const updateThumbnailCache = async (
  itemId: string,
  thumbnailPath: string,
  originalUri: string
): Promise<void> => {
  try {
    const cacheMapStr = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
    const cacheMap: Record<string, CachedThumbnail> = cacheMapStr ? JSON.parse(cacheMapStr) : {};
    
    cacheMap[itemId] = {
      itemId,
      thumbnailPath,
      originalUri,
      createdAt: Date.now()
    };
    
    await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(cacheMap));
  } catch (error) {
    console.error('Error updating thumbnail cache:', error);
  }
};

// MediaLibrary asset'inden tam bilgi çıkar
export const processGalleryAsset = async (
  itemId: string,
  asset: MediaLibrary.Asset
): Promise<GalleryImageResult> => {
  try {
    // Gerçek galeri URI'sini al
    const originalUri = await getRealGalleryUri(asset);
    
    // Thumbnail oluştur
    const thumbnailUri = await createCachedThumbnail(itemId, originalUri);
    
    // Metadata hazırla
    const metadata = {
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType
    };
    
    return {
      originalUri,
      thumbnailUri,
      assetId: asset.id,
      metadata
    };
    
  } catch (error) {
    console.error('Error processing gallery asset:', error);
    throw error;
  }
};

// URI'nin hâlâ geçerli olup olmadığını kontrol et
export const validateGalleryUri = async (uri: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios') {
      // iOS için file system kontrolü
      if (uri.startsWith('file://')) {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        return fileInfo.exists;
      }
    } else {
      // Android için content:// URI kontrolü
      if (uri.startsWith('content://')) {
        // Content URI'leri için basit fetch testi
        try {
          const response = await fetch(uri, { method: 'HEAD' });
          return response.ok;
        } catch {
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating gallery URI:', error);
    return false;
  }
};

// Kullanılmayan thumbnail'leri temizle
export const cleanupUnusedThumbnails = async (activeItemIds: string[]): Promise<{
  deletedCount: number;
  freedSpace: number;
}> => {
  try {
    const cacheMapStr = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
    if (!cacheMapStr) return { deletedCount: 0, freedSpace: 0 };
    
    const cacheMap: Record<string, CachedThumbnail> = JSON.parse(cacheMapStr);
    const activeItemIdSet = new Set(activeItemIds);
    
    let deletedCount = 0;
    let freedSpace = 0;
    const newCacheMap: Record<string, CachedThumbnail> = {};
    
    for (const [itemId, thumbnail] of Object.entries(cacheMap)) {
      if (activeItemIdSet.has(itemId)) {
        // Aktif item, cache'de tut
        newCacheMap[itemId] = thumbnail;
      } else {
        // Kullanılmayan item, thumbnail'i sil
        try {
          const fileInfo = await FileSystem.getInfoAsync(thumbnail.thumbnailPath);
          if (fileInfo.exists) {
            freedSpace += fileInfo.size || 0;
            await FileSystem.deleteAsync(thumbnail.thumbnailPath, { idempotent: true });
            deletedCount++;
          }
        } catch (error) {
          console.error('Error deleting thumbnail:', thumbnail.thumbnailPath);
        }
      }
    }
    
    // Güncellenmiş cache map'ini kaydet
    await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(newCacheMap));
    
    console.log(`Cleaned up ${deletedCount} unused thumbnails, freed ${freedSpace} bytes`);
    return { deletedCount, freedSpace };
    
  } catch (error) {
    console.error('Error cleaning up thumbnails:', error);
    return { deletedCount: 0, freedSpace: 0 };
  }
};

// Cache istatistikleri
export const getThumbnailCacheStats = async (): Promise<{
  totalThumbnails: number;
  totalSize: number;
  formattedSize: string;
}> => {
  try {
    const cacheMapStr = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
    const cacheMap: Record<string, CachedThumbnail> = cacheMapStr ? JSON.parse(cacheMapStr) : {};
    
    let totalSize = 0;
    let validThumbnails = 0;
    
    for (const thumbnail of Object.values(cacheMap)) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(thumbnail.thumbnailPath);
        if (fileInfo.exists) {
          totalSize += fileInfo.size || 0;
          validThumbnails++;
        }
      } catch (error) {
        // Thumbnail dosyası bulunamadı, sayma
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
      totalThumbnails: validThumbnails,
      totalSize,
      formattedSize: formatFileSize(totalSize)
    };
    
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalThumbnails: 0,
      totalSize: 0,
      formattedSize: '0 KB'
    };
  }
};