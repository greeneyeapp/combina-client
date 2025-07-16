// utils/fileSystemImageManager.ts - Global singleton pattern ile düzeltilmiş

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { generateUniqueId } from './helpers';

const WARDROBE_DIR = `${FileSystem.documentDirectory}wardrobe/`;
const ORIGINALS_DIR = `${WARDROBE_DIR}originals/`;
const THUMBNAILS_DIR = `${WARDROBE_DIR}thumbnails/`;

// Thumbnail boyutları
const THUMBNAIL_SIZE = 300;
const THUMBNAIL_QUALITY = 0.8;

// Global initialization flag - bu dosyada da singleton pattern
let fileSystemInitialized = false;
let initializationPromise: Promise<void> | null = null;

export interface ImagePaths {
  originalPath: string;
  thumbnailPath: string;
  fileName: string;
}

/**
 * File system klasörlerini oluşturur (Singleton)
 */
export const initializeFileSystem = async (): Promise<void> => {
  // Eğer zaten initialize edilmişse, tekrar etme
  if (fileSystemInitialized) {
    console.log('📋 File system already initialized, skipping...');
    return;
  }

  // Eğer initialization devam ediyorsa, bekle
  if (initializationPromise) {
    console.log('⏳ File system initialization in progress, waiting...');
    return initializationPromise;
  }

  // Yeni initialization başlat
  initializationPromise = performFileSystemInitialization();
  
  try {
    await initializationPromise;
    fileSystemInitialized = true;
  } catch (error) {
    console.error('❌ File system initialization failed:', error);
    throw error;
  } finally {
    initializationPromise = null;
  }
};

/**
 * Gerçek file system initialization işlemi
 */
const performFileSystemInitialization = async (): Promise<void> => {
  try {
    // Ana wardrobe klasörü
    const wardrobeInfo = await FileSystem.getInfoAsync(WARDROBE_DIR);
    if (!wardrobeInfo.exists) {
      await FileSystem.makeDirectoryAsync(WARDROBE_DIR, { intermediates: true });
    }

    // Originals klasörü
    const originalsInfo = await FileSystem.getInfoAsync(ORIGINALS_DIR);
    if (!originalsInfo.exists) {
      await FileSystem.makeDirectoryAsync(ORIGINALS_DIR, { intermediates: true });
    }

    // Thumbnails klasörü
    const thumbnailsInfo = await FileSystem.getInfoAsync(THUMBNAILS_DIR);
    if (!thumbnailsInfo.exists) {
      await FileSystem.makeDirectoryAsync(THUMBNAILS_DIR, { intermediates: true });
    }

    console.log('✅ File system initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize file system:', error);
    throw error;
  }
};

/**
 * Galeri asset'ini file system'e kopyalar ve thumbnail oluşturur
 */
export const saveImageFromGallery = async (asset: MediaLibrary.Asset): Promise<ImagePaths> => {
  try {
    // File system'in hazır olduğundan emin ol
    await initializeFileSystem();

    const fileName = `item_${generateUniqueId()}`;
    const originalFileName = `${fileName}.jpg`;
    const thumbnailFileName = `${fileName}_thumb.jpg`;
    
    const originalPath = `${ORIGINALS_DIR}${originalFileName}`;
    const thumbnailPath = `${THUMBNAILS_DIR}${thumbnailFileName}`;

    // Orijinal görseli kopyala
    await FileSystem.copyAsync({
      from: asset.uri,
      to: originalPath,
    });

    // Thumbnail oluştur
    const manipulatedImage = await manipulateAsync(
      asset.uri,
      [{ resize: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE } }],
      { compress: THUMBNAIL_QUALITY, format: SaveFormat.JPEG }
    );

    await FileSystem.copyAsync({
      from: manipulatedImage.uri,
      to: thumbnailPath,
    });

    console.log('✅ Image saved to file system:', {
      original: originalFileName,
      thumbnail: thumbnailFileName
    });

    return {
      originalPath: originalFileName,
      thumbnailPath: thumbnailFileName,
      fileName
    };
  } catch (error) {
    console.error('❌ Failed to save image from gallery:', error);
    throw error;
  }
};

/**
 * Kamera ile çekilen görseli file system'e kaydeder
 */
export const saveImageFromCamera = async (imageUri: string): Promise<ImagePaths> => {
  try {
    // File system'in hazır olduğundan emin ol
    await initializeFileSystem();

    const fileName = `item_${generateUniqueId()}`;
    const originalFileName = `${fileName}.jpg`;
    const thumbnailFileName = `${fileName}_thumb.jpg`;
    
    const originalPath = `${ORIGINALS_DIR}${originalFileName}`;
    const thumbnailPath = `${THUMBNAILS_DIR}${thumbnailFileName}`;

    // Orijinal görseli optimize ederek kaydet
    const optimizedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1080, height: 1080 } }], // Max boyut sınırı
      { compress: 0.9, format: SaveFormat.JPEG }
    );

    await FileSystem.copyAsync({
      from: optimizedImage.uri,
      to: originalPath,
    });

    // Thumbnail oluştur
    const manipulatedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: THUMBNAIL_SIZE, height: THUMBNAIL_SIZE } }],
      { compress: THUMBNAIL_QUALITY, format: SaveFormat.JPEG }
    );

    await FileSystem.copyAsync({
      from: manipulatedImage.uri,
      to: thumbnailPath,
    });

    console.log('✅ Camera image saved to file system:', {
      original: originalFileName,
      thumbnail: thumbnailFileName
    });

    return {
      originalPath: originalFileName,
      thumbnailPath: thumbnailFileName,
      fileName
    };
  } catch (error) {
    console.error('❌ Failed to save camera image:', error);
    throw error;
  }
};

/**
 * Görselin tam path'ini döndürür
 */
export const getImageUri = (fileName: string, isThumbnail: boolean = false): string => {
  if (!fileName) return '';
  
  if (isThumbnail) {
    return `${THUMBNAILS_DIR}${fileName}`;
  }
  return `${ORIGINALS_DIR}${fileName}`;
};

/**
 * Görselin var olup olmadığını kontrol eder
 */
export const checkImageExists = async (fileName: string, isThumbnail: boolean = false): Promise<boolean> => {
  try {
    const uri = getImageUri(fileName, isThumbnail);
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  } catch (error) {
    console.error('Error checking image existence:', error);
    return false;
  }
};

/**
 * Görseli siler (hem original hem thumbnail)
 */
export const deleteImage = async (originalFileName: string, thumbnailFileName: string): Promise<void> => {
  try {
    const originalPath = `${ORIGINALS_DIR}${originalFileName}`;
    const thumbnailPath = `${THUMBNAILS_DIR}${thumbnailFileName}`;

    // Original dosyayı sil
    const originalInfo = await FileSystem.getInfoAsync(originalPath);
    if (originalInfo.exists) {
      await FileSystem.deleteAsync(originalPath);
    }

    // Thumbnail dosyayı sil
    const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailPath);
    if (thumbnailInfo.exists) {
      await FileSystem.deleteAsync(thumbnailPath);
    }

    console.log('✅ Image deleted from file system:', {
      original: originalFileName,
      thumbnail: thumbnailFileName
    });
  } catch (error) {
    console.error('❌ Failed to delete image:', error);
    throw error;
  }
};

/**
 * File system'deki tüm görselleri listeler
 */
export const listAllImages = async (): Promise<{
  originals: string[];
  thumbnails: string[];
}> => {
  try {
    const originalsInfo = await FileSystem.getInfoAsync(ORIGINALS_DIR);
    const thumbnailsInfo = await FileSystem.getInfoAsync(THUMBNAILS_DIR);

    const originals = originalsInfo.exists 
      ? await FileSystem.readDirectoryAsync(ORIGINALS_DIR)
      : [];
    
    const thumbnails = thumbnailsInfo.exists
      ? await FileSystem.readDirectoryAsync(THUMBNAILS_DIR)
      : [];

    return { originals, thumbnails };
  } catch (error) {
    console.error('❌ Failed to list images:', error);
    return { originals: [], thumbnails: [] };
  }
};

/**
 * Orphaned (kullanılmayan) görselleri temizler
 */
export const cleanupOrphanedImages = async (usedFileNames: string[]): Promise<{
  removedCount: number;
  freedSpace: number;
}> => {
  try {
    const { originals, thumbnails } = await listAllImages();
    const usedSet = new Set(usedFileNames);
    
    let removedCount = 0;
    let freedSpace = 0;

    // Kullanılmayan original dosyaları sil
    for (const fileName of originals) {
      if (!usedSet.has(fileName)) {
        const filePath = `${ORIGINALS_DIR}${fileName}`;
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists) {
          freedSpace += info.size || 0;
          await FileSystem.deleteAsync(filePath);
          removedCount++;
        }
      }
    }

    // Kullanılmayan thumbnail dosyaları sil
    for (const fileName of thumbnails) {
      // Thumbnail dosya adından original dosya adını çıkar
      const originalFileName = fileName.replace('_thumb', '');
      if (!usedSet.has(originalFileName)) {
        const filePath = `${THUMBNAILS_DIR}${fileName}`;
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists) {
          freedSpace += info.size || 0;
          await FileSystem.deleteAsync(filePath);
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} orphaned files, freed ${Math.round(freedSpace / 1024)} KB`);
    }

    return { removedCount, freedSpace };
  } catch (error) {
    console.error('❌ Failed to cleanup orphaned images:', error);
    return { removedCount: 0, freedSpace: 0 };
  }
};

/**
 * File system sağlık durumunu kontrol eder
 */
export const getFileSystemHealth = async (): Promise<{
  isHealthy: boolean;
  totalFiles: number;
  totalSize: number;
  issues: string[];
}> => {
  try {
    const { originals, thumbnails } = await listAllImages();
    const issues: string[] = [];
    let totalSize = 0;

    // Klasörlerin varlığını kontrol et
    const wardrobeInfo = await FileSystem.getInfoAsync(WARDROBE_DIR);
    const originalsInfo = await FileSystem.getInfoAsync(ORIGINALS_DIR);
    const thumbnailsInfo = await FileSystem.getInfoAsync(THUMBNAILS_DIR);

    if (!wardrobeInfo.exists) issues.push('Wardrobe directory missing');
    if (!originalsInfo.exists) issues.push('Originals directory missing');
    if (!thumbnailsInfo.exists) issues.push('Thumbnails directory missing');

    // Dosya boyutlarını hesapla
    for (const fileName of originals) {
      const info = await FileSystem.getInfoAsync(`${ORIGINALS_DIR}${fileName}`);
      totalSize += info.size || 0;
    }

    for (const fileName of thumbnails) {
      const info = await FileSystem.getInfoAsync(`${THUMBNAILS_DIR}${fileName}`);
      totalSize += info.size || 0;
    }

    // Her original için thumbnail var mı kontrol et
    const originalNames = originals.map(f => f.replace('.jpg', ''));
    const thumbnailNames = thumbnails.map(f => f.replace('_thumb.jpg', ''));
    
    for (const originalName of originalNames) {
      if (!thumbnailNames.includes(originalName)) {
        issues.push(`Missing thumbnail for ${originalName}`);
      }
    }

    return {
      isHealthy: issues.length === 0,
      totalFiles: originals.length + thumbnails.length,
      totalSize,
      issues
    };
  } catch (error) {
    console.error('❌ Failed to check file system health:', error);
    return {
      isHealthy: false,
      totalFiles: 0,
      totalSize: 0,
      issues: ['Failed to perform health check']
    };
  }
};

/**
 * Development utility - file system state'ini reset et
 */
export const resetFileSystemInitialization = (): void => {
  fileSystemInitialized = false;
  initializationPromise = null;
  console.log('🔄 File system initialization state reset');
};

/**
 * File system'in initialize edilip edilmediğini kontrol et
 */
export const isFileSystemInitialized = (): boolean => {
  return fileSystemInitialized;
};