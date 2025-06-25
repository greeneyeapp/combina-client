// Dosya: kodlar/hooks/useRevenueCat.ts (PLATFORM KONTROLÜ OLMAYAN NİHAİ VERSİYON)

import { useEffect, useState } from 'react';
import Purchases, { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import { updateUserPlan, getUserProfile } from '@/services/userService';

interface RevenueCatState {
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  currentPlan: 'free' | 'standard' | 'premium';
}

// Bu fonksiyon, undefined gelse bile çökmemesi için entitlement'ı işler.
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
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const plan = mapEntitlementsToPlan(customerInfo.entitlements.active);

        // Backend'deki plan ile senkronize et (isteğe bağlı ama önerilir)
        const profile = await getUserProfile();
        if (profile.plan !== plan) {
          await updateUserPlan(plan);
        }

        setState({ customerInfo, currentPlan: plan, isLoading: false });

        // Abonelik değişikliklerini dinle
        const listener = (info: CustomerInfo) => {
          const newPlan = mapEntitlementsToPlan(info.entitlements.active);
          setState(s => ({ ...s, customerInfo: info, currentPlan: newPlan }));
        };
        Purchases.addCustomerInfoUpdateListener(listener);

        return () => {
          Purchases.removeCustomerInfoUpdateListener(listener);
        };
      } catch (e) {
        console.error("RevenueCat hook initialization error:", e);
        // Hata durumunda, en azından backend'deki plana güvenerek devam et
        try {
            const profile = await getUserProfile();
            setState(s => ({ ...s, isLoading: false, currentPlan: profile.plan as 'free' | 'standard' | 'premium' }));
        } catch (profileError) {
            setState(s => ({...s, isLoading: false }));
        }
      }
    };

    initialize();
  }, []); // Sadece bir kere çalışır

  return state;
};