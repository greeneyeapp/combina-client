// kodlar/store/userPlanStore.ts - rewarded_count alanı eklenmiş doğru hali

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage';

export interface UserPlan {
  plan: 'free' | 'premium';
  usage: {
    daily_limit: number | "unlimited";
    rewarded_count?: number;
    current_usage: number;
    remaining: number | "unlimited";
    percentage_used: number;
    date: string;
  };
  fullname?: string;
  email?: string; // EKLENDİ
  gender?: string;
  age?: number;
  birthDate?: string; // EKLENDİ
  created_at?: string;
}

interface UserPlanState {
  userPlan: UserPlan | null;
  loading: boolean;
  lastFetched: string | null;

  // Actions
  setUserPlan: (plan: UserPlan) => void;
  updateUsage: (usage: UserPlan['usage']) => void;
  setPlan: (plan: 'free' | 'premium') => void;
  clearUserPlan: () => void;
  setLoading: (loading: boolean) => void;

  // Helper methods
  isLimitReached: () => boolean;
  canAddItem: () => boolean;
  getRemainingItems: () => number;
  getPlanLimits: () => { wardrobe: number; daily_suggestions: number };
}

const PLAN_LIMITS = {
  free: { wardrobe: 75, daily_suggestions: 2 },
  premium: { wardrobe: Infinity, daily_suggestions: Infinity },
};

export const useUserPlanStore = create<UserPlanState>()(
  persist(
    (set, get) => ({
      userPlan: null,
      loading: false,
      lastFetched: null,

      setUserPlan: (plan) => {

        set({
          userPlan: plan,
          lastFetched: new Date().toISOString()
        });
      },

      updateUsage: (usage) => set((state) => ({
        userPlan: state.userPlan ? { ...state.userPlan, usage } : null
      })),

      setPlan: (plan) => set((state) => ({
        userPlan: state.userPlan ? { ...state.userPlan, plan } : null
      })),

      clearUserPlan: () => set({
        userPlan: null,
        lastFetched: null
      }),

      setLoading: (loading) => set({ loading }),

      // Helper methods
      isLimitReached: () => {
        const state = get();
        if (!state.userPlan) return false;

        const limits = PLAN_LIMITS[state.userPlan.plan];
        return limits.wardrobe !== Infinity &&
          state.userPlan.usage.current_usage >= limits.wardrobe;
      },

      canAddItem: () => {
        const state = get();
        if (!state.userPlan) return true;

        const limits = PLAN_LIMITS[state.userPlan.plan];
        return limits.wardrobe === Infinity ||
          state.userPlan.usage.current_usage < limits.wardrobe;
      },

      getRemainingItems: () => {
        const state = get();
        if (!state.userPlan) return 0;

        const limits = PLAN_LIMITS[state.userPlan.plan];
        if (limits.wardrobe === Infinity) return Infinity;

        return Math.max(0, limits.wardrobe - state.userPlan.usage.current_usage);
      },

      getPlanLimits: () => {
        const state = get();
        const planType = state.userPlan?.plan || 'free';
        return PLAN_LIMITS[planType];
      },
    }),
    {
      name: 'user-plan-storage-v2',
      storage: createJSONStorage(() => simpleStorage),
      partialize: (state) => ({
        userPlan: state.userPlan,
        lastFetched: state.lastFetched,
      }),
    }
  )
);