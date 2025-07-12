// utils/galleryImageHelper.ts - Gallery reference system helpers

import { ClothingItem } from '@/store/clothingStore';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'react-native';

export const getAssetById = async (assetId: string): Promise<MediaLibrary.Asset | null> => {
  try {
    let found: MediaLibrary.Asset | null = null;
    let after: string | undefined = undefined;
    
    while (!found) {
      const batch = await MediaLibrary.getAssetsAsync({
        first: 100,
        mediaType: [MediaLibrary.MediaType.photo],
        after,
      });
      
      found = batch.assets.find(a => a.id === assetId) || null;
      
      if (!batch.hasNextPage) break;
      after = batch.endCursor;
    }
    
    return found;
  } catch (error) {
    console.error('Error getting asset by ID:', error);
    return null;
  }
};

export const getGalleryDisplayUri = async (item: ClothingItem): Promise<string> => {
  if (item.isImageMissing || !item.galleryAssetId) return '';

  try {
    const asset = await getAssetById(item.galleryAssetId);
    if (!asset) {
      return '';
    }

    if (Platform.OS === 'ios') {
      try {
        const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
        return assetInfo.localUri || asset.uri;
      } catch {
        return asset.uri;
      }
    }

    return asset.uri;
  } catch (error) {
    console.error('Error getting gallery display URI:', error);
    return '';
  }
};

export const validateMultipleGalleryAssets = async (items: ClothingItem[]): Promise<{
  validItems: ClothingItem[];
  invalidItems: ClothingItem[];
  results: Array<{ id: string; hasValidAsset: boolean; error?: string }>;
}> => {
  const results: Array<{ id: string; hasValidAsset: boolean; error?: string }> = [];
  const validItems: ClothingItem[] = [];
  const invalidItems: ClothingItem[] = [];

  for (const item of items) {
    try {
      if (!item.galleryAssetId) {
        results.push({ id: item.id, hasValidAsset: false });
        invalidItems.push(item);
        continue;
      }

      const asset = await getAssetById(item.galleryAssetId);
      const hasValidAsset = !!asset;
      
      results.push({ id: item.id, hasValidAsset });
      
      if (hasValidAsset) {
        validItems.push(item);
      } else {
        invalidItems.push(item);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      results.push({ id: item.id, hasValidAsset: false, error: errorMessage });
      invalidItems.push(item);
    }
  }

  return { validItems, invalidItems, results };
};

export const checkImagePermissions = async (): Promise<boolean> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking image permissions:', error);
    return false;
  }
};