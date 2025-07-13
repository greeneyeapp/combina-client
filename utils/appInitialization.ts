// utils/appInitialization.ts - File system based image storage initialization

import { useClothingStore } from '@/store/clothingStore';
import { initializeFileSystem, getFileSystemHealth, cleanupOrphanedImages } from '@/utils/fileSystemImageManager';

export const initializeApp = async () => {
  try {
    console.log('🚀 Initializing app with file system storage...');

    // Initialize file system directories
    await initializeFileSystem();

    // File system validation and cleanup
    setTimeout(async () => {
      try {
        const { validateClothingImages, cleanupOrphanedFiles } = useClothingStore.getState();
        
        // Validate existing clothing items
        const result = await validateClothingImages();
        if (result.updatedCount > 0 || result.removedCount > 0) {
          console.log(`📊 File system validation: ${result.updatedCount} updated, ${result.removedCount} removed`);
        } else {
          console.log('✅ All file system assets validated successfully');
        }

        // Cleanup orphaned files
        const cleanupResult = await cleanupOrphanedFiles();
        if (cleanupResult.removedCount > 0) {
          console.log(`🧹 Cleaned up ${cleanupResult.removedCount} orphaned files, freed ${Math.round(cleanupResult.freedSpace / 1024)} KB`);
        }

      } catch (error) {
        console.warn('⚠️ File system validation failed:', error);
      }
    }, 1500);

    console.log('✅ App initialization completed with file system storage');
    
    return {
      success: true,
      system: 'file_system_storage'
    };
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// File system health diagnostics
export const diagnoseFileSystemHealth = async (): Promise<{
  totalItems: number;
  withValidPaths: number;
  withMissingPaths: number;
  missingFiles: number;
  recommendations: string[];
  systemHealth: {
    isHealthy: boolean;
    totalFiles: number;
    totalSize: number;
    issues: string[];
  };
}> => {
  try {
    const { clothing } = useClothingStore.getState();
    
    let withValidPaths = 0;
    let withMissingPaths = 0;
    let missingFiles = 0;
    
    for (const item of clothing) {
      if (item.originalImagePath && item.thumbnailImagePath) {
        withValidPaths++;
      } else {
        withMissingPaths++;
      }
    }
    
    // Get detailed file system health
    const systemHealth = await getFileSystemHealth();
    
    const recommendations: string[] = [];
    
    if (withMissingPaths > 0) {
      recommendations.push(`${withMissingPaths} items have missing image paths - need to be re-added`);
    }
    
    if (systemHealth.issues.length > 0) {
      recommendations.push(...systemHealth.issues);
    }
    
    if (!systemHealth.isHealthy) {
      recommendations.push('File system requires maintenance');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('File system is healthy!');
    }
    
    return {
      totalItems: clothing.length,
      withValidPaths,
      withMissingPaths,
      missingFiles,
      recommendations,
      systemHealth
    };
    
  } catch (error) {
    console.error('❌ File system diagnosis failed:', error);
    return {
      totalItems: 0,
      withValidPaths: 0,
      withMissingPaths: 0,
      missingFiles: 0,
      recommendations: ['File system diagnosis failed - check logs'],
      systemHealth: {
        isHealthy: false,
        totalFiles: 0,
        totalSize: 0,
        issues: ['Diagnosis failed']
      }
    };
  }
};

// Development utility for file system stats
export const getFileSystemStats = async (): Promise<{
  storage: {
    totalSizeMB: number;
    fileCount: number;
  };
  performance: {
    averageLoadTime?: number;
    cacheHitRate?: number;
  };
  recommendations: string[];
}> => {
  try {
    const health = await getFileSystemHealth();
    
    const recommendations: string[] = [];
    const totalSizeMB = Math.round(health.totalSize / (1024 * 1024) * 100) / 100;
    
    // Storage recommendations
    if (totalSizeMB > 100) {
      recommendations.push('Consider cleaning up old images - storage usage is high');
    }
    
    if (health.totalFiles > 200) {
      recommendations.push('Large number of files - consider implementing image compression');
    }
    
    if (health.issues.length > 0) {
      recommendations.push('File system has issues that need attention');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('File system performance is optimal');
    }
    
    return {
      storage: {
        totalSizeMB,
        fileCount: health.totalFiles
      },
      performance: {
        // These could be implemented with actual performance monitoring
        averageLoadTime: undefined,
        cacheHitRate: undefined
      },
      recommendations
    };
    
  } catch (error) {
    console.error('❌ Failed to get file system stats:', error);
    return {
      storage: {
        totalSizeMB: 0,
        fileCount: 0
      },
      performance: {},
      recommendations: ['Failed to analyze file system performance']
    };
  }
};

// File system maintenance utilities
export const performFileSystemMaintenance = async (): Promise<{
  success: boolean;
  actions: string[];
  errors: string[];
}> => {
  const actions: string[] = [];
  const errors: string[] = [];
  
  try {
    // Reinitialize directories
    await initializeFileSystem();
    actions.push('Reinitialized file system directories');
    
    // Validate and cleanup
    const { validateClothingImages, cleanupOrphanedFiles } = useClothingStore.getState();
    
    const validationResult = await validateClothingImages();
    if (validationResult.removedCount > 0) {
      actions.push(`Removed ${validationResult.removedCount} items with missing files`);
    }
    
    const cleanupResult = await cleanupOrphanedFiles();
    if (cleanupResult.removedCount > 0) {
      actions.push(`Cleaned up ${cleanupResult.removedCount} orphaned files`);
      actions.push(`Freed ${Math.round(cleanupResult.freedSpace / 1024)} KB of storage`);
    }
    
    actions.push('File system maintenance completed successfully');
    
    return {
      success: true,
      actions,
      errors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(`Maintenance failed: ${errorMessage}`);
    
    return {
      success: false,
      actions,
      errors
    };
  }
};