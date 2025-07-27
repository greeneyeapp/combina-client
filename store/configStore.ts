// kodlar/store/configStore.ts - YENİ DOSYA

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { simpleStorage } from '@/store/simpleStorage';
import axios from 'axios';
import API_URL from '@/config';
import { useApiAuthStore } from './apiAuthStore';

// Backend'den gelen kuralların tip tanımı
export type OccasionRules = Record<string, { required_one_of?: Record<string, string[]> }>;

interface ConfigState {
  occasionRules: {
    female: OccasionRules;
    male: OccasionRules;
  } | null;
  isLoading: boolean;
  lastFetched: number | null;
  fetchOccasionRules: (force?: boolean) => Promise<void>;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // Kuralları 24 saatte bir güncelle

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      occasionRules: null,
      isLoading: false,
      lastFetched: null,
      fetchOccasionRules: async (force = false) => {
        const { isLoading, lastFetched } = get();
        const now = Date.now();

        // Eğer zaten yükleniyorsa veya cache taze ise (ve zorla güncelleme istenmiyorsa) tekrar çekme
        if (isLoading || (!force && lastFetched && (now - lastFetched < CACHE_DURATION))) {
          return;
        }

        set({ isLoading: true });
        try {
          const token = useApiAuthStore.getState().jwt;
          if (!token) {
            console.log('No token, skipping occasion rules fetch.');
            set({ isLoading: false });
            return;
          }

          const response = await axios.get(`${API_URL}/api/occasion-rules`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({ occasionRules: response.data, isLoading: false, lastFetched: now });
          console.log('✅ Occasion rules fetched and stored successfully.');
        } catch (error: any) {
          console.error('❌ Failed to fetch occasion rules:', error);
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'app-config-storage',
      storage: createJSONStorage(() => simpleStorage),
      partialize: (state) => ({ 
        occasionRules: state.occasionRules,
        lastFetched: state.lastFetched 
      }),
    }
  )
);
