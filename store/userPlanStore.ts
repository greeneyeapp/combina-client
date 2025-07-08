// store/userPlanStore.ts - Sadeleştirilmiş plan limitleri

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserPlan {
  plan: 'free' | 'premium'; // Standard kaldırıldı
  usage: {
    daily_limit: number;
    current_usage: number;
    remaining: number;
    percentage_used: number;
    date: string;
  };
  fullname?: string;
  gender?: string;
  age?: number;
  created_at?: string;
}

interface UserPlanState {
  userPlan: UserPlan | null;
  loading: boolean;
  lastFetched: string | null;

  // Actions
  setUserPlan: (plan: UserPlan) => void;
  updateUsage: (usage: UserPlan['usage']) => void;
  setPlan: (plan: 'free' | 'premium') => void; // Standard kaldırıldı
  clearUserPlan: () => void;
  setLoading: (loading: boolean) => void;

  // Helper methods
  isLimitReached: () => boolean;
  canAddItem: () => boolean;
  getRemainingItems: () => number;
  getPlanLimits: () => { wardrobe: number; daily_suggestions: number };
}

// Sadeleştirilmiş plan limitleri - sadece Free ve Premium
const PLAN_LIMITS = {
  free: { wardrobe: 30, daily_suggestions: 2 },
  premium: { wardrobe: Infinity, daily_suggestions: Infinity }, // Unlimited!
};

export const useUserPlanStore = create<UserPlanState>()(
  persist(
    (set, get) => ({
      userPlan: null,
      loading: false,
      lastFetched: null,

      setUserPlan: (plan) => set({
        userPlan: plan,
        lastFetched: new Date().toISOString()
      }),

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
        if (!state.userPlan) return true; // Assume can add if no plan data

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
      name: 'user-plan-storage-v2', // Version bump for simplified plans
      storage: createJSONStorage(() => AsyncStorage),

      // Only persist essential data, not loading states
      partialize: (state) => ({
        userPlan: state.userPlan,
        lastFetched: state.lastFetched,
      }),
    }
  )
);