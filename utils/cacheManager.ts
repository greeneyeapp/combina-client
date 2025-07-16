// utils/cacheManager.ts - Düzeltilmiş ve optimize edilmiş versiyon

import * as FileSystem from 'expo-file-system';
import { getFileSystemHealth, cleanupOrphanedImages } from '@/utils/fileSystemImageManager';
import { useClothingStore } from '@/store/clothingStore';

interface CacheStats {
  fileSystemSize: number;
  fileCount: number;
  lastCleanup: string | null;
  issues: string[];
}

interface CacheConfig {
  maxStorageSizeMB: number;
  maxFileAge: number; // in days
  cleanupInterval: number; // in milliseconds
  autoCleanup: boolean;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxStorageSizeMB: 500, // 500MB limit for wardrobe images
  maxFileAge: 365, // Keep files for 1 year
  cleanupInterval: 24 * 60 * 60 * 1000, // Daily cleanup
  autoCleanup: true
};

// Global state to prevent duplicate initialization
let cleanupTimer: NodeJS.Timeout | null = null;
let isCleanupRunning = false;
let isCacheManagerInitialized = false;

/**
 * Initialize file system cache monitoring
 */
export const initializeCaches = (t?: (key: string, options?: any) => string): (() => void) => {
  // Prevent duplicate initialization
  if (isCacheManagerInitialized) {
    console.log('📋 Cache manager already initialized, skipping...');
    return () => {}; // Return empty cleanup function
  }

  console.log('🗄️ Initializing file system cache manager...');
  isCacheManagerInitialized = true;
  
  // Start periodic cleanup if enabled
  if (DEFAULT_CONFIG.autoCleanup) {
    startCacheMonitor();
  }
  
  // Return cleanup function
  return () => {
    cleanupCacheManager();
  };
};

/**
 * Start periodic cache monitoring
 */
const startCacheMonitor = (): void => {
  // Prevent duplicate timers
  if (cleanupTimer) {
    console.log('📋 Cache monitor already running, skipping...');
    return;
  }
  
  cleanupTimer = setInterval(async () => {
    if (!isCleanupRunning) {
      await performScheduledCleanup();
    }
  }, DEFAULT_CONFIG.cleanupInterval);
  
  console.log('📊 Cache monitor started - will run every 24 hours');
};

/**
 * Cleanup cache manager resources
 */
const cleanupCacheManager = (): void => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
  isCacheManagerInitialized = false;
  console.log('🧹 Cache manager cleanup completed');
};

/**
 * Validate and clean file system cache
 */
export const validateAndCleanCaches = async (t: (key: string, options?: any) => string): Promise<{
  fileSystemStats: CacheStats;
  recommendationCount: number;
  recommendations: string[];
  cleanupPerformed: boolean;
}> => {
  try {
    const health = await getFileSystemHealth();
    const sizeMB = Math.round(health.totalSize / (1024 * 1024) * 100) / 100;
    
    const stats: CacheStats = {
      fileSystemSize: sizeMB,
      fileCount: health.totalFiles,
      lastCleanup: null, // We don't track this currently
      issues: health.issues
    };
    
    const recommendations: string[] = [];
    let cleanupPerformed = false;
    
    // Size-based recommendations
    if (sizeMB > DEFAULT_CONFIG.maxStorageSizeMB) {
      recommendations.push(t('cacheManager.recommendations.storageExceedsLimit', { 
        sizeMB, 
        maxMB: DEFAULT_CONFIG.maxStorageSizeMB 
      }));
      cleanupPerformed = await performEmergencyCleanup(t);
    } else if (sizeMB > DEFAULT_CONFIG.maxStorageSizeMB * 0.8) {
      recommendations.push(t('cacheManager.recommendations.storageApproachingLimit', { sizeMB }));
    }
    
    // File count recommendations
    if (health.totalFiles > 1000) {
      recommendations.push(t('cacheManager.recommendations.largeFileCount'));
    }
    
    // Health issues
    if (health.issues.length > 0) {
      recommendations.push(...health.issues.map(issue => 
        t('cacheManager.recommendations.fileSystemIssue', { issue })
      ));
    }
    
    // Performance recommendations
    if (sizeMB < 10 && health.totalFiles < 50) {
      recommendations.push(t('cacheManager.recommendations.cacheOptimal'));
    }
    
    console.log(`📊 Cache validation: ${sizeMB}MB, ${health.totalFiles} files, ${recommendations.length} recommendations`);
    
    return {
      fileSystemStats: stats,
      recommendationCount: recommendations.length,
      recommendations,
      cleanupPerformed
    };
    
  } catch (error) {
    console.error('❌ Cache validation failed:', error);
    return {
      fileSystemStats: {
        fileSystemSize: 0,
        fileCount: 0,
        lastCleanup: null,
        issues: [t('cacheManager.validationFailed')]
      },
      recommendationCount: 1,
      recommendations: [t('cacheManager.checkLogs')],
      cleanupPerformed: false
    };
  }
};

/**
 * Perform scheduled cleanup
 */
const performScheduledCleanup = async (): Promise<void> => {
  if (isCleanupRunning) return;
  
  isCleanupRunning = true;
  console.log('🧹 Starting scheduled cache cleanup...');
  
  try {
    const { cleanupOrphanedFiles } = useClothingStore.getState();
    
    // Get current file system health
    const health = await getFileSystemHealth();
    const sizeMB = health.totalSize / (1024 * 1024);
    
    // Only cleanup if we're approaching limits
    if (sizeMB > DEFAULT_CONFIG.maxStorageSizeMB * 0.7 || health.issues.length > 0) {
      const result = await cleanupOrphanedFiles();
      
      if (result.removedCount > 0) {
        console.log(`🧹 Scheduled cleanup: removed ${result.removedCount} orphaned files, freed ${Math.round(result.freedSpace / 1024)} KB`);
      }
    }
    
  } catch (error) {
    console.error('❌ Scheduled cleanup failed:', error);
  } finally {
    isCleanupRunning = false;
  }
};

/**
 * Perform emergency cleanup when storage is full
 */
const performEmergencyCleanup = async (t: (key: string, options?: any) => string): Promise<boolean> => {
  console.log('🚨 Performing emergency cache cleanup...');
  
  try {
    const { cleanupOrphanedFiles } = useClothingStore.getState();
    
    // Cleanup orphaned files
    const result = await cleanupOrphanedFiles();
    
    // Check if we freed enough space
    const healthAfter = await getFileSystemHealth();
    const sizeMBAfter = healthAfter.totalSize / (1024 * 1024);
    
    const success = sizeMBAfter < DEFAULT_CONFIG.maxStorageSizeMB * 0.9;
    
    console.log(`🚨 Emergency cleanup ${success ? 'succeeded' : 'failed'}: ${Math.round(sizeMBAfter * 100) / 100}MB remaining`);
    
    return success;
    
  } catch (error) {
    console.error('❌ Emergency cleanup failed:', error);
    return false;
  }
};

/**
 * Get detailed cache analytics
 */
export const getCacheAnalytics = async (t: (key: string, options?: any) => string): Promise<{
  storage: {
    totalMB: number;
    averageFileSizeKB: number;
    largestFileKB: number;
  };
  usage: {
    totalItems: number;
    itemsWithImages: number;
    orphanedFiles: number;
  };
  performance: {
    healthScore: number; // 0-100
    recommendations: string[];
  };
}> => {
  try {
    const health = await getFileSystemHealth();
    const { clothing } = useClothingStore.getState();
    
    const totalMB = Math.round(health.totalSize / (1024 * 1024) * 100) / 100;
    const averageFileSizeKB = health.totalFiles > 0 
      ? Math.round(health.totalSize / health.totalFiles / 1024)
      : 0;
    
    // Calculate health score
    let healthScore = 100;
    
    // Penalize for storage usage
    const storageUsagePercent = (totalMB / DEFAULT_CONFIG.maxStorageSizeMB) * 100;
    if (storageUsagePercent > 80) healthScore -= 20;
    else if (storageUsagePercent > 60) healthScore -= 10;
    
    // Penalize for issues
    healthScore -= health.issues.length * 15;
    
    // Ensure score is between 0-100
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    const itemsWithImages = clothing.filter(item => 
      item.originalImagePath && item.thumbnailImagePath
    ).length;
    
    const recommendations: string[] = [];
    
    if (healthScore < 70) {
      recommendations.push(t('cacheManager.recommendations.needsAttention'));
    }
    if (storageUsagePercent > 80) {
      recommendations.push(t('cacheManager.recommendations.highStorageUsage'));
    }
    if (health.issues.length > 0) {
      recommendations.push(t('cacheManager.recommendations.structuralIssues'));
    }
    if (recommendations.length === 0) {
      recommendations.push(t('cacheManager.recommendations.performingWell'));
    }
    
    return {
      storage: {
        totalMB,
        averageFileSizeKB,
        largestFileKB: 0 // Would need to iterate through files to calculate
      },
      usage: {
        totalItems: clothing.length,
        itemsWithImages,
        orphanedFiles: 0 // Would need to compare with actual files to calculate
      },
      performance: {
        healthScore,
        recommendations
      }
    };
    
  } catch (error) {
    console.error('❌ Failed to get cache analytics:', error);
    return {
      storage: {
        totalMB: 0,
        averageFileSizeKB: 0,
        largestFileKB: 0
      },
      usage: {
        totalItems: 0,
        itemsWithImages: 0,
        orphanedFiles: 0
      },
      performance: {
        healthScore: 0,
        recommendations: [t('cacheManager.analytics.failed')]
      }
    };
  }
};

/**
 * Force immediate cache cleanup
 */
export const forceCacheCleanup = async (t: (key: string, options?: any) => string): Promise<{
  success: boolean;
  removedFiles: number;
  freedSpaceKB: number;
  errors: string[];
}> => {
  const errors: string[] = [];
  
  try {
    console.log('🧹 Force cleaning file system cache...');
    
    const { cleanupOrphanedFiles } = useClothingStore.getState();
    const result = await cleanupOrphanedFiles();
    
    return {
      success: true,
      removedFiles: result.removedCount,
      freedSpaceKB: Math.round(result.freedSpace / 1024),
      errors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    
    return {
      success: false,
      removedFiles: 0,
      freedSpaceKB: 0,
      errors
    };
  }
};

/**
 * Reset cache manager state (for development/testing)
 */
export const resetCacheManager = (): void => {
  cleanupCacheManager();
  console.log('🔄 Cache manager state reset');
};