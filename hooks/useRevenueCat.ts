// hooks/useRevenueCat.ts - Optimize edilmiş versiyon

import { useEffect, useState, useCallback } from 'react';
import Purchases, { CustomerInfo, PurchasesEntitlementInfo } from 'react-native-purchases';
import { updateUserPlan, getUserProfile } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';

interface RevenueCatState {
  customerInfo: CustomerInfo | null;
  isLoading: boolean;
  currentPlan: 'free' | 'premium';
  refreshCustomerInfo: () => Promise<void>;
  lastFetched: number | null;
}

// Cache süresi - 5 dakika
const CACHE_DURATION = 5 * 60 * 1000;

// Global cache - tüm hook instances arasında paylaşılacak
let globalCache: {
  customerInfo: CustomerInfo | null;
  currentPlan: 'free' | 'premium';
  lastFetched: number;
  isLoading: boolean;
} = {
  customerInfo: null,
  currentPlan: 'free',
  lastFetched: 0,
  isLoading: false
};

// Active listeners - mükerrer listener'ları önlemek için
let activeListenerCount = 0;
let customerInfoListener: ((info: CustomerInfo) => void) | null = null;

const mapEntitlementsToPlan = (entitlements?: { [key: string]: PurchasesEntitlementInfo }): 'free' | 'premium' => {
  if (!entitlements) return 'free';
  if (entitlements.premium_access?.isActive) return 'premium';
  return 'free';
};

export const useRevenueCat = () => {
  const { user } = useAuth();
  const [state, setState] = useState<RevenueCatState>({
    customerInfo: globalCache.customerInfo,
    isLoading: globalCache.isLoading,
    currentPlan: globalCache.currentPlan,
    refreshCustomerInfo: async () => {},
    lastFetched: globalCache.lastFetched
  });

  // User logout olduysa cache'i temizle
  useEffect(() => {
    if (!user) {
      console.log('🧹 User logged out, clearing RevenueCat cache');
      globalCache = {
        customerInfo: null,
        currentPlan: 'free',
        lastFetched: 0,
        isLoading: false
      };
      setState(prev => ({
        ...prev,
        customerInfo: null,
        currentPlan: 'free',
        isLoading: false,
        lastFetched: null
      }));
      return;
    }
  }, [user]);

  const updateGlobalCache = useCallback((newData: Partial<typeof globalCache>) => {
    globalCache = { ...globalCache, ...newData };
    
    // Tüm active hook instances'ı güncelle
    setState(prev => ({
      ...prev,
      customerInfo: globalCache.customerInfo,
      currentPlan: globalCache.currentPlan,
      isLoading: globalCache.isLoading,
      lastFetched: globalCache.lastFetched
    }));
  }, []);

  const fetchAndProcessCustomerInfo = useCallback(async (forceRefresh = false) => {
    if (!user) {
      console.log('⚠️ No user, skipping RevenueCat fetch');
      return;
    }

    const now = Date.now();
    
    // Cache kontrolü - force refresh yoksa ve cache fresh ise skip et
    if (!forceRefresh && 
        globalCache.customerInfo && 
        (now - globalCache.lastFetched) < CACHE_DURATION) {
      console.log('📋 Using cached RevenueCat data');
      setState(prev => ({
        ...prev,
        customerInfo: globalCache.customerInfo,
        currentPlan: globalCache.currentPlan,
        isLoading: false,
        lastFetched: globalCache.lastFetched
      }));
      return;
    }

    // Aynı anda birden fazla fetch önleme
    if (globalCache.isLoading) {
      console.log('⏳ RevenueCat fetch already in progress, waiting...');
      return;
    }

    try {
      updateGlobalCache({ isLoading: true });
      console.log('💰 Fetching RevenueCat customer info for user:', user.uid);
      
      const customerInfo = await Purchases.getCustomerInfo();
      const plan = mapEntitlementsToPlan(customerInfo.entitlements.active);

      // Backend plan ile senkronizasyon (sadece farklıysa)
      try {
        const profile = await getUserProfile();
        if (profile.plan !== plan) {
          console.log(`🔄 Syncing plan: ${profile.plan} -> ${plan}`);
          await updateUserPlan(plan);
        }
      } catch (profileError) {
        console.warn('⚠️ Could not sync plan with backend:', profileError);
      }
      
      updateGlobalCache({
        customerInfo,
        currentPlan: plan,
        lastFetched: now,
        isLoading: false
      });
      
      console.log('✅ RevenueCat data updated and cached:', { 
        plan, 
        cacheValidUntil: new Date(now + CACHE_DURATION).toLocaleTimeString() 
      });
    } catch (e) {
      console.error("RevenueCat: Error fetching customer info:", e);
      
      // Fallback - backend'den plan bilgisini al
      try {
        const profile = await getUserProfile();
        updateGlobalCache({
          currentPlan: profile.plan as 'free' | 'premium',
          isLoading: false
        });
      } catch (profileError) {
        updateGlobalCache({ isLoading: false });
      }
    }
  }, [user, updateGlobalCache]);

  useEffect(() => {
    if (!user) return;

    activeListenerCount++;
    console.log('🚀 Initializing RevenueCat for user:', user.uid, `(Active hooks: ${activeListenerCount})`);
    
    // İlk yükleme
    fetchAndProcessCustomerInfo();

    // Customer info listener - sadece bir tane olmalı
    if (!customerInfoListener) {
      customerInfoListener = (info: CustomerInfo) => {
        if (user) {
          const newPlan = mapEntitlementsToPlan(info.entitlements.active);
          updateGlobalCache({
            customerInfo: info,
            currentPlan: newPlan,
            lastFetched: Date.now()
          });
          console.log('🔄 RevenueCat listener updated plan:', newPlan);
        }
      };
      
      Purchases.addCustomerInfoUpdateListener(customerInfoListener);
      console.log('👂 RevenueCat listener added');
    }

    return () => {
      activeListenerCount--;
      console.log('🧹 Cleaning up RevenueCat hook', `(Remaining hooks: ${activeListenerCount})`);
      
      // Son hook temizlendiğinde listener'ı da temizle
      if (activeListenerCount === 0 && customerInfoListener) {
        Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
        customerInfoListener = null;
        console.log('👂 RevenueCat listener removed');
      }
    };
  }, [fetchAndProcessCustomerInfo, user, updateGlobalCache]);

  const refreshCustomerInfo = useCallback(async () => {
    if (!user) {
      console.log('⚠️ No user, skipping RevenueCat refresh');
      return;
    }
    
    console.log("🔄 Manual RevenueCat refresh requested");
    await fetchAndProcessCustomerInfo(true); // Force refresh
  }, [fetchAndProcessCustomerInfo, user]);

  return {
    customerInfo: state.customerInfo,
    isLoading: state.isLoading,
    currentPlan: state.currentPlan,
    refreshCustomerInfo
  };
};

// Cache durumunu kontrol etmek için utility fonksiyon
export const getRevenueCatCacheStatus = () => ({
  hasCache: !!globalCache.customerInfo,
  lastFetched: globalCache.lastFetched,
  age: globalCache.lastFetched ? Date.now() - globalCache.lastFetched : 0,
  isExpired: globalCache.lastFetched ? (Date.now() - globalCache.lastFetched) > CACHE_DURATION : true,
  currentPlan: globalCache.currentPlan,
  activeHooks: activeListenerCount
});

// Cache'i temizlemek için utility fonksiyon
export const clearRevenueCatCache = () => {
  console.log('🗑️ Clearing RevenueCat cache manually');
  globalCache = {
    customerInfo: null,
    currentPlan: 'free',
    lastFetched: 0,
    isLoading: false
  };
};