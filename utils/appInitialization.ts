// utils/appInitialization.ts - Clean gallery reference system only

import { useClothingStore } from '@/store/clothingStore';

export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app with gallery reference system...');

    // Gallery validation
    setTimeout(async () => {
      try {
        const { validateClothingImages } = useClothingStore.getState();
        const result = await validateClothingImages();
        if (result.updatedCount > 0 || result.removedCount > 0) {
          console.log(`📊 Gallery validation: ${result.updatedCount} updated, ${result.removedCount} removed`);
        } else {
          console.log('✅ All gallery assets validated successfully');
        }
      } catch (error) {
        console.warn('⚠️ Gallery validation failed:', error);
      }
    }, 1500);

    console.log('✅ App initialization completed with gallery reference system');
    
    return {
      success: true,
      system: 'gallery_reference'
    };
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Gallery system health check
export const diagnoseGalleryHealth = async (): Promise<{
  totalItems: number;
  withGalleryRef: number;
  withoutGalleryRef: number;
  missingAssets: number;
  recommendations: string[];
}> => {
  try {
    const { clothing } = useClothingStore.getState();
    
    let withGalleryRef = 0;
    let withoutGalleryRef = 0;
    let missingAssets = 0;
    
    for (const item of clothing) {
      if (item.galleryAssetId) {
        withGalleryRef++;
      } else {
        withoutGalleryRef++;
      }
      
      if (item.isImageMissing) {
        missingAssets++;
      }
    }
    
    const recommendations: string[] = [];
    
    if (withoutGalleryRef > 0) {
      recommendations.push(`${withoutGalleryRef} items need gallery reference - re-select photos`);
    }
    
    if (missingAssets > 0) {
      recommendations.push(`${missingAssets} items have missing gallery assets`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Gallery system is healthy!');
    }
    
    return {
      totalItems: clothing.length,
      withGalleryRef,
      withoutGalleryRef,
      missingAssets,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ Gallery diagnosis failed:', error);
    return {
      totalItems: 0,
      withGalleryRef: 0,
      withoutGalleryRef: 0,
      missingAssets: 0,
      recommendations: ['Gallery diagnosis failed - check logs']
    };
  }
};