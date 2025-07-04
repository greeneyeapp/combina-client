// utils/galleryImageStorage.ts - Asset ID tabanlı kalıcı sistem
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THUMBNAIL_DIR = FileSystem.documentDirectory + 'thumbnails/';
const THUMBNAIL_CACHE_KEY = 'thumbnail_cache_map_v3'; // Version bump for asset ID system

export interface GalleryImageResult {
  originalUri: string;      // iOS: ph://ASSET_ID, Android: content://
  thumbnailUri: string;     // Local cache path (kalıcı)
  assetId: string;          // MediaLibrary asset ID (kalıcı referans)
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
  assetId: string;          // Asset ID'yi cache'le
}

export const ensureThumbnailCacheExists = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(THUMBNAIL_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(THUMBNAIL_DIR, { intermediates: true });
      console.log('📁 Created persistent thumbnail directory');
    }
  } catch (error) {
    console.error('❌ Error creating thumbnail directory:', error);
  }
};

export const checkGalleryPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking gallery permissions:', error);
    return false;
  }
};

/**
 * Asset'ten kalıcı URI formatı oluştur
 * iOS: ph://ASSET_ID (kalıcı)
 * Android: content:// (zaten kalıcı)
 */
export const getPersistentAssetUri = (asset: MediaLibrary.Asset): string => {
  if (Platform.OS === 'ios') {
    return `ph://${asset.id}`;
  } else {
    return asset.uri; // Android content:// zaten kalıcı
  }
};

/**
 * Kalıcı URI'den güncel erişilebilir URI al
 * iOS: ph://ASSET_ID → file://localUri
 * Android: content:// → aynı URI
 */
export const getCurrentUriFromPersistent = async (persistentUri: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'ios' && persistentUri.startsWith('ph://')) {
      const assetId = persistentUri.replace('ph://', '');
      console.log('📱 iOS: Getting fresh URI for asset:', assetId);
      
      const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
      
      if (assetInfo.localUri) {
        console.log('✅ iOS: Fresh localUri retrieved');
        return assetInfo.localUri;
      }
      
      console.warn('⚠️ iOS: Asset exists but no localUri available');
      return null;
    }
    
    // Android content:// veya diğer URI'ler için direkt döndür
    return persistentUri;
    
  } catch (error) {
    console.error('❌ Error getting current URI from persistent:', error);
    return null;
  }
};

/**
 * Asset'ten thumbnail oluştur ve cache'e kaydet
 */
export const createCachedThumbnail = async (
  itemId: string,
  asset: MediaLibrary.Asset
): Promise<string> => {
  try {
    await ensureThumbnailCacheExists();
    
    const thumbnailFileName = `thumb_${itemId}.jpg`;
    const thumbnailPath = THUMBNAIL_DIR + thumbnailFileName;
    
    // Existing thumbnail kontrolü
    const existingThumb = await FileSystem.getInfoAsync(thumbnailPath);
    if (existingThumb.exists) {
      console.log('✅ Using existing thumbnail for item:', itemId);
      return thumbnailPath;
    }
    
    console.log('🔄 Creating new thumbnail for asset:', asset.id);
    
    // Thumbnail oluşturmak için en iyi URI'yi bul
    let sourceUri = asset.uri;
    
    if (Platform.OS === 'ios') {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
        if (assetInfo.localUri) {
          sourceUri = assetInfo.localUri;
          console.log('📱 iOS: Using localUri for thumbnail creation');
        }
      } catch (error) {
        console.warn('⚠️ iOS: Could not get assetInfo, using asset.uri');
      }
    }
    
    // Thumbnail manipüle et
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width: 200 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false
      }
    );
    
    // Kalıcı dizine kopyala
    await FileSystem.copyAsync({
      from: manipulatedImage.uri,
      to: thumbnailPath
    });
    
    // Geçici dosyayı temizle
    if (manipulatedImage.uri !== sourceUri) {
      await FileSystem.deleteAsync(manipulatedImage.uri, { idempotent: true });
    }
    
    // Cache map'ini güncelle
    await updateThumbnailCache(itemId, thumbnailPath, asset.id);
    
    console.log('✅ Created persistent thumbnail for item:', itemId);
    return thumbnailPath;
    
  } catch (error) {
    console.error('❌ Error creating cached thumbnail:', error);
    throw error;
  }
};

const updateThumbnailCache = async (
  itemId: string,
  thumbnailPath: string,
  assetId: string
): Promise<void> => {
  try {
    const cacheMapStr = await AsyncStorage.getItem(THUMBNAIL_CACHE_KEY);
    const cacheMap: Record<string, CachedThumbnail> = cacheMapStr ? JSON.parse(cacheMapStr) : {};
    
    cacheMap[itemId] = {
      itemId,
      thumbnailPath,
      assetId,
      createdAt: Date.now()
    };
    
    await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(cacheMap));
  } catch (error) {
    console.error('Error updating thumbnail cache:', error);
  }
};

/**
 * Gallery asset'ini kalıcı formatta işle
 */
export const processGalleryAsset = async (
  itemId: string,
  asset: MediaLibrary.Asset
): Promise<GalleryImageResult> => {
  try {
    console.log('🔄 Processing gallery asset with persistent storage:', {
      assetId: asset.id,
      platform: Platform.OS
    });
    
    // Kalıcı URI formatı oluştur
    const persistentUri = getPersistentAssetUri(asset);
    
    // Thumbnail oluştur
    const thumbnailUri = await createCachedThumbnail(itemId, asset);
    
    // Metadata hazırla
    const metadata = {
      width: asset.width,
      height: asset.height,
      fileSize: asset.fileSize,
      mimeType: asset.mimeType
    };
    
    console.log('✅ Asset processed with persistent storage:', {
      assetId: asset.id,
      persistentUri: Platform.OS === 'ios' ? persistentUri : 'content://',
      thumbnailCreated: true,
      platform: Platform.OS
    });
    
    return {
      originalUri: persistentUri,  // Kalıcı format!
      thumbnailUri,
      assetId: asset.id,
      metadata
    };
    
  } catch (error) {
    console.error('❌ Error processing gallery asset:', error);
    throw error;
  }
};

/**
 * Persistent URI'nin hâlâ geçerli olup olmadığını kontrol et
 */
export const validateGalleryUri = async (uri: string): Promise<boolean> => {
  try {
    if (Platform.OS === 'ios' && uri.startsWith('ph://')) {
      // iOS: Asset ID'nin hâlâ var olup olmadığını kontrol et
      try {
        const assetId = uri.replace('ph://', '');
        const assetInfo = await MediaLibrary.getAssetInfoAsync(assetId);
        return !!assetInfo;
      } catch {
        console.warn('⚠️ iOS: Asset not found:', uri);
        return false;
      }
    } else if (Platform.OS === 'android' && uri.startsWith('content://')) {
      // Android: content:// URI kontrolü
      try {
        const response = await fetch(uri, { method: 'HEAD' });
        return response.ok;
      } catch {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating gallery URI:', error);
    return false;
  }
};

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
        newCacheMap[itemId] = thumbnail;
      } else {
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
    
    await AsyncStorage.setItem(THUMBNAIL_CACHE_KEY, JSON.stringify(newCacheMap));
    console.log(`🧹 Cleaned up ${deletedCount} unused thumbnails`);
    return { deletedCount, freedSpace };
    
  } catch (error) {
    console.error('Error cleaning up thumbnails:', error);
    return { deletedCount: 0, freedSpace: 0 };
  }
};

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
        // Thumbnail dosyası bulunamadı
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

export const migrateFromCacheToAppSupport = async (): Promise<{ migratedCount: number }> => {
  try {
    console.log('🔄 Starting migration from cache to persistent directory...');
    
    const OLD_CACHE_DIR = FileSystem.cacheDirectory + 'thumbnails/';
    const OLD_CACHE_KEY = 'thumbnail_cache_map';
    const OLD_CACHE_KEY_V2 = 'thumbnail_cache_map_v2';
    
    // Eski cache map'lerini kontrol et
    const oldCacheMapStr = await AsyncStorage.getItem(OLD_CACHE_KEY) || 
                          await AsyncStorage.getItem(OLD_CACHE_KEY_V2);
    
    if (!oldCacheMapStr) {
      console.log('✅ No old cache found, migration not needed');
      return { migratedCount: 0 };
    }
    
    const oldCacheMap: Record<string, any> = JSON.parse(oldCacheMapStr);
    let migratedCount = 0;
    
    await ensureThumbnailCacheExists();
    
    for (const [itemId, thumbnail] of Object.entries(oldCacheMap)) {
      try {
        const oldPath = thumbnail.thumbnailPath;
        const newPath = THUMBNAIL_DIR + `thumb_${itemId}.jpg`;
        
        const oldFileInfo = await FileSystem.getInfoAsync(oldPath);
        if (oldFileInfo.exists) {
          await FileSystem.copyAsync({
            from: oldPath,
            to: newPath
          });
          
          // Yeni format için asset ID gerekli, eğer yoksa dummy değer
          const assetId = thumbnail.assetId || 'migrated';
          await updateThumbnailCache(itemId, newPath, assetId);
          migratedCount++;
          
          await FileSystem.deleteAsync(oldPath, { idempotent: true });
        }
      } catch (error) {
        console.error(`❌ Failed to migrate thumbnail for item ${itemId}:`, error);
      }
    }
    
    // Eski cache map'lerini temizle
    await AsyncStorage.removeItem(OLD_CACHE_KEY);
    await AsyncStorage.removeItem(OLD_CACHE_KEY_V2);
    
    console.log(`✅ Migration completed: ${migratedCount} thumbnails migrated to v3`);
    return { migratedCount };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { migratedCount: 0 };
  }
};