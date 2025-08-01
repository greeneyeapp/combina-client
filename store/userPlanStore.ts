// store/userPlanStore.ts - UserPlan interface güncellendi

import { create } from 'zustand';

export interface UserPlan {
  plan: 'free' | 'premium' | 'anonymous'; // anonymous plan eklendi
  usage: {
    daily_limit: number | "unlimited";
    current_usage: number;
    remaining: number | "unlimited";
    percentage_used: number;
    date: string;
    rewarded_count?: number;
  };
  fullname?: string; // Opsiyonel - anonymous kullanıcılar için
  gender?: string; // Opsiyonel - başlangıçta unisex olabilir
  age?: number;
  birthDate?: string;
  created_at?: any;
  email?: string; // DÜZELTME: Email eklendi
  isAnonymous?: boolean; // DÜZELTME: Anonymous kontrol alanı eklendi
  profile_complete?: boolean; // DÜZELTME: Profil tamamlanma alanı eklendi
}

interface UserPlanStore {
  userPlan: UserPlan | null;
  loading: boolean;
  lastFetched: string | null;
  
  setUserPlan: (plan: UserPlan) => void;
  setPlan: (planType: 'free' | 'premium' | 'anonymous') => void;
  setLoading: (loading: boolean) => void;
  clearUserPlan: () => void;
  
  // Plan limitlerini kontrol eden utility fonksiyonlar
  canAddItem: () => boolean;
  getRemainingItems: () => number;
  getUsagePercentage: () => number;
}

const PLAN_LIMITS = {
  free: { wardrobe: 50, suggestions: 2 },
  premium: { wardrobe: 1000, suggestions: "unlimited" },
  anonymous: { wardrobe: 0, suggestions: 1 } // DÜZELTME: Anonymous plan limitleri
};

export const useUserPlanStore = create<UserPlanStore>((set, get) => ({
  userPlan: null,
  loading: false,
  lastFetched: null,

  setUserPlan: (plan: UserPlan) => {
    set({ 
      userPlan: plan, 
      lastFetched: new Date().toISOString(),
      loading: false 
    });
  },

  setPlan: (planType: 'free' | 'premium' | 'anonymous') => {
    const currentPlan = get().userPlan;
    if (currentPlan) {
      set({
        userPlan: {
          ...currentPlan,
          plan: planType
        }
      });
    }
  },

  setLoading: (loading: boolean) => set({ loading }),

  clearUserPlan: () => set({ 
    userPlan: null, 
    loading: false, 
    lastFetched: null 
  }),

  canAddItem: () => {
    const { userPlan } = get();
    if (!userPlan) return false;
    
    // DÜZELTME: Anonymous kullanıcılar wardrobe ekleyemez
    if (userPlan.isAnonymous) return false;
    
    const limits = PLAN_LIMITS[userPlan.plan];
    if (!limits) return false;
    
    // Premium unlimited ise true döndür
    if (userPlan.plan === 'premium') return true;
    
    // Mevcut item sayısını kontrol et (bu sayı başka yerden alınmalı)
    // Şimdilik basit kontrol yapıyoruz
    return true; // Bu kısım wardrobe store ile entegre edilmeli
  },

  getRemainingItems: () => {
    const { userPlan } = get();
    if (!userPlan) return 0;
    
    // Anonymous kullanıcılar için 0
    if (userPlan.isAnonymous) return 0;
    
    const limits = PLAN_LIMITS[userPlan.plan];
    if (userPlan.plan === 'premium') return 999; // Premium unlimited
    
    // Bu kısım gerçek wardrobe item sayısı ile hesaplanmalı
    return limits.wardrobe; // Placeholder
  },

  getUsagePercentage: () => {
    const { userPlan } = get();
    if (!userPlan) return 0;
    
    return userPlan.usage.percentage_used || 0;
  },
}));