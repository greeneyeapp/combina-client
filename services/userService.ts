// services/userService.ts - Tam güncellenmiş versiyon

import API_URL from '@/config';
import { useUserPlanStore, UserPlan } from '@/store/userPlanStore';
import { useApiAuthStore } from '@/store/apiAuthStore';
import { apiDeduplicator } from '@/utils/apiDeduplication';
import i18n from '@/locales/i18n';

interface UserProfileResponse {
  user_id: string;
  fullname?: string; // Anonymous kullanıcılar için opsiyonel
  email?: string; // Email opsiyonel
  gender?: string; // Gender opsiyonel (başlangıçta unisex olabilir)
  age?: number;
  birthDate?: string; // BirthDate opsiyonel
  plan: 'free' | 'premium' | 'anonymous'; // Anonymous plan eklenmiş
  usage: {
    daily_limit: number | "unlimited";
    current_usage: number;
    remaining: number | "unlimited";
    percentage_used: number;
    date: string;
    rewarded_count?: number;
  };
  created_at: any;
  isAnonymous: boolean; // DÜZELTME: Anonymous kontrol alanı eklendi
  profile_complete: boolean; // DÜZELTME: Profil tamamlanma alanı eklendi
}

// Global state tracking
let lastProfileFetch = 0;
let isInitializing = false;
const PROFILE_CACHE_TTL = 5 * 60 * 1000; // 5 dakika
const MIN_FETCH_INTERVAL = 30 * 1000; // 30 saniye minimum aralık

const getAuthToken = async (): Promise<string> => {
  const storedJwt = useApiAuthStore.getState().jwt;
  if (!storedJwt) {
    throw new Error('User not authenticated - no JWT token');
  }
  return storedJwt;
};

export const fetchUserProfile = async (): Promise<UserProfileResponse> => {
  const cacheKey = 'user_profile';
  return apiDeduplicator.deduplicate(
    cacheKey,
    async () => {
      console.log('🔄 Fetching user profile from API...');
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to fetch user profile: ${response.status} ${errorData}`);
      }
      lastProfileFetch = Date.now();
      const data = await response.json();
      console.log('📬 RAW API RESPONSE:', JSON.stringify(data, null, 2));
      return data;
    },
    PROFILE_CACHE_TTL
  );
};

export const getUserProfile = async (forceRefresh: boolean = false): Promise<UserPlan> => {
  const { userPlan, setUserPlan, setLoading } = useUserPlanStore.getState();

  if (forceRefresh) {
    console.log('🔄 Force refresh requested. Clearing API cache for user_profile.');
    apiDeduplicator.clearCache('user_profile');
  }

  const timeSinceLastApiFetch = Date.now() - lastProfileFetch;
  if (!forceRefresh && timeSinceLastApiFetch < MIN_FETCH_INTERVAL) {
    if (userPlan) return userPlan;
  }

  try {
    setLoading(true);
    const profileData = await fetchUserProfile();
    
    // DÜZELTME: Yeni alanları dahil ederek UserPlan'i oluştur
    const planData: UserPlan = {
      plan: profileData.plan,
      usage: profileData.usage,
      fullname: profileData.fullname,
      gender: profileData.gender,
      age: profileData.age,
      created_at: profileData.created_at,
      birthDate: profileData.birthDate,
      // DÜZELTME: Yeni alanlar eklendi
      isAnonymous: profileData.isAnonymous,
      profile_complete: profileData.profile_complete,
      email: profileData.email, // Email de eklenebilir
    };
    
    setUserPlan(planData);
    return planData;
  } catch (error) {
    console.error('❌ USER SERVICE - Failed to fetch user profile:', error);
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

// Utility functions
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

export const deleteUserAccount = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const token = await getAuthToken();
    const response = await fetch(`${API_URL}/api/users/delete-account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to delete account');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ USER SERVICE - Failed to delete user account:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
      rewarded_count: profile.usage.rewarded_count,
      isAnonymous: profile.isAnonymous
    });

    // DÜZELTME: daily_limit tip kontrolü
    const dailyLimit = profile.usage.daily_limit;
    
    // Premium plan veya unlimited ise her zaman true
    if (dailyLimit === "unlimited" || profile.plan === 'premium') {
      return { canSuggest: true };
    }

    // daily_limit number olduğundan emin olduktan sonra karşılaştır
    const numericDailyLimit = typeof dailyLimit === 'number' ? dailyLimit : 0;

    // Anonymous kullanıcılar için özel kontrol
    if (profile.isAnonymous) {
      const canSuggest = profile.usage.current_usage < numericDailyLimit;
      if (!canSuggest) {
        return {
          canSuggest: false,
          reason: i18n.t('suggestions.anonymousLimitReached', 'Daily limit reached for guest users')
        };
      }
      return { canSuggest: true };
    }

    // Normal kullanıcılar için kontrol
    const canSuggest = profile.usage.current_usage < numericDailyLimit;

    console.log('🔍 canGetSuggestion - Calculation:', {
      current_usage: profile.usage.current_usage,
      daily_limit: numericDailyLimit,
      canSuggest
    });

    if (canSuggest) {
      return { canSuggest: true };
    }

    return {
      canSuggest: false,
      reason: `Daily suggestion limit reached (${profile.usage.current_usage}/${numericDailyLimit})`
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