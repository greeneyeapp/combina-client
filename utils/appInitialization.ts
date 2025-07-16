// utils/appInitialization.ts - File system tekrarı tamamen düzeltilmiş

import { useClothingStore } from '@/store/clothingStore';
import { initializeFileSystem, getFileSystemHealth, cleanupOrphanedImages } from '@/utils/fileSystemImageManager';

// Global singleton state
let isInitializing = false;
let isInitialized = false;
let initializationPromise: Promise<any> | null = null;
let maintenanceScheduled = false;

export const initializeApp = async () => {
  // Prevent duplicate initialization
  if (isInitialized) {
    console.log('📋 App already initialized, skipping...');
    return { success: true, system: 'file_system_storage', cached: true };
  }

  if (isInitializing) {
    console.log('⏳ App initialization in progress, waiting...');
    return await initializationPromise;
  }

  isInitializing = true;
  
  initializationPromise = performInitialization();
  
  try {
    const result = await initializationPromise;
    isInitialized = true;
    return result;
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    isInitializing = false;
    initializationPromise = null;
  }
};

const performInitialization = async () => {
  try {
    // File system'i initialize et - fileSystemImageManager'da singleton var
    await initializeFileSystem();

    // Maintenance'i SADECE development'ta ve TEK SEFERLIK schedule et
    if (__DEV__ && !maintenanceScheduled) {
      scheduleMaintenanceTasks();
    }

    return {
      success: true,
      system: 'file_system_storage',
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ App initialization failed:', error);
    throw error;
  }
};

// Schedule maintenance tasks to run only once
const scheduleMaintenanceTasks = () => {
  if (maintenanceScheduled) {
    console.log('📋 Maintenance tasks already scheduled, skipping...');
    return;
  }

  maintenanceScheduled = true;
  
  // SADECE clothing store validation'ını bekle - diğer validation'lar zaten çalışacak
  setTimeout(async () => {
    try {
      console.log('🔧 Starting scheduled maintenance tasks...');
      
      const { cleanupOrphanedFiles } = useClothingStore.getState();
      
      // SADECE orphaned files cleanup - clothing validation zaten store'da çalışıyor
      const cleanupResult = await cleanupOrphanedFiles();
      if (cleanupResult.removedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanupResult.removedCount} orphaned files, freed ${Math.round(cleanupResult.freedSpace / 1024)} KB`);
      } else {
        console.log('✅ No orphaned files found');
      }

      console.log('✅ Maintenance tasks completed');
      
    } catch (error) {
      console.warn('⚠️ Maintenance tasks failed:', error);
    }
  }, 4000); // 4 saniye delay - store validation'dan sonra
};

// File system health diagnostics
export const diagnoseFileSystemHealth = async (t?: (key: string, options?: any) => string): Promise<{
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
  const translate = t || ((key: string) => key);
  
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
      recommendations.push(translate('appInit.itemsMissingPaths', { count: withMissingPaths }));
    }
    
    if (systemHealth.issues.length > 0) {
      recommendations.push(...systemHealth.issues);
    }
    
    if (!systemHealth.isHealthy) {
      recommendations.push(translate('appInit.systemNeedsMaintenance'));
    }
    
    if (recommendations.length === 0) {
      recommendations.push(translate('appInit.systemHealthy'));
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
      recommendations: [translate('appInit.diagnosisFailed')],
      systemHealth: {
        isHealthy: false,
        totalFiles: 0,
        totalSize: 0,
        issues: [translate('appInit.diagnosisFailed')]
      }
    };
  }
};

// Development utility for file system stats
export const getFileSystemStats = async (t?: (key: string, options?: any) => string): Promise<{
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
  const translate = t || ((key: string) => key);
  
  try {
    const health = await getFileSystemHealth();
    
    const recommendations: string[] = [];
    const totalSizeMB = Math.round(health.totalSize / (1024 * 1024) * 100) / 100;
    
    // Storage recommendations
    if (totalSizeMB > 100) {
      recommendations.push(translate('appInit.highStorageUsage'));
    }
    
    if (health.totalFiles > 200) {
      recommendations.push(translate('appInit.considerCompression'));
    }
    
    if (health.issues.length > 0) {
      recommendations.push(translate('appInit.systemHasIssues'));
    }
    
    if (recommendations.length === 0) {
      recommendations.push(translate('appInit.performanceOptimal'));
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
      recommendations: [translate('appInit.performanceAnalysisFailed')]
    };
  }
};

// File system maintenance utilities
export const performFileSystemMaintenance = async (t?: (key: string, options?: any) => string): Promise<{
  success: boolean;
  actions: string[];
  errors: string[];
}> => {
  const translate = t || ((key: string) => key);
  const actions: string[] = [];
  const errors: string[] = [];
  
  try {
    // Reinitialize directories sadece gerekirse
    await initializeFileSystem();
    actions.push(translate('appInit.directoriesReinitialized'));
    
    // Validate and cleanup
    const { validateClothingImages, cleanupOrphanedFiles } = useClothingStore.getState();
    
    const validationResult = await validateClothingImages();
    if (validationResult.removedCount > 0) {
      actions.push(translate('appInit.removedMissingItems', { count: validationResult.removedCount }));
    }
    
    const cleanupResult = await cleanupOrphanedFiles();
    if (cleanupResult.removedCount > 0) {
      actions.push(translate('appInit.cleanedOrphanedFiles', { count: cleanupResult.removedCount }));
      actions.push(translate('appInit.freedStorage', { size: Math.round(cleanupResult.freedSpace / 1024) }));
    }
    
    actions.push(translate('appInit.maintenanceCompleted'));
    
    return {
      success: true,
      actions,
      errors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : translate('appInit.unknownError');
    errors.push(translate('appInit.maintenanceFailed', { error: errorMessage }));
    
    return {
      success: false,
      actions,
      errors
    };
  }
};

// Reset initialization state (for development/testing)
export const resetInitializationState = () => {
  isInitializing = false;
  isInitialized = false;
  initializationPromise = null;
  maintenanceScheduled = false;
  console.log('🔄 Initialization state reset');
};

// Check if app is initialized
export const isAppInitialized = () => isInitialized;