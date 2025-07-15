// hooks/useWardrobeLimit.ts - Cache-aware optimized version

import { useEffect, useState, useMemo } from 'react';
import { useClothingStore } from '@/store/clothingStore';
import { useRevenueCat, getRevenueCatCacheStatus } from './useRevenueCat';
import { useAuth } from '@/context/AuthContext';

interface WardrobeLimitInfo {
  currentCount: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  percentage: number;
  canAdd: boolean;
  plan: 'free' | 'premium';
}

// Cache wardrobe limit hesaplamalarını
let wardrobeLimitCache: {
  plan: 'free' | 'premium';
  clothingCount: number;
  limitInfo: WardrobeLimitInfo;
  lastCalculated: number;
} | null = null;

const CACHE_DURATION = 30 * 1000; // 30 saniye - clothing değişiklikleri için daha kısa

export const useWardrobeLimit = () => {
  const { currentPlan, isLoading: isPlanLoading } = useRevenueCat();
  const { clothing } = useClothingStore();
  const { user } = useAuth();
  const [limitInfo, setLimitInfo] = useState<WardrobeLimitInfo | null>(null);

  const WARDROBE_LIMITS = {
    free: 75,
    premium: Infinity,
  };

  // User logout olduysa cache'i temizle
  useEffect(() => {
    if (!user) {
      console.log('🧹 User logged out, clearing wardrobe limit cache');
      wardrobeLimitCache = null;
      setLimitInfo(null);
      return;
    }
  }, [user]);

  // Memoized hesaplama - sadece gerekli değerler değiştiğinde hesapla
  const calculatedLimitInfo = useMemo(() => {
    if (!user || isPlanLoading) return null;

    const currentCount = clothing.length;
    const now = Date.now();

    // Cache kontrolü
    if (wardrobeLimitCache && 
        wardrobeLimitCache.plan === currentPlan &&
        wardrobeLimitCache.clothingCount === currentCount &&
        (now - wardrobeLimitCache.lastCalculated) < CACHE_DURATION) {
      
      console.log('📊 Using cached wardrobe limit calculation');
      return wardrobeLimitCache.limitInfo;
    }

    // Yeni hesaplama
    const limit = WARDROBE_LIMITS[currentPlan];
    const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentCount);
    const isLimitReached = limit !== Infinity && currentCount >= limit;
    const percentage = limit === Infinity ? 0 : Math.min(100, (currentCount / limit) * 100);
    const canAdd = !isLimitReached;

    const newLimitInfo: WardrobeLimitInfo = {
      currentCount,
      limit,
      remaining,
      isLimitReached,
      percentage,
      canAdd,
      plan: currentPlan,
    };

    // Cache'e kaydet
    wardrobeLimitCache = {
      plan: currentPlan,
      clothingCount: currentCount,
      limitInfo: newLimitInfo,
      lastCalculated: now
    };

    console.log('📊 Wardrobe limit calculated and cached:', {
      currentCount,
      limit,
      plan: currentPlan,
      cacheValidUntil: new Date(now + CACHE_DURATION).toLocaleTimeString()
    });

    return newLimitInfo;
  }, [clothing.length, currentPlan, isPlanLoading, user]);

  // State'i güncelle
  useEffect(() => {
    setLimitInfo(calculatedLimitInfo);
  }, [calculatedLimitInfo]);

  const isLoading = !user ? false : (isPlanLoading || limitInfo === null);

  return { limitInfo, isLoading };
};

// Cache durumunu kontrol etmek için utility
export const getWardrobeLimitCacheStatus = () => ({
  hasCache: !!wardrobeLimitCache,
  lastCalculated: wardrobeLimitCache?.lastCalculated || 0,
  age: wardrobeLimitCache ? Date.now() - wardrobeLimitCache.lastCalculated : 0,
  isExpired: wardrobeLimitCache ? (Date.now() - wardrobeLimitCache.lastCalculated) > CACHE_DURATION : true,
  cachedPlan: wardrobeLimitCache?.plan,
  cachedCount: wardrobeLimitCache?.clothingCount
});

// Cache'i temizlemek için utility
export const clearWardrobeLimitCache = () => {
  console.log('🗑️ Clearing wardrobe limit cache manually');
  wardrobeLimitCache = null;
};