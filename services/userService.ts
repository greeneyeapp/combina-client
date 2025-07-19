// services/userService.ts - Firebase dependency kaldırılmış versiyon

import API_URL from '@/config';
import { useUserPlanStore, UserPlan } from '@/store/userPlanStore';
import { useApiAuthStore } from '@/store/apiAuthStore';
import { apiDeduplicator } from '@/utils/apiDeduplication';
import i18n from '@/locales/i18n';

interface UserProfileResponse {
  user_id: string;
  fullname: string;
  gender: string;
  age?: number;
  plan: 'free' | 'premium';
  usage: {
    daily_limit: number;
    current_usage: number;
    remaining: number;
    percentage_used: number;
    date: string;
  };
  created_at: any;
}

// Global state tracking
let lastProfileFetch = 0;
let isInitializing = false;
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 dakika
const MIN_FETCH_INTERVAL = 30 * 1000; // 30 saniye minimum aralık

// DÜZELTME: Firebase dependency kaldırıldı
const getAuthToken = async (): Promise<string> => {
  const storedJwt = useApiAuthStore.getState().jwt;
  if (!storedJwt) {
    throw new Error('User not authenticated - no JWT token');
  }
  return storedJwt;
};

// Optimized fetch user profile
export const fetchUserProfile = async (): Promise<UserProfileResponse> => {
  const cacheKey = 'user_profile';

  return apiDeduplicator.deduplicate(
    cacheKey,
    async () => {
      console.log('🔄 Fetching user profile from API...');
      const token = await getAuthToken();

      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch user profile: ${response.status} ${errorData}`);
      }

      lastProfileFetch = Date.now();
      return response.json();
    },
    PROFILE_CACHE_TTL
  );
};

// Optimized get user profile with intelligent caching
export const getUserProfile = async (forceRefresh: boolean = false): Promise<UserPlan> => {
  const { userPlan, lastFetched, setUserPlan, setLoading } = useUserPlanStore.getState();

  // Aggressive caching - önce store'dan kontrol et
  if (!forceRefresh && userPlan && lastFetched) {
    const timeSinceLastFetch = Date.now() - new Date(lastFetched).getTime();

    // Eğer son 30 saniye içinde fetch edildiyse, store'daki veriyi kullan
    if (timeSinceLastFetch < MIN_FETCH_INTERVAL) {
      console.log('📋 Using very recent cached profile (< 30s)');
      return userPlan;
    }

    // Eğer son 5 dakika içinde fetch edildiyse ve force refresh değilse, store'u kullan
    if (timeSinceLastFetch < PROFILE_CACHE_TTL) {
      console.log('📋 Using cached profile (< 5min)');
      return userPlan;
    }
  }

  // Rate limiting - çok sık çağrılmasını önle
  const timeSinceLastApiFetch = Date.now() - lastProfileFetch;
  if (!forceRefresh && timeSinceLastApiFetch < MIN_FETCH_INTERVAL) {
    console.log('🚫 Rate limited - too frequent API calls, using cached data');
    if (userPlan) return userPlan;
  }

  try {
    setLoading(true);
    const profileData = await fetchUserProfile();

    const planData: UserPlan = {
      plan: profileData.plan,
      usage: profileData.usage,
      fullname: profileData.fullname,
      gender: profileData.gender,
      age: profileData.age,
      created_at: profileData.created_at,
    };

    setUserPlan(planData);
    return planData;

  } catch (error) {
    console.error('❌ USER SERVICE - Failed to fetch user profile:', error);

    // Fallback to cached data
    if (userPlan) {
      console.warn('⚠️ USER SERVICE - Using cached profile due to error');
      return userPlan;
    }

    throw error;
  } finally {
    setLoading(false);
  }
};

// Initialize user profile - sadece gerektiğinde çağrılır
export const initializeUserProfile = async (): Promise<void> => {
  try {
    // Prevent multiple simultaneous initializations
    if (isInitializing) {
      console.log('📋 Profile initialization already in progress, skipping...');
      return;
    }

    // DÜZELTME: Firebase check kaldırıldı, sadece JWT kontrolü
    const token = useApiAuthStore.getState().jwt;
    if (!token) {
      useUserPlanStore.getState().clearUserPlan();
      return;
    }

    isInitializing = true;

    // Sadece cache yoksa veya çok eskiyse fetch et
    const { userPlan, lastFetched } = useUserPlanStore.getState();
    const shouldFetch = !userPlan ||
      !lastFetched ||
      (Date.now() - new Date(lastFetched).getTime()) > PROFILE_CACHE_TTL;

    if (shouldFetch) {
      console.log('🔄 Initializing user profile...');
      await getUserProfile();
    } else {
      console.log('📋 Profile already initialized and cached');
    }

  } catch (error) {
    console.error('Failed to initialize user profile:', error);
  } finally {
    isInitializing = false;
  }
};

// Update user plan - cache'i temizle
export const updateUserPlan = async (plan: 'free' | 'premium'): Promise<void> => {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/users/plan`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ plan })
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to update plan: ${response.status} ${errorData}`);
  }

  // Cache'i temizle ve yeni veriyi getir
  apiDeduplicator.clearCache('user_profile');
  const { setPlan } = useUserPlanStore.getState();
  setPlan(plan);

  // Force refresh ile yeni plan bilgisini getir
  setTimeout(() => {
    getUserProfile(true);
  }, 1000);
};

// Utility functions remain the same...
export const canAddWardrobeItem = async (): Promise<{ canAdd: boolean; reason?: string }> => {
  try {
    const profile = await getUserProfile();
    const { canAddItem, getRemainingItems } = useUserPlanStore.getState();

    if (canAddItem()) {
      return { canAdd: true };
    }

    const remaining = getRemainingItems();
    return {
      canAdd: false,
      reason: i18n.t('wardrobe.addItemLimitReached', { plan: profile.plan })
    };

  } catch (error) {
    console.error('Error checking wardrobe limit:', error);
    return { canAdd: true };
  }
};

export const canGetSuggestion = async (): Promise<{ canSuggest: boolean; reason?: string }> => {
  try {
    const profile = await getUserProfile();

    console.log('🔍 canGetSuggestion - Profile:', {
      plan: profile.plan,
      usage: profile.usage,
      remaining: profile.usage.remaining,
      current_usage: profile.usage.current_usage,
      daily_limit: profile.usage.daily_limit,
      rewarded_count: profile.usage.rewarded_count
    });

    // ✅ DÜZELTME: Sadece daily_limit'e göre kontrol et (UI ile tutarlı)
    const canSuggest = profile.usage.current_usage < profile.usage.daily_limit;

    console.log('🔍 canGetSuggestion - Calculation (FIXED):', {
      current_usage: profile.usage.current_usage,
      daily_limit: profile.usage.daily_limit,
      canSuggest,
      oldLogic: profile.usage.current_usage < (profile.usage.daily_limit + (profile.usage.rewarded_count || 0))
    });

    if (canSuggest) {
      return { canSuggest: true };
    }

    return {
      canSuggest: false,
      reason: `Daily suggestion limit reached (${profile.usage.current_usage}/${profile.usage.daily_limit})`
    };

  } catch (error) {
    console.error('❌ Error checking suggestion limit:', error);
    return { canSuggest: false, reason: i18n.t('suggestions.usageCheckFailed') };
  }
};

export const grantExtraSuggestion = async (): Promise<{ success: boolean }> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/users/grant-extra-suggestion`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to grant extra suggestion: ${errorData}`);
    }

    // Cache'i temizle ve yeni veriyi getir
    apiDeduplicator.clearCache('user_profile');
    await getUserProfile(true);
    return { success: true };
  } catch (error) {
    console.error('❌ Error granting extra suggestion:', error);
    return { success: false };
  }
};

// Development utilities
if (__DEV__) {
  (global as any).clearProfileCache = () => {
    apiDeduplicator.clearCache('user_profile');
    console.log('🔄 Profile cache cleared');
  };

  (global as any).getProfileCacheInfo = () => {
    console.log('📊 Profile cache info:', {
      lastProfileFetch: new Date(lastProfileFetch).toISOString(),
      isInitializing,
      timeSinceLastFetch: Date.now() - lastProfileFetch
    });
  };
}