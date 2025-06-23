import API_URL from '@/config';
import { auth } from '@/firebaseConfig';
import { useUserPlanStore, UserPlan } from '@/store/userPlanStore';
import { useApiAuthStore } from '@/store/apiAuthStore';

interface UserProfileResponse {
  user_id: string;
  fullname: string;
  gender: string;
  age?: number;
  plan: 'free' | 'standard' | 'premium';
  usage: {
    daily_limit: number;
    current_usage: number;
    remaining: number;
    percentage_used: number;
    date: string;
  };
  created_at: any;
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
  
  // Update the store with new token
  useApiAuthStore.getState().setJwt(access_token);
  return access_token;
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
  
  // Check if we need to fetch (force refresh or no cached data or stale data)
  const shouldFetch = forceRefresh || 
                     !userPlan || 
                     !lastFetched || 
                     (Date.now() - new Date(lastFetched).getTime()) > 5 * 60 * 1000; // 5 minutes

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
    
    // If we have cached data, return it even if refresh failed
    if (userPlan) {
      console.warn('Using cached profile data due to fetch error');
      return userPlan;
    }
    
    throw error;
  } finally {
    setLoading(false);
  }
};

// Update user plan
export const updateUserPlan = async (plan: 'free' | 'standard' | 'premium'): Promise<void> => {
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
  
  // Update local store
  const { setPlan } = useUserPlanStore.getState();
  setPlan(plan);
  
  // Refresh profile to get updated usage limits
  await getUserProfile(true);
};

// Initialize user profile (call this on app start)
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
    // Don't throw - let the app continue with fallback behavior
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
      reason: `You've reached your ${profile.plan} plan limit. ${remaining} items remaining.` 
    };
    
  } catch (error) {
    console.error('Error checking wardrobe limit:', error);
    // If we can't check, assume they can add (fail open)
    return { canAdd: true };
  }
};

// Get plan features for display
export const getPlanFeatures = (planType: 'free' | 'standard' | 'premium') => {
  const features = {
    free: {
      wardrobe_limit: 30,
      daily_suggestions: 2,
      features: ['Basic outfit suggestions', 'Weather integration', 'Basic wardrobe management']
    },
    standard: {
      wardrobe_limit: 100,
      daily_suggestions: 10,
      features: ['Advanced outfit suggestions', 'Style tips', 'Unlimited photo storage', 'Priority support']
    },
    premium: {
      wardrobe_limit: 'Unlimited',
      daily_suggestions: 50,
      features: ['Unlimited everything', 'Pinterest inspiration', 'Advanced AI styling', 'Personal stylist chat', 'Premium support']
    }
  };
  
  return features[planType];
};