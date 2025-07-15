// kodlar/context/RevenueCatContext.tsx (YENİ DOSYA)

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

// Provider Component'i
export function RevenueCatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentPlan, setCurrentPlan] = useState<'free' | 'premium'>('free');
  const [isLoading, setIsLoading] = useState(true);

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

    setIsLoading(true);
    console.log('💰 Fetching single instance of RevenueCat customer info...');
    
    try {
      const info = await Purchases.getCustomerInfo();
      const plan = mapEntitlementsToPlan(info.entitlements.active);
      
      setCustomerInfo(info);
      setCurrentPlan(plan);

      // Backend ile senkronizasyon
      const profile = await getUserProfile();
      if (profile.plan !== plan) {
        await updateUserPlan(plan);
      }
      console.log('✅ RevenueCat data fetched and synced successfully. Plan:', plan);
    } catch (e) {
      console.error("RevenueCat: Error fetching customer info:", e);
      // Hata durumunda backend'deki plana güven
      try {
        const profile = await getUserProfile();
        setCurrentPlan(profile.plan);
      } catch (profileError) {
        console.error("RevenueCat: Could not fallback to backend plan:", profileError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAndProcessCustomerInfo();
      
      const listener = (info: CustomerInfo) => {
        const newPlan = mapEntitlementsToPlan(info.entitlements.active);
        setCustomerInfo(info);
        setCurrentPlan(newPlan);
        console.log('🔄 RevenueCat listener updated plan:', newPlan);
      };
      Purchases.addCustomerInfoUpdateListener(listener);

      return () => {
        Purchases.removeCustomerInfoUpdateListener(listener);
      };
    } else {
      // Kullanıcı çıkış yaptığında state'i sıfırla
      setCustomerInfo(null);
      setCurrentPlan('free');
      setIsLoading(false);
    }
  }, [user, fetchAndProcessCustomerInfo]);

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