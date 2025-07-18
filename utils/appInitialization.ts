// utils/appInitialization.ts - YENİ YAPI: Geçici dosyaları otomatik temizler

import { useClothingStore } from '@/store/clothingStore';
// DEĞİŞTİ: clearTempDirectory fonksiyonunu import et
import { initializeFileSystem, getFileSystemHealth, clearTempDirectory } from '@/utils/fileSystemImageManager';

// Global singleton state
let isInitializing = false;
let isInitialized = false;
let initializationPromise: Promise<any> | null = null;

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
    // 1. File system'i initialize et
    await initializeFileSystem();

    // 2. YENİ: Uygulama başlarken geçici klasörü temizle
    await clearTempDirectory();

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

// File system health diagnostics (storage.tsx ekranı için kalabilir)
export const diagnoseFileSystemHealth = async (t?: (key: string, options?: any) => string): Promise<{
  totalItems: number;
  withValidPaths: number;
  withMissingPaths: number;
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
    
    for (const item of clothing) {
      if (item.originalImagePath && item.thumbnailImagePath) {
        withValidPaths++;
      } else {
        withMissingPaths++;
      }
    }
    
    const systemHealth = await getFileSystemHealth();
    
    return {
      totalItems: clothing.length,
      withValidPaths,
      withMissingPaths,
      systemHealth
    };
    
  } catch (error) {
    console.error('❌ File system diagnosis failed:', error);
    return {
      totalItems: 0,
      withValidPaths: 0,
      withMissingPaths: 0,
      systemHealth: {
        isHealthy: false,
        totalFiles: 0,
        totalSize: 0,
        issues: [translate('appInit.diagnosisFailed')]
      }
    };
  }
};

// Reset initialization state (for development/testing)
export const resetInitializationState = () => {
  isInitializing = false;
  isInitialized = false;
  initializationPromise = null;
  console.log('🔄 Initialization state reset');
};

// Check if app is initialized
export const isAppInitialized = () => isInitialized;