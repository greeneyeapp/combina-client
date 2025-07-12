// utils/appInitialization.ts - Enhanced migration with relative path support

import { 
  ensurePermanentDirectories, 
  migrateLegacyImages, 
  migrateRegistryToRelativePaths 
} from '@/utils/permanentImageStorage';
import { useClothingStore } from '@/store/clothingStore';

export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app with UUID-resistant storage...');

    // 1. Kalıcı dizinleri oluştur
    await ensurePermanentDirectories();
    console.log('✅ Permanent directories initialized');

    // 2. Registry migration (absolute → relative paths)
    const registryMigration = await migrateRegistryToRelativePaths();
    console.log(`✅ Registry migration completed: ${registryMigration.migratedCount} entries migrated`);

    // 3. Legacy image migration 
    const legacyMigration = await migrateLegacyImages();
    console.log(`✅ Legacy image migration completed: ${legacyMigration.migratedCount} items migrated`);

    // 4. ✅ NEW: ClothingStore internal migrations
    setTimeout(async () => {
      try {
        const store = useClothingStore.getState();
        
        // a) Registry paths migration
        const registryResult = await store.migrateRegistryPaths();
        console.log(`✅ Store registry migration: ${registryResult.migratedCount} items`);
        
        // b) Relative path migration for stored items
        const relativePathResult = await store.migrateToRelativePaths();
        console.log(`✅ Store relative path migration: ${relativePathResult.migratedCount} items`);
        
        // c) Multi-color migration
        const multiColorResult = await store.migrateToMultiColor();
        console.log(`✅ Store multi-color migration: ${multiColorResult.migratedCount} items`);
        
      } catch (error) {
        console.warn('⚠️ Store migrations failed:', error);
      }
    }, 1000);

    // 5. ✅ Enhanced validation with longer delay to ensure migrations complete
    setTimeout(async () => {
      try {
        const { validateClothingImages } = useClothingStore.getState();
        const result = await validateClothingImages();
        if (result.updatedCount > 0 || result.removedCount > 0) {
          console.log(`📊 Final image validation: ${result.updatedCount} updated, ${result.removedCount} removed`);
        } else {
          console.log('✅ All images validated successfully');
        }
      } catch (error) {
        console.warn('⚠️ Image validation failed:', error);
      }
    }, 2000);

    console.log('✅ App initialization completed with UUID-resistant storage');
    
    // ✅ NEW: Return initialization results
    return {
      success: true,
      registryMigrated: registryMigration.migratedCount,
      legacyMigrated: legacyMigration.migratedCount,
      totalMigrated: registryMigration.migratedCount + legacyMigration.migratedCount
    };
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      registryMigrated: 0,
      legacyMigrated: 0,
      totalMigrated: 0
    };
  }
};

// ✅ NEW: Diagnostic function to check storage health
export const diagnoseStorageHealth = async (): Promise<{
  storageType: 'relative' | 'absolute' | 'mixed';
  totalItems: number;
  validImages: number;
  missingImages: number;
  needsMigration: number;
  recommendations: string[];
}> => {
  try {
    const { clothing } = useClothingStore.getState();
    
    let absolutePathCount = 0;
    let relativePathCount = 0;
    let validImages = 0;
    let missingImages = 0;
    let needsMigration = 0;
    
    for (const item of clothing) {
      // Check path types
      if (item.originalImageUri) {
        if (item.originalImageUri.startsWith('/')) {
          absolutePathCount++;
          needsMigration++;
        } else {
          relativePathCount++;
        }
      }
      
      if (item.thumbnailImageUri) {
        if (item.thumbnailImageUri.startsWith('/')) {
          absolutePathCount++;
          needsMigration++;
        } else {
          relativePathCount++;
        }
      }
      
      // Check image validity
      if (item.isImageMissing) {
        missingImages++;
      } else {
        validImages++;
      }
    }
    
    // Determine storage type
    let storageType: 'relative' | 'absolute' | 'mixed';
    if (absolutePathCount === 0) {
      storageType = 'relative';
    } else if (relativePathCount === 0) {
      storageType = 'absolute';
    } else {
      storageType = 'mixed';
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (storageType === 'absolute') {
      recommendations.push('Run migration to convert absolute paths to relative paths');
    } else if (storageType === 'mixed') {
      recommendations.push('Complete migration to ensure all paths are relative');
    }
    
    if (missingImages > 0) {
      recommendations.push(`${missingImages} items have missing images - consider re-adding photos`);
    }
    
    if (needsMigration > 0) {
      recommendations.push(`${needsMigration} items need path migration for UUID safety`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Storage is healthy and UUID-resistant!');
    }
    
    return {
      storageType,
      totalItems: clothing.length,
      validImages,
      missingImages,
      needsMigration,
      recommendations
    };
    
  } catch (error) {
    console.error('❌ Storage diagnosis failed:', error);
    return {
      storageType: 'mixed',
      totalItems: 0,
      validImages: 0,
      missingImages: 0,
      needsMigration: 0,
      recommendations: ['Storage diagnosis failed - check logs']
    };
  }
};

// ✅ NEW: Emergency recovery function
export const emergencyStorageRecovery = async (): Promise<{
  success: boolean;
  recoveredItems: number;
  failedItems: number;
  actions: string[];
}> => {
  console.log('🚨 Starting emergency storage recovery...');
  
  const actions: string[] = [];
  let recoveredItems = 0;
  let failedItems = 0;
  
  try {
    // 1. Re-create directories
    await ensurePermanentDirectories();
    actions.push('Recreated permanent directories');
    
    // 2. Force all migrations
    const store = useClothingStore.getState();
    
    const registryResult = await store.migrateRegistryPaths();
    actions.push(`Registry migration: ${registryResult.migratedCount} items`);
    
    const relativeResult = await store.migrateToRelativePaths();
    actions.push(`Relative path migration: ${relativeResult.migratedCount} items`);
    recoveredItems += relativeResult.migratedCount;
    
    // 3. Validate all images
    const validationResult = await store.validateClothingImages();
    actions.push(`Validation: ${validationResult.updatedCount} updated, ${validationResult.removedCount} removed`);
    failedItems = validationResult.removedCount;
    
    // 4. Clean up any orphaned files
    const { clothing } = store;
    const activeItemIds = clothing.map(item => item.id);
    // Note: cleanupUnusedImages would be called here if imported
    
    actions.push('Emergency recovery completed');
    
    return {
      success: true,
      recoveredItems,
      failedItems,
      actions
    };
    
  } catch (error) {
    console.error('❌ Emergency recovery failed:', error);
    actions.push(`Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    return {
      success: false,
      recoveredItems,
      failedItems,
      actions
    };
  }
};