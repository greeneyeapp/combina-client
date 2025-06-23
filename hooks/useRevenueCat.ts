// hooks/useRevenueCat.ts
import { useEffect, useState } from 'react';
import Purchases, { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import { updateUserPlan, getUserProfile } from '@/services/userService';
import { useUserPlanStore } from '@/store/userPlanStore';
import { Platform } from 'react-native';

interface RevenueCatState {
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  error: string | null;
  activeEntitlements: { [key: string]: PurchasesEntitlementInfo };
  isProUser: boolean;
  currentPlan: 'free' | 'standard' | 'premium';
}

export const useRevenueCat = () => {
  const [state, setState] = useState<RevenueCatState>({
    customerInfo: null,
    isLoading: true,
    error: null,
    activeEntitlements: {},
    isProUser: false,
    currentPlan: 'free',
  });

  const { userPlan } = useUserPlanStore();

  // RevenueCat entitlement'larını plan tipine dönüştür
  const mapEntitlementsToPlan = (entitlements: { [key: string]: PurchasesEntitlementInfo }): 'free' | 'standard' | 'premium' => {
    if (entitlements.premium_access?.isActive) return 'premium';
    if (entitlements.standard_access?.isActive) return 'standard';
    return 'free';
  };

  // Customer info fetch
  const fetchCustomerInfo = async () => {
    if (Platform.OS !== 'ios') {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const customerInfo = await Purchases.getCustomerInfo();
      const activeEntitlements = customerInfo.entitlements.active;
      const isProUser = Object.keys(activeEntitlements).length > 0;
      const currentPlan = mapEntitlementsToPlan(activeEntitlements);

      setState(prev => ({
        ...prev,
        customerInfo,
        activeEntitlements,
        isProUser,
        currentPlan,
        isLoading: false,
        error: null,
      }));

      // Backend ile senkronize et
      await syncWithBackend(currentPlan);

    } catch (error) {
      console.error('RevenueCat fetch error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  // Backend ile plan senkronizasyonu
  const syncWithBackend = async (revenueCatPlan: 'free' | 'standard' | 'premium') => {
    try {
      // Backend'deki plan ile RevenueCat'teki plan farklıysa güncelle
      if (userPlan && userPlan.plan !== revenueCatPlan) {
        console.log(`Plan mismatch detected: Backend=${userPlan.plan}, RevenueCat=${revenueCatPlan}`);
        await updateUserPlan(revenueCatPlan);
        
        // Profile'ı yeniden fetch et
        await getUserProfile(true);
      }
    } catch (error) {
      console.error('Backend sync error:', error);
    }
  };

  // RevenueCat listener'ı kur
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    // İlk fetch
    fetchCustomerInfo();

    // Customer info değişikliklerini dinle
    const customerInfoUpdateListener = (customerInfo: CustomerInfo) => {
      const activeEntitlements = customerInfo.entitlements.active;
      const isProUser = Object.keys(activeEntitlements).length > 0;
      const currentPlan = mapEntitlementsToPlan(activeEntitlements);

      setState(prev => ({
        ...prev,
        customerInfo,
        activeEntitlements,
        isProUser,
        currentPlan,
      }));

      // Backend ile senkronize et
      syncWithBackend(currentPlan);
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
    };
  }, []);

  // Plan değişikliklerini izle ve senkronize et
  useEffect(() => {
    if (userPlan && state.currentPlan !== userPlan.plan && !state.isLoading) {
      syncWithBackend(state.currentPlan);
    }
  }, [userPlan?.plan, state.currentPlan, state.isLoading]);

  const refreshCustomerInfo = () => {
    fetchCustomerInfo();
  };

  return {
    ...state,
    refreshCustomerInfo,
  };
};