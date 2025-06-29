// hooks/useRevenueCat.ts (Düzeltilmiş - Auth state sync)
import { useEffect, useState, useCallback } from 'react';
import Purchases, { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import { updateUserPlan, getUserProfile } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';

interface RevenueCatState {
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  currentPlan: 'free' | 'standard' | 'premium';
  refreshCustomerInfo: () => Promise<void>;
}

const mapEntitlementsToPlan = (entitlements?: { [key: string]: PurchasesEntitlementInfo }): 'free' | 'standard' | 'premium' => {
  if (!entitlements) return 'free';
  if (entitlements.premium_access?.isActive) return 'premium';
  if (entitlements.standard_access?.isActive) return 'standard';
  return 'free';
};

export const useRevenueCat = () => {
  const { user } = useAuth(); // Auth state'ini izle
  const [state, setState] = useState<RevenueCatState>({
    customerInfo: null,
    isLoading: true,
    currentPlan: 'free',
    refreshCustomerInfo: async () => { console.log("refreshCustomerInfo not yet initialized"); },
  });

  // User logout olduysa state'i temizle
  useEffect(() => {
    if (!user) {
      console.log('🧹 User logged out, clearing RevenueCat state');
      setState({
        customerInfo: null,
        isLoading: false, // ÖNEMLİ: Loading'i false yap
        currentPlan: 'free',
        refreshCustomerInfo: async () => { console.log("User logged out, RefreshCustomerInfo disabled"); },
      });
      return;
    }
  }, [user]);

  // useCallback ile fonksiyonu memoize ediyoruz
  const fetchAndProcessCustomerInfo = useCallback(async () => {
    // User yoksa işlem yapma
    if (!user) {
      console.log('⚠️ No user, skipping RevenueCat fetch');
      return;
    }

    try {
      console.log('💰 Fetching RevenueCat customer info for user:', user.uid);
      const customerInfo = await Purchases.getCustomerInfo();
      const plan = mapEntitlementsToPlan(customerInfo.entitlements.active);

      const profile = await getUserProfile();
      if (profile.plan !== plan) {
        await updateUserPlan(plan);
      }
      
      setState(s => ({ ...s, customerInfo, currentPlan: plan, isLoading: false }));
      console.log('✅ RevenueCat state updated:', { plan, user: !!user });
    } catch (e) {
      console.error("RevenueCat: Error fetching customer info:", e);
      try {
          const profile = await getUserProfile();
          setState(s => ({ ...s, isLoading: false, currentPlan: profile.plan as 'free' | 'standard' | 'premium' }));
      } catch (profileError) {
          setState(s => ({...s, isLoading: false }));
      }
    }
  }, [user]); // user'ı dependency'ye ekle

  useEffect(() => {
    // User yoksa hiçbir şey yapma
    if (!user) {
      return;
    }

    console.log('🚀 Initializing RevenueCat for user:', user.uid);
    fetchAndProcessCustomerInfo();

    const listener = (info: CustomerInfo) => {
      // User hala varsa listener'ı çalıştır
      if (user) {
        const newPlan = mapEntitlementsToPlan(info.entitlements.active);
        setState(s => ({ ...s, customerInfo: info, currentPlan: newPlan }));
        console.log('🔄 RevenueCat listener updated plan:', newPlan);
      }
    };
    
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      console.log('🧹 Cleaning up RevenueCat listener');
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [fetchAndProcessCustomerInfo, user]); // user'ı dependency'ye ekle

  // refreshCustomerInfo fonksiyonu
  const refreshCustomerInfo = useCallback(async () => {
    // User yoksa refresh yapma
    if (!user) {
      console.log('⚠️ No user, skipping RevenueCat refresh');
      return;
    }
    
    console.log("Refreshing customer info...");
    setState(s => ({ ...s, isLoading: true }));
    await fetchAndProcessCustomerInfo();
  }, [fetchAndProcessCustomerInfo, user]); // user'ı dependency'ye ekle

  // Bu useEffect, refreshCustomerInfo fonksiyonu oluşturulduğunda state'i günceller.
  useEffect(() => {
    setState(s => ({...s, refreshCustomerInfo}));
  }, [refreshCustomerInfo]);

  return state;
};