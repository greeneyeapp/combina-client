// utils/optimizedImageStorage.ts
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WARDROBE_IMAGES_DIR = FileSystem.documentDirectory + 'wardrobe_images/';

// Kalite ayarları
const QUALITY_SETTINGS = {
  low: { maxSize: 600, compression: 0.5, maxFileSize: 200 * 1024 }, // 200KB
  medium: { maxSize: 800, compression: 0.7, maxFileSize: 500 * 1024 }, // 500KB
  high: { maxSize: 1200, compression: 0.8, maxFileSize: 1024 * 1024 }, // 1MB
};

// Görsel klasörünü oluştur
export const ensureImageDirectoryExists = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(WARDROBE_IMAGES_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(WARDROBE_IMAGES_DIR, { intermediates: true });
    }
  } catch (error) {

  }
};

// Kullanıcının kalite ayarını al
export const getImageQualitySettings = async () => {
  try {
    const quality = await AsyncStorage.getItem('image_quality');
    return QUALITY_SETTINGS[quality as keyof typeof QUALITY_SETTINGS] || QUALITY_SETTINGS.medium;
  } catch (error) {
    console.error('Error getting quality settings:', error);
    return QUALITY_SETTINGS.medium;
  }
};

// Güvenli dosya adı oluştur
export const generateSafeFileName = async (): Promise<string> => {
  const timestamp = Date.now();
  const randomId = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${timestamp}_${Math.random()}`
  );
  return `wardrobe_${timestamp}_${randomId.substring(0, 8)}.jpg`;
};

// Görseli optimize et ve kaydet
export const optimizeAndSaveImage = async (sourceUri: string): Promise<{
  uri: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}> => {
  try {
    await ensureImageDirectoryExists();
    
    // Orijinal dosya boyutunu al
    const originalInfo = await FileSystem.getInfoAsync(sourceUri);
    const originalSize = originalInfo.size || 0;
        
    // Kullanıcının kalite ayarını al
    const settings = await getImageQualitySettings();
    
    // 1. Görseli yeniden boyutlandır ve sıkıştır
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      sourceUri,
      [
        // Boyutu küçült (en-boy oranını koru)
        { resize: { width: settings.maxSize } }
      ],
      {
        compress: settings.compression,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false
      }
    );
    
    // 2. Eğer hâlâ çok büyükse daha fazla sıkıştır
    let finalImage = manipulatedImage;
    let currentQuality = settings.compression;
    
    // Dosya boyutunu kontrol et
    let tempInfo = await FileSystem.getInfoAsync(finalImage.uri);
    let currentSize = tempInfo.size || 0;
    
    // Dosya hâlâ çok büyükse kaliteyi düşür
    while (currentSize > settings.maxFileSize && currentQuality > 0.3) {
      currentQuality -= 0.1;
      
      finalImage = await ImageManipulator.manipulateAsync(
        sourceUri,
        [{ resize: { width: settings.maxSize } }],
        {
          compress: currentQuality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: false
        }
      );
      
      tempInfo = await FileSystem.getInfoAsync(finalImage.uri);
      currentSize = tempInfo.size || 0;
    }
    
    // 3. Güvenli dosya adı oluştur
    const fileName = await generateSafeFileName();
    const destinationUri = WARDROBE_IMAGES_DIR + fileName;
    
    // 4. Optimize edilmiş görseli kalıcı dizine kopyala
    await FileSystem.copyAsync({
      from: finalImage.uri,
      to: destinationUri
    });
    
    // 5. Geçici dosyayı temizle
    if (finalImage.uri !== sourceUri) {
      await FileSystem.deleteAsync(finalImage.uri, { idempotent: true });
    }
    
    const finalInfo = await FileSystem.getInfoAsync(destinationUri);
    const compressedSize = finalInfo.size || 0;
    const compressionRatio = originalSize > 0 ? (compressedSize / originalSize) : 1;
    
    
    return {
      uri: destinationUri,
      originalSize,
      compressedSize,
      compressionRatio
    };
    
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw error;
  }
};

// Görsel dosyasının var olup olmadığını kontrol et
export const checkImageExists = async (imageUri: string): Promise<boolean> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    return fileInfo.exists;
  } catch (error) {
    console.error('Error checking image existence:', error);
    return false;
  }
};

// Eksik görselleri tespit et ve rapor et
export const validateClothingImages = async (clothingItems: any[]): Promise<{
  validItems: any[];
  invalidItems: any[];
}> => {
  const validItems: any[] = [];
  const invalidItems: any[] = [];
  
  for (const item of clothingItems) {
    const exists = await checkImageExists(item.imageUri);
    if (exists) {
      validItems.push(item);
    } else {
      invalidItems.push(item);
      console.warn(`Missing image for item: ${item.name} (${item.id})`);
    }
  }
  
  return { validItems, invalidItems };
};

// Eski görseli temizle
export const deleteImageFile = async (imageUri: string): Promise<void> => {
  try {
    if (imageUri.includes('wardrobe_images/')) {
      const exists = await checkImageExists(imageUri);
      if (exists) {
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
      }
    }
  } catch (error) {
    console.error('Error deleting image file:', error);
  }
};

// Depolama kullanım istatistikleri
export const getStorageStats = async (): Promise<{
  totalSize: number;
  imageCount: number;
  avgImageSize: number;
  formattedSize: string;
}> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(WARDROBE_IMAGES_DIR);
    if (!dirInfo.exists) {
      return { totalSize: 0, imageCount: 0, avgImageSize: 0, formattedSize: '0 KB' };
    }
    
    const files = await FileSystem.readDirectoryAsync(WARDROBE_IMAGES_DIR);
    let totalSize = 0;
    let imageCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
        const fileInfo = await FileSystem.getInfoAsync(WARDROBE_IMAGES_DIR + file);
        totalSize += fileInfo.size || 0;
        imageCount++;
      }
    }
    
    const avgImageSize = imageCount > 0 ? totalSize / imageCount : 0;
    const formattedSize = formatFileSize(totalSize);
    
    return { totalSize, imageCount, avgImageSize, formattedSize };
    
  } catch (error) {
    console.error('Error getting storage stats:', error);
    return { totalSize: 0, imageCount: 0, avgImageSize: 0, formattedSize: '0 KB' };
  }
};

// Dosya boyutunu formatla
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 KB';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Depolama temizliği (kullanılmayan görselleri sil)
export const cleanupUnusedImages = async (activeImageUris: string[]): Promise<{
  deletedCount: number;
  freedSpace: number;
}> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(WARDROBE_IMAGES_DIR);
    if (!dirInfo.exists) return { deletedCount: 0, freedSpace: 0 };
    
    const files = await FileSystem.readDirectoryAsync(WARDROBE_IMAGES_DIR);
    let deletedCount = 0;
    let freedSpace = 0;
        
    for (const file of files) {
      const fullPath = WARDROBE_IMAGES_DIR + file;
      
      // Dosya adıyla kontrol et (URI'nin son kısmı)
      const isUsed = activeImageUris.some(uri => {
        const fileName = uri.split('/').pop();
        return fileName === file;
      });
      
      if (!isUsed && (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png'))) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(fullPath);
          if (fileInfo.exists) {
            freedSpace += fileInfo.size || 0;
            await FileSystem.deleteAsync(fullPath, { idempotent: true });
            deletedCount++;
          }
        } catch (error) {

        }
      } 
    }
    
    return { deletedCount, freedSpace };
    
  } catch (error) {
    return { deletedCount: 0, freedSpace: 0 };
  }
};

export const cleanupMissingImages = async (clothingItems: any[]): Promise<any[]> => {
  const { validItems, invalidItems } = await validateClothingImages(clothingItems);
  
  if (invalidItems.length > 0) {
    console.warn(`Found ${invalidItems.length} items with missing images. These will be filtered out.`);
  }
  
  return validItems;
};