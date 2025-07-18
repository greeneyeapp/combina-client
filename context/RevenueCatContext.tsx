// context/RevenueCatContext.tsx - Duplicate initialization sorunu düzeltilmiş

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
  readyCheckCompleted: false
};

// RevenueCat hazır olana kadar bekleyen utility
const waitForRevenueCatReady = async (maxWaitMs: number = 3000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      // RevenueCat'in hazır olup olmadığını test et
      await Purchases.getCustomerInfo();
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('singleton instance')) {
        // Henüz hazır değil, biraz bekle
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      } else {
        // Başka bir hata, muhtemelen auth sorunu
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

  // ÖNCE USER KONTROLÜ - RevenueCat sadece kullanıcı varsa initialize olsun
  useEffect(() => {
    if (!user) {
      // User yoksa state'i temizle
      setCustomerInfo(null);
      setCurrentPlan('free');
      setIsLoading(false);
      
      // Global state'i de sıfırla
      globalRevenueCatState.isInitialized = false;
      globalRevenueCatState.isInitializing = false;
      globalRevenueCatState.initPromise = null;
      globalRevenueCatState.readyCheckCompleted = false;
      
      console.log('🧹 RevenueCat state cleared for logout');
      return;
    }

    // User var, RevenueCat'i initialize et
    initializeRevenueCatOnce();
  }, [user]);

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
      // Fallback: Backend plan'i kullan
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

  // SAFE CUSTOMER INFO FETCH
  const fetchCustomerInfoSafely = async () => {
    if (!user || !globalRevenueCatState.readyCheckCompleted) {
      return;
    }

    setIsLoading(true);
    console.log('💰 Fetching RevenueCat customer info...');
    
    try {
      const info = await Purchases.getCustomerInfo();
      const plan = mapEntitlementsToPlan(info.entitlements.active);
      
      setCustomerInfo(info);
      setCurrentPlan(plan);

      // Backend ile senkronizasyon
      try {
        const profile = await getUserProfile();
        if (profile.plan !== plan) {
          await updateUserPlan(plan);
          console.log(`✅ Plan synchronized: ${plan}`);
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

  // LISTENER - Sadece initialize olduktan sonra ekle
  useEffect(() => {
    if (!user || !globalRevenueCatState.isInitialized || !globalRevenueCatState.readyCheckCompleted) {
      return;
    }

    const listener = (info: CustomerInfo) => {
      const newPlan = mapEntitlementsToPlan(info.entitlements.active);
      setCustomerInfo(info);
      setCurrentPlan(newPlan);
      console.log('🔄 RevenueCat listener updated plan:', newPlan);
    };

    try {
      Purchases.addCustomerInfoUpdateListener(listener);
      console.log('✅ RevenueCat listener added');

      return () => {
        Purchases.removeCustomerInfoUpdateListener(listener);
        console.log('🧹 RevenueCat listener removed');
      };
    } catch (error) {
      console.warn('⚠️ Could not add RevenueCat listener:', error);
    }
  }, [user, globalRevenueCatState.isInitialized]);

  const refreshCustomerInfo = useCallback(async () => {
    if (globalRevenueCatState.isInitialized) {
      await fetchCustomerInfoSafely();
    } else {
      await initializeRevenueCatOnce();
    }
  }, [user]);

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