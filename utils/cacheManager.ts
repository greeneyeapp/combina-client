// utils/cacheManager.ts - File system cache management

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

let cleanupTimer: NodeJS.Timeout | null = null;
let isCleanupRunning = false;

/**
 * Initialize file system cache monitoring
 */
export const initializeCaches = (): (() => void) => {
  console.log('🗄️ Initializing file system cache manager...');
  
  // Start periodic cleanup if enabled
  if (DEFAULT_CONFIG.autoCleanup) {
    startCacheMonitor();
  }
  
  // Return cleanup function
  return () => {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
    console.log('🧹 Cache manager cleanup completed');
  };
};

/**
 * Start periodic cache monitoring
 */
export const startCacheMonitor = (): void => {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }
  
  cleanupTimer = setInterval(async () => {
    if (!isCleanupRunning) {
      await performScheduledCleanup();
    }
  }, DEFAULT_CONFIG.cleanupInterval);
  
  console.log('📊 Cache monitor started - will run every 24 hours');
};

/**
 * Validate and clean file system cache
 */
export const validateAndCleanCaches = async (): Promise<{
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
      recommendations.push(`Storage usage (${sizeMB}MB) exceeds limit (${DEFAULT_CONFIG.maxStorageSizeMB}MB)`);
      cleanupPerformed = await performEmergencyCleanup();
    } else if (sizeMB > DEFAULT_CONFIG.maxStorageSizeMB * 0.8) {
      recommendations.push(`Storage usage (${sizeMB}MB) is approaching limit - consider cleanup`);
    }
    
    // File count recommendations
    if (health.totalFiles > 1000) {
      recommendations.push('Large number of files - performance may be affected');
    }
    
    // Health issues
    if (health.issues.length > 0) {
      recommendations.push(...health.issues.map(issue => `File system issue: ${issue}`));
    }
    
    // Performance recommendations
    if (sizeMB < 10 && health.totalFiles < 50) {
      recommendations.push('File system cache is optimal');
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
        issues: ['Validation failed']
      },
      recommendationCount: 1,
      recommendations: ['Cache validation failed - check logs'],
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
    const { clothing, cleanupOrphanedFiles } = useClothingStore.getState();
    
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
const performEmergencyCleanup = async (): Promise<boolean> => {
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
export const getCacheAnalytics = async (): Promise<{
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
      recommendations.push('File system needs attention');
    }
    if (storageUsagePercent > 80) {
      recommendations.push('High storage usage - consider cleanup');
    }
    if (health.issues.length > 0) {
      recommendations.push('File system has structural issues');
    }
    if (recommendations.length === 0) {
      recommendations.push('File system is performing well');
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
        recommendations: ['Analytics failed - check logs']
      }
    };
  }
};

/**
 * Force immediate cache cleanup
 */
export const forceCacheCleanup = async (): Promise<{
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