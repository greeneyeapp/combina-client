// services/userService.ts - Sadeleştirilmiş plan yapısı

import API_URL from '@/config';
import { auth } from '@/firebaseConfig';
import { useUserPlanStore, UserPlan } from '@/store/userPlanStore';
import { useApiAuthStore } from '@/store/apiAuthStore';
import i18n from '@/locales/i18n';

interface UserProfileResponse {
  user_id: string;
  fullname: string;
  gender: string;
  age?: number;
  plan: 'free' | 'premium'; // Standard kaldırıldı
  usage: {
    daily_limit: number;
    current_usage: number;
    remaining: number;
    percentage_used: number;
    date: string;
  };
  created_at: any;
}

interface ProfileInitData {
  fullname: string;
  gender: string;
  birthDate?: string;
}

// Get authenticated token helper
const getAuthToken = async (): Promise<string> => {
  const storedJwt = useApiAuthStore.getState().jwt;
  if (storedJwt) return storedJwt;

  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const idToken = await user.getIdToken();
  const tokenResponse = await fetch(`${API_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken })
  });

  if (!tokenResponse.ok) throw new Error('Failed to get auth token');
  const { access_token } = await tokenResponse.json();

  useApiAuthStore.getState().setJwt(access_token);
  return access_token;
};

// Initialize user profile on first registration
export const initializeProfile = async (profileData: ProfileInitData): Promise<void> => {
  const token = await getAuthToken();

  const response = await fetch(`${API_URL}/api/users/init-profile`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to initialize profile: ${response.status} ${errorData}`);
  }

  await getUserProfile(true);
};

// Fetch user profile from API
export const fetchUserProfile = async (): Promise<UserProfileResponse> => {
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

  return response.json();
};

// Get user profile with store management
export const getUserProfile = async (forceRefresh: boolean = false): Promise<UserPlan> => {
  const { userPlan, lastFetched, setUserPlan, setLoading } = useUserPlanStore.getState();

  const shouldFetch = forceRefresh ||
    !userPlan ||
    !lastFetched ||
    (Date.now() - new Date(lastFetched).getTime()) > 5 * 60 * 1000;

  if (!shouldFetch && userPlan) {
    return userPlan;
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
    console.error('Failed to fetch user profile:', error);

    if (userPlan) {
      console.warn('Using cached profile data due to fetch error');
      return userPlan;
    }

    throw error;
  } finally {
    setLoading(false);
  }
};

// Update user plan (for subscription changes) - Sadeleştirilmiş
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

  const { setPlan } = useUserPlanStore.getState();
  setPlan(plan);

  await getUserProfile(true);
};

// Initialize user profile (call this on app start/login)
export const initializeUserProfile = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      useUserPlanStore.getState().clearUserPlan();
      return;
    }

    await getUserProfile();
  } catch (error) {
    console.error('Failed to initialize user profile:', error);
  }
};

// Check if user can add wardrobe item
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

// Check usage for suggestions
export const canGetSuggestion = async (): Promise<{ canSuggest: boolean; reason?: string }> => {
  try {
    const profile = await getUserProfile();

    if (profile.usage.remaining > 0) {
      return { canSuggest: true };
    }

    return {
      canSuggest: false,
      reason: `Daily suggestion limit reached (${profile.usage.current_usage}/${profile.usage.daily_limit})`
    };

  } catch (error) {
    console.error('Error checking suggestion limit:', error);
    return { canSuggest: false, reason: i18n.t('suggestions.usageCheckFailed') };
  }
};

// Get plan features for display - Sadeleştirilmiş
export const getPlanFeatures = (planType: 'free' | 'premium') => {
  const features = {
    free: {
      wardrobe_limit: 75,
      daily_suggestions: 2,
      features: [
        'Basic outfit suggestions', 
        'Weather integration', 
        'Basic wardrobe management'
      ]
    },
    premium: {
      wardrobe_limit: 'Unlimited',
      daily_suggestions: 50,
      features: [
        'Unlimited wardrobe items',
        'Advanced AI styling', 
        'Pinterest inspiration',
        'Ad-free experience',
        'Priority support'
      ]
    }
  };

  return features[planType];
};