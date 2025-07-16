// context/RevenueCatContext.tsx - Timing sorunu düzeltilmiş versiyon

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
  const [revenueCatReady, setRevenueCatReady] = useState(false);

  const mapEntitlementsToPlan = (entitlements?: { [key: string]: PurchasesEntitlementInfo }): 'free' | 'premium' => {
    if (!entitlements || !entitlements.premium_access?.isActive) {
      return 'free';
    }
    return 'premium';
  };

  const fetchAndProcessCustomerInfo = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    if (!revenueCatReady) {
      console.log('⏳ RevenueCat not ready yet, waiting...');
      const isReady = await waitForRevenueCatReady();
      if (!isReady) {
        console.warn('⚠️ RevenueCat still not ready, skipping customer info fetch');
        setIsLoading(false);
        return;
      }
      setRevenueCatReady(true);
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
      // Hata durumunda backend'deki plana güven
      try {
        const profile = await getUserProfile();
        setCurrentPlan(profile.plan);
        console.log('✅ Using backend plan as fallback:', profile.plan);
      } catch (profileError) {
        console.error("RevenueCat: Could not fallback to backend plan:", profileError);
        // Son çare olarak free plan
        setCurrentPlan('free');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, revenueCatReady]);

  // RevenueCat hazırlık kontrolü
  useEffect(() => {
    if (!user) return;

    const checkRevenueCatReady = async () => {
      console.log('🔍 Checking RevenueCat readiness...');
      const isReady = await waitForRevenueCatReady(5000); // 5 saniye bekle
      setRevenueCatReady(isReady);
      
      if (isReady) {
        console.log('✅ RevenueCat is ready');
        // Biraz delay ekle, böylece auth initialization tamamlanır
        setTimeout(() => {
          fetchAndProcessCustomerInfo();
        }, 1000);
      } else {
        console.warn('⚠️ RevenueCat not ready, will retry later');
        // Fallback olarak backend plan'i kullan
        try {
          const profile = await getUserProfile();
          setCurrentPlan(profile.plan);
        } catch (error) {
          setCurrentPlan('free');
        }
        setIsLoading(false);
      }
    };

    checkRevenueCatReady();
  }, [user, fetchAndProcessCustomerInfo]);

  // RevenueCat listener'ı sadece hazır olduğunda ekle
  useEffect(() => {
    if (!user || !revenueCatReady) return;

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
  }, [user, revenueCatReady]);

  // User logout durumu
  useEffect(() => {
    if (!user) {
      // Kullanıcı çıkış yaptığında state'i sıfırla
      setCustomerInfo(null);
      setCurrentPlan('free');
      setIsLoading(false);
      setRevenueCatReady(false);
      console.log('🧹 RevenueCat state cleared for logout');
    }
  }, [user]);

  const value = {
    customerInfo,
    isLoading,
    currentPlan,
    refreshCustomerInfo: () => fetchAndProcessCustomerInfo(true),
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