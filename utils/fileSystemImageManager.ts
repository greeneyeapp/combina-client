// utils/fileSystemImageManager.ts - Global singleton pattern ve geçici dosya yönetimi

import * as FileSystem from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { generateUniqueId } from './helpers';

const WARDROBE_DIR = `${FileSystem.documentDirectory}wardrobe/`;
const ORIGINALS_DIR = `${WARDROBE_DIR}originals/`;
const THUMBNAILS_DIR = `${WARDROBE_DIR}thumbnails/`;
const TEMP_DIR = `${FileSystem.documentDirectory}temp/`; // Geçici klasör

// Thumbnail boyutları
const THUMBNAIL_SIZE = 300;
const THUMBNAIL_QUALITY = 0.8;

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
    if (fileSystemInitialized) return;
    if (initializationPromise) return initializationPromise;
  
    initializationPromise = (async () => {
      try {
        const dirs = [WARDROBE_DIR, ORIGINALS_DIR, THUMBNAILS_DIR, TEMP_DIR];
        for (const dir of dirs) {
          const info = await FileSystem.getInfoAsync(dir);
          if (!info.exists) {
            await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
          }
        }
        console.log('✅ File system initialized successfully');
        fileSystemInitialized = true;
      } catch (error) {
        console.error('❌ Failed to initialize file system:', error);
        throw error;
      } finally {
        initializationPromise = null;
      }
    })();
    return initializationPromise;
};

/**
 * Seçilen bir resmi geçici klasöre kaydeder ve URI'sini döner.
 */
export const saveImageToTemp = async (sourceUri: string): Promise<string> => {
  await initializeFileSystem();
  const fileName = `temp_${generateUniqueId()}.jpg`;
  const tempPath = `${TEMP_DIR}${fileName}`;

  const manipulatedImage = await manipulateAsync(
    sourceUri,
    [{ resize: { width: 1080 } }], // Çok büyük dosyaları küçült
    { compress: 0.9, format: SaveFormat.JPEG }
  );

  await FileSystem.copyAsync({
    from: manipulatedImage.uri,
    to: tempPath,
  });

  return tempPath;
};

/**
 * Geçici bir resmi kalıcı gardırop klasörüne taşır.
 */
export const commitTempImage = async (tempUri: string): Promise<ImagePaths> => {
  await initializeFileSystem();
  
  const fileName = `item_${generateUniqueId()}`;
  const originalFileName = `${fileName}.jpg`;
  const thumbnailFileName = `${fileName}_thumb.jpg`;
  
  const originalPath = `${ORIGINALS_DIR}${originalFileName}`;
  const thumbnailPath = `${THUMBNAILS_DIR}${thumbnailFileName}`;

  await FileSystem.moveAsync({
    from: tempUri,
    to: originalPath,
  });

  const thumbnailImage = await manipulateAsync(
    originalPath,
    [{ resize: { width: THUMBNAIL_SIZE } }], // Oranı koruyarak küçült
    { compress: THUMBNAIL_QUALITY, format: SaveFormat.JPEG }
  );
  await FileSystem.copyAsync({
    from: thumbnailImage.uri,
    to: thumbnailPath,
  });
  // manipulateAsync tarafından oluşturulan geçici dosyayı sil
  await FileSystem.deleteAsync(thumbnailImage.uri, { idempotent: true });


  return {
    originalPath: originalFileName,
    thumbnailPath: thumbnailFileName,
    fileName,
  };
};

/**
 * Belirtilen geçici dosyayı siler.
 */
export const deleteTempImage = async (tempUri: string) => {
  try {
    if (tempUri && tempUri.startsWith(TEMP_DIR)) {
        const info = await FileSystem.getInfoAsync(tempUri);
        if (info.exists) {
          await FileSystem.deleteAsync(tempUri, { idempotent: true });
        }
    }
  } catch (error) {
    console.warn(`Could not delete temp image ${tempUri}:`, error);
  }
};

/**
 * Uygulama başlangıcında tüm geçici dosyaları temizler.
 */
export const clearTempDirectory = async () => {
  await initializeFileSystem();
  try {
    await FileSystem.deleteAsync(TEMP_DIR, { idempotent: true });
    await FileSystem.makeDirectoryAsync(TEMP_DIR, { intermediates: true });
    console.log('🧹 Temporary directory cleared.');
  } catch (error) {
    console.error('Failed to clear temp directory:', error);
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

    const originalInfo = await FileSystem.getInfoAsync(originalPath);
    if (originalInfo.exists) {
      await FileSystem.deleteAsync(originalPath);
    }

    const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailPath);
    if (thumbnailInfo.exists) {
      await FileSystem.deleteAsync(thumbnailPath);
    }
  } catch (error) {
    console.error('❌ Failed to delete image:', error);
    throw error;
  }
};

/**
 * File system'deki tüm görselleri listeler
 */
export const listAllImages = async (): Promise<{ originals: string[]; thumbnails: string[]; }> => {
  try {
    const [originalsInfo, thumbnailsInfo] = await Promise.all([
        FileSystem.getInfoAsync(ORIGINALS_DIR),
        FileSystem.getInfoAsync(THUMBNAILS_DIR)
    ]);
    
    const originals = originalsInfo.exists ? await FileSystem.readDirectoryAsync(ORIGINALS_DIR) : [];
    const thumbnails = thumbnailsInfo.exists ? await FileSystem.readDirectoryAsync(THUMBNAILS_DIR) : [];

    return { originals, thumbnails };
  } catch (e) {
    console.error('❌ Failed to list images:', e);
    return { originals: [], thumbnails: [] };
  }
};

/**
 * Orphaned (kullanılmayan) görselleri temizler
 */
export const cleanupOrphanedImages = async (usedFileNames: string[]): Promise<{ removedCount: number; freedSpace: number; }> => {
  try {
    const { originals, thumbnails } = await listAllImages();
    const usedOriginals = new Set(usedFileNames.filter(name => !name.includes('_thumb')));
    const usedThumbnails = new Set(usedFileNames.filter(name => name.includes('_thumb')));

    let removedCount = 0;
    let freedSpace = 0;

    const cleanup = async (files: string[], dir: string, usedSet: Set<string>) => {
        for (const fileName of files) {
          if (!usedSet.has(fileName)) {
            const filePath = `${dir}${fileName}`;
            const info = await FileSystem.getInfoAsync(filePath);
            if (info.exists && info.size) {
              freedSpace += info.size;
              await FileSystem.deleteAsync(filePath);
              removedCount++;
            }
          }
        }
    };
    
    await cleanup(originals, ORIGINALS_DIR, usedOriginals);
    await cleanup(thumbnails, THUMBNAILS_DIR, usedThumbnails);

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
export const getFileSystemHealth = async (): Promise<{ isHealthy: boolean; totalFiles: number; totalSize: number; issues: string[]; }> => {
  try {
    const { originals, thumbnails } = await listAllImages();
    let totalSize = 0;
    const issues: string[] = [];

    const calculateSize = async (files: string[], dir: string) => {
        let size = 0;
        for (const file of files) {
            const info = await FileSystem.getInfoAsync(`${dir}${file}`);
            if (info.exists) size += info.size ?? 0;
        }
        return size;
    };

    totalSize = await calculateSize(originals, ORIGINALS_DIR) + await calculateSize(thumbnails, THUMBNAILS_DIR);

    const originalNames = new Set(originals.map(f => f.replace('.jpg', '')));
    const thumbnailNames = new Set(thumbnails.map(f => f.replace('_thumb.jpg', '')));
    
    for (const name of originalNames) {
        if (!thumbnailNames.has(name)) {
            issues.push(`Missing thumbnail for ${name}.jpg`);
        }
    }

    return {
      isHealthy: issues.length === 0,
      totalFiles: originals.length + thumbnails.length,
      totalSize,
      issues,
    };
  } catch (e) {
    console.error('❌ Failed to check file system health:', e);
    return { isHealthy: false, totalFiles: 0, totalSize: 0, issues: ['Health check failed'] };
  }
};