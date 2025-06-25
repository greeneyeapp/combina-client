// Dosya: kodlar/store/onboardingStore.ts (YENİ DOSYA)

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

interface OnboardingState {
  showOnboarding: boolean;
  step: number;
  startOnboarding: () => void;
  nextStep: () => void;
  finishOnboarding: () => Promise<void>;
  hideOnboarding: () => void;
  checkIfOnboardingCompleted: () => Promise<boolean>;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  showOnboarding: false,
  step: 0,
  
  startOnboarding: () => set({ showOnboarding: true, step: 0 }),

  nextStep: () => set(state => ({ step: state.step + 1 })),
  
  finishOnboarding: async () => {
    try {
      // Bu bilgiyi cihaza kaydediyoruz ki tekrar göstermeyelim.
      // Normalde bu API'ye de gönderilir (örn: updateUserProfile({ has_completed_onboarding: true }))
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      set({ showOnboarding: false, step: 0 });
    } catch (error) {
      console.error("Failed to save onboarding completion state:", error);
      // Hata olsa bile onboarding'i gizle
      get().hideOnboarding();
    }
  },

  hideOnboarding: () => set({ showOnboarding: false, step: 0 }),
  
  checkIfOnboardingCompleted: async () => {
    try {
      const isCompleted = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      return isCompleted === 'true';
    } catch (error) {
      console.error("Failed to check onboarding state:", error);
      return true; // Hata durumunda, tekrar göstermemek en güvenlisi.
    }
  }
}));