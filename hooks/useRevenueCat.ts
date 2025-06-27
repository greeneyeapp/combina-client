import { useEffect, useState, useCallback } from 'react';
import Purchases, { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import { updateUserPlan, getUserProfile } from '@/services/userService';

interface RevenueCatState {
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  currentPlan: 'free' | 'standard' | 'premium';
  refreshCustomerInfo: () => Promise<void>; // Fonksiyonu arayüze ekliyoruz
}

const mapEntitlementsToPlan = (entitlements?: { [key: string]: PurchasesEntitlementInfo }): 'free' | 'standard' | 'premium' => {
  if (!entitlements) return 'free';
  if (entitlements.premium_access?.isActive) return 'premium';
  if (entitlements.standard_access?.isActive) return 'standard';
  return 'free';
};

export const useRevenueCat = () => {
  const [state, setState] = useState<RevenueCatState>({
    customerInfo: null,
    isLoading: true,
    currentPlan: 'free',
    // Başlangıçta boş bir fonksiyon atıyoruz
    refreshCustomerInfo: async () => { console.log("refreshCustomerInfo not yet initialized"); },
  });

  // useCallback ile fonksiyonu memoize ediyoruz
  const fetchAndProcessCustomerInfo = useCallback(async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const plan = mapEntitlementsToPlan(customerInfo.entitlements.active);

      const profile = await getUserProfile();
      if (profile.plan !== plan) {
        await updateUserPlan(plan);
      }
      
      setState(s => ({ ...s, customerInfo, currentPlan: plan, isLoading: false }));
    } catch (e) {
      console.error("RevenueCat: Error fetching customer info:", e);
      try {
          const profile = await getUserProfile();
          setState(s => ({ ...s, isLoading: false, currentPlan: profile.plan as 'free' | 'standard' | 'premium' }));
      } catch (profileError) {
          setState(s => ({...s, isLoading: false }));
      }
    }
  }, []);

  useEffect(() => {
    fetchAndProcessCustomerInfo();

    const listener = (info: CustomerInfo) => {
      const newPlan = mapEntitlementsToPlan(info.entitlements.active);
      setState(s => ({ ...s, customerInfo: info, currentPlan: newPlan }));
    };
    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [fetchAndProcessCustomerInfo]);

  // --- EKSİK OLAN FONKSİYON BURADA TANIMLANIYOR ---
  const refreshCustomerInfo = useCallback(async () => {
      console.log("Refreshing customer info...");
      setState(s => ({ ...s, isLoading: true }));
      await fetchAndProcessCustomerInfo();
  }, [fetchAndProcessCustomerInfo]);

  // Bu useEffect, refreshCustomerInfo fonksiyonu oluşturulduğunda state'i günceller.
  // Bu, fonksiyonun her zaman en güncel halinin kullanılmasını sağlar.
  useEffect(() => {
    setState(s => ({...s, refreshCustomerInfo}));
  }, [refreshCustomerInfo]);


  // Fonksiyonu dışarıya aktarıyoruz
  return state;
};
