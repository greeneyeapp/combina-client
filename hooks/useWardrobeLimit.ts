// hooks/useWardrobeLimit.ts
import { useEffect, useState } from 'react';
import { useUserPlanStore } from '@/store/userPlanStore';
import { useClothingStore } from '@/store/clothingStore';
import { getUserProfile } from '@/services/userService';

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
  const { userPlan } = useUserPlanStore();
  const { clothing } = useClothingStore();
  const [limitInfo, setLimitInfo] = useState<WardrobeLimitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const WARDROBE_LIMITS = {
    free: 30,
    standard: 100,
    premium: Infinity,
  };

  useEffect(() => {
    const calculateLimitInfo = async () => {
      try {
        setIsLoading(true);
        
        // Ensure we have fresh plan data
        const profile = await getUserProfile();
        
        const currentCount = clothing.length;
        const limit = WARDROBE_LIMITS[profile.plan];
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
          plan: profile.plan,
        });
      } catch (error) {
        console.error('Error calculating wardrobe limit:', error);
        // Fallback to basic calculation if profile fetch fails
        const fallbackPlan = userPlan?.plan || 'free';
        const currentCount = clothing.length;
        const limit = WARDROBE_LIMITS[fallbackPlan];
        
        setLimitInfo({
          currentCount,
          limit,
          remaining: limit === Infinity ? Infinity : Math.max(0, limit - currentCount),
          isLimitReached: limit !== Infinity && currentCount >= limit,
          percentage: limit === Infinity ? 0 : Math.min(100, (currentCount / limit) * 100),
          canAdd: limit === Infinity || currentCount < limit,
          plan: fallbackPlan,
        });
      } finally {
        setIsLoading(false);
      }
    };

    calculateLimitInfo();
  }, [clothing.length, userPlan?.plan]);

  return { limitInfo, isLoading };
};