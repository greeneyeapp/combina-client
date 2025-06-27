import { useEffect, useState } from 'react';
import { useClothingStore } from '@/store/clothingStore';
import { useRevenueCat } from './useRevenueCat';

interface WardrobeLimitInfo {
  currentCount: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  percentage: number;
  canAdd: boolean;
  plan: 'free' | 'standard' | 'premium';
}

export const useWardrobeLimit = () => {
  // Plan bilgisini doğrudan RevenueCat'ten alıyoruz
  const { currentPlan, isLoading: isPlanLoading } = useRevenueCat();
  const { clothing } = useClothingStore();
  const [limitInfo, setLimitInfo] = useState<WardrobeLimitInfo | null>(null);

  const WARDROBE_LIMITS = {
    free: 30,
    standard: 100,
    premium: Infinity,
  };

  useEffect(() => {
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
    }
  }, [clothing.length, currentPlan, isPlanLoading]);

  // Yükleme durumu olarak hem planın yüklenmesini hem de limit bilgisinin hesaplanmasını bekliyoruz
  const isLoading = isPlanLoading || limitInfo === null;

  return { limitInfo, isLoading };
};
