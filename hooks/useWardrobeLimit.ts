// hooks/useWardrobeLimit.ts - Sadeleştirilmiş plan yapısı

import { useEffect, useState } from 'react';
import { useClothingStore } from '@/store/clothingStore';
import { useRevenueCat } from './useRevenueCat';
import { useAuth } from '@/context/AuthContext';

interface WardrobeLimitInfo {
  currentCount: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  percentage: number;
  canAdd: boolean;
  plan: 'free' | 'premium'; // Standard kaldırıldı
}

export const useWardrobeLimit = () => {
  const { currentPlan, isLoading: isPlanLoading } = useRevenueCat();
  const { clothing } = useClothingStore();
  const { user } = useAuth();
  const [limitInfo, setLimitInfo] = useState<WardrobeLimitInfo | null>(null);

  // Sadeleştirilmiş wardrobe limitleri
  const WARDROBE_LIMITS = {
    free: 30,
    premium: Infinity,
  };

  // User logout olduysa state'i temizle
  useEffect(() => {
    if (!user) {
      console.log('🧹 User logged out, clearing wardrobe limit state');
      setLimitInfo(null);
      return;
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLimitInfo(null);
      return;
    }

    // Plan bilgisi yüklendiğinde limitleri hesapla
    if (!isPlanLoading) {
      const currentCount = clothing.length;
      const limit = WARDROBE_LIMITS[currentPlan];
      const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentCount);
      const isLimitReached = limit !== Infinity && currentCount >= limit;
      const percentage = limit === Infinity ? 0 : Math.min(100, (currentCount / limit) * 100);
      const canAdd = !isLimitReached;

      setLimitInfo({
        currentCount,
        limit,
        remaining,
        isLimitReached,
        percentage,
        canAdd,
        plan: currentPlan,
      });

      console.log('📊 Wardrobe limit updated:', {
        currentCount,
        limit,
        plan: currentPlan,
        user: !!user
      });
    }
  }, [clothing.length, currentPlan, isPlanLoading, user]);

  const isLoading = !user ? false : (isPlanLoading || limitInfo === null);

  return { limitInfo, isLoading };
};