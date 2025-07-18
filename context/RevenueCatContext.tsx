// context/RevenueCatContext.tsx - Duplicate initialization ve gereksiz fetch'ler düzeltilmiş

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import Purchases, { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile, updateUserPlan } from '@/services/userService';

// Context için veri tipini tanımla
interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  currentPlan: 'free' | 'premium';
  refreshCustomerInfo: () => Promise<void>;
}

// Context'i oluştur
const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

// GLOBAL STATE - Multiple initialization'ı önlemek için
let globalRevenueCatState = {
  isInitialized: false,
  isInitializing: false,
  initPromise: null as Promise<void> | null,
  readyCheckCompleted: false,
  lastUserId: null as string | null, // DÜZELTME: User değişim takibi
  lastFetchTime: 0, // DÜZELTME: Fetch throttling
};

// RevenueCat hazır olana kadar bekleyen utility
const waitForRevenueCatReady = async (maxWaitMs: number = 3000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      await Purchases.getCustomerInfo();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('singleton instance')) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      } else {
        console.log('RevenueCat ready but user not authenticated yet');
        return true;
      }
    }
  }
  
  console.warn('⚠️ RevenueCat not ready after waiting');
  return false;
};

// Provider Component'i
export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'premium'>('free');
  const [isLoading, setIsLoading] = useState(false);

  const mapEntitlementsToPlan = (entitlements?: { [key: string]: PurchasesEntitlementInfo }): 'free' | 'premium' => {
    if (!entitlements || !entitlements.premium_access?.isActive) {
      return 'free';
    }
    return 'premium';
  };

  // DÜZELTME: User kontrolü ve gereksiz re-initialization önleme
  useEffect(() => {
    const currentUserId = user?.uid || null;
    
    if (!user || !currentUserId) {
      // User yoksa state'i temizle ve global state'i reset et
      setCustomerInfo(null);
      setCurrentPlan('free');
      setIsLoading(false);
      
      // DÜZELTME: Sadece user değiştiyse reset et
      if (globalRevenueCatState.lastUserId !== null) {
        console.log('🧹 RevenueCat state cleared for user logout/change');
        globalRevenueCatState.isInitialized = false;
        globalRevenueCatState.isInitializing = false;
        globalRevenueCatState.initPromise = null;
        globalRevenueCatState.readyCheckCompleted = false;
        globalRevenueCatState.lastUserId = null;
        globalRevenueCatState.lastFetchTime = 0;
      }
      return;
    }

    // DÜZELTME: Aynı user için tekrar initialize etme
    if (globalRevenueCatState.lastUserId === currentUserId && globalRevenueCatState.isInitialized) {
      console.log('📋 RevenueCat already initialized for this user, fetching data...');
      fetchCustomerInfoSafely();
      return;
    }

    // DÜZELTME: User değişti, yeni initialization gerekli
    if (globalRevenueCatState.lastUserId !== currentUserId) {
      console.log('👤 User changed, reinitializing RevenueCat...');
      globalRevenueCatState.isInitialized = false;
      globalRevenueCatState.isInitializing = false;
      globalRevenueCatState.initPromise = null;
      globalRevenueCatState.readyCheckCompleted = false;
      globalRevenueCatState.lastFetchTime = 0;
    }

    globalRevenueCatState.lastUserId = currentUserId;
    initializeRevenueCatOnce();
  }, [user?.uid]); // DÜZELTME: Sadece user ID değişikliğinde tetikle

  // SINGLETON INITIALIZATION
  const initializeRevenueCatOnce = async () => {
    // Eğer zaten initialize edilmişse, skip
    if (globalRevenueCatState.isInitialized) {
      console.log('📋 RevenueCat already initialized, fetching existing data...');
      await fetchCustomerInfoSafely();
      return;
    }

    // Eğer initialization devam ediyorsa, bekle
    if (globalRevenueCatState.isInitializing && globalRevenueCatState.initPromise) {
      console.log('⏳ RevenueCat initialization in progress, waiting...');
      await globalRevenueCatState.initPromise;
      await fetchCustomerInfoSafely();
      return;
    }

    // Yeni initialization başlat
    globalRevenueCatState.isInitializing = true;
    globalRevenueCatState.initPromise = performRevenueCatInitialization();

    try {
      await globalRevenueCatState.initPromise;
      globalRevenueCatState.isInitialized = true;
      await fetchCustomerInfoSafely();
    } catch (error) {
      console.error('❌ RevenueCat initialization failed:', error);
      await fallbackToBackendPlan();
    } finally {
      globalRevenueCatState.isInitializing = false;
      globalRevenueCatState.initPromise = null;
    }
  };

  // GERÇEK INITIALIZATION İŞLEMİ
  const performRevenueCatInitialization = async (): Promise<void> => {
    console.log('🔍 Checking RevenueCat readiness...');
    
    const isReady = await waitForRevenueCatReady(5000);
    if (!isReady) {
      throw new Error('RevenueCat not ready after timeout');
    }
    
    console.log('✅ RevenueCat is ready');
    globalRevenueCatState.readyCheckCompleted = true;
  };

  // SAFE CUSTOMER INFO FETCH - DÜZELTME: Throttling eklendi
  const fetchCustomerInfoSafely = async () => {
    if (!user || !globalRevenueCatState.readyCheckCompleted) {
      return;
    }

    // DÜZELTME: Throttling - 30 saniyede bir fetch
    const now = Date.now();
    if (now - globalRevenueCatState.lastFetchTime < 30000) {
      console.log('📋 RevenueCat fetch throttled (< 30s since last fetch)');
      return;
    }

    setIsLoading(true);
    console.log('💰 Fetching RevenueCat customer info...');
    
    try {
      const info = await Purchases.getCustomerInfo();
      const plan = mapEntitlementsToPlan(info.entitlements.active);
      
      setCustomerInfo(info);
      setCurrentPlan(plan);
      globalRevenueCatState.lastFetchTime = now; // DÜZELTME: Fetch time'ı kaydet

      // Backend ile senkronizasyon - DÜZELTME: Sadece plan farklıysa sync et
      try {
        const profile = await getUserProfile();
        if (profile.plan !== plan) {
          await updateUserPlan(plan);
          console.log(`✅ Plan synchronized: ${plan}`);
        } else {
          console.log('📋 Plan already in sync with backend');
        }
      } catch (profileError) {
        console.warn('⚠️ Could not sync with backend:', profileError);
      }
      
      console.log('✅ RevenueCat data fetched successfully. Plan:', plan);
      
    } catch (e) {
      console.error("RevenueCat: Error fetching customer info:", e);
      await fallbackToBackendPlan();
    } finally {
      setIsLoading(false);
    }
  };

  // BACKEND FALLBACK
  const fallbackToBackendPlan = async () => {
    try {
      const profile = await getUserProfile();
      setCurrentPlan(profile.plan);
      console.log('✅ Using backend plan as fallback:', profile.plan);
    } catch (profileError) {
      console.error("RevenueCat: Could not fallback to backend plan:", profileError);
      setCurrentPlan('free');
    }
    setIsLoading(false);
  };

  // LISTENER - DÜZELTME: Sadece initialize olduktan sonra ekle ve duplicate listener önle
  useEffect(() => {
    if (!user || !globalRevenueCatState.isInitialized || !globalRevenueCatState.readyCheckCompleted) {
      return;
    }

    const listener = (info: CustomerInfo) => {
      const newPlan = mapEntitlementsToPlan(info.entitlements.active);
      setCustomerInfo(info);
      setCurrentPlan(newPlan);
      globalRevenueCatState.lastFetchTime = Date.now(); // DÜZELTME: Listener'dan gelen veri için de time güncelle
      console.log('🔄 RevenueCat listener updated plan:', newPlan);
    };

    try {
      Purchases.addCustomerInfoUpdateListener(listener);
      console.log('✅ RevenueCat listener added');

      return () => {
        try {
          Purchases.removeCustomerInfoUpdateListener(listener);
          console.log('🧹 RevenueCat listener removed');
        } catch (error) {
          console.warn('⚠️ Error removing RevenueCat listener:', error);
        }
      };
    } catch (error) {
      console.warn('⚠️ Could not add RevenueCat listener:', error);
    }
  }, [user?.uid, globalRevenueCatState.isInitialized]); // DÜZELTME: user.uid dependency

  // DÜZELTME: Refresh function optimize edildi
  const refreshCustomerInfo = useCallback(async () => {
    if (!user) {
      console.log('📋 No user available for refresh');
      return;
    }

    // DÜZELTME: Force refresh için throttling'i bypass et
    if (globalRevenueCatState.isInitialized) {
      console.log('🔄 Force refreshing customer info...');
      globalRevenueCatState.lastFetchTime = 0; // Reset throttling
      await fetchCustomerInfoSafely();
    } else {
      console.log('🔄 Initializing RevenueCat for refresh...');
      await initializeRevenueCatOnce();
    }
  }, [user?.uid]);

  const value = {
    customerInfo,
    isLoading,
    currentPlan,
    refreshCustomerInfo,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

// Hook'u dışarıya aç
export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};

// DÜZELTME: Development utilities
if (__DEV__) {
  (global as any).debugRevenueCat = () => {
    console.log('🔧 RevenueCat Debug State:', {
      isInitialized: globalRevenueCatState.isInitialized,
      isInitializing: globalRevenueCatState.isInitializing,
      readyCheckCompleted: globalRevenueCatState.readyCheckCompleted,
      lastUserId: globalRevenueCatState.lastUserId,
      lastFetchTime: new Date(globalRevenueCatState.lastFetchTime).toISOString(),
      timeSinceLastFetch: Date.now() - globalRevenueCatState.lastFetchTime
    });
  };

  (global as any).resetRevenueCat = () => {
    globalRevenueCatState.isInitialized = false;
    globalRevenueCatState.isInitializing = false;
    globalRevenueCatState.initPromise = null;
    globalRevenueCatState.readyCheckCompleted = false;
    globalRevenueCatState.lastUserId = null;
    globalRevenueCatState.lastFetchTime = 0;
    console.log('🔄 RevenueCat state reset');
  };
}