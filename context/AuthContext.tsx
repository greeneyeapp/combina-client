import React from 'react';
import { useApiAuthStore } from '@/store/apiAuthStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { fetchUserProfile } from '@/services/userService';
import axios from 'axios';
import API_URL from '@/config';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiDeduplicator } from '@/utils/apiDeduplication';
import i18n from '@/locales/i18n';

const USER_CACHE_KEY = 'cached_user_data';
const ANONYMOUS_USER_ID_KEY = 'anonymous_user_id';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isInitialized: boolean;
  signInWithGoogle: (accessToken: string) => Promise<any>;
  signInWithApple: (credential: any) => Promise<any>;
  signInAnonymously: (userData: any) => Promise<any>;
  updateUserInfo: (info: { name: string; gender: string }) => Promise<any>;
  logout: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [lastProfileRefresh, setLastProfileRefresh] = React.useState(0);

  const { setJwt, clearJwt, loadJwt, isReady, jwt } = useApiAuthStore();
  const { clearUserPlan } = useUserPlanStore();

  React.useEffect(() => {
    loadJwt();
  }, [loadJwt]);

  React.useEffect(() => {
    if (!isReady || isInitialized) return;
    const initializeAuth = async () => {
      try {
        if (jwt) {
          const profileData = await fetchUserProfile();
          const completeUserInfo = {
            uid: profileData.user_id,
            email: profileData.email || '',
            name: profileData.fullname || '',
            fullname: profileData.fullname || '',
            displayName: profileData.fullname || '',
            gender: profileData.gender || null,
            plan: profileData.plan || 'free',
            provider: 'api',
            isAnonymous: profileData.isAnonymous || false,
            profile_complete: profileData.profile_complete === true,
          };
          setUser(completeUserInfo);
          await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
          if (completeUserInfo.uid && !completeUserInfo.isAnonymous) {
            await Purchases.logIn(completeUserInfo.uid).catch(e => console.warn('RC login failed during init:', e));
          }
        } else {
          setUser(null);
          clearUserPlan();
          await AsyncStorage.removeItem(USER_CACHE_KEY);
        }
      } catch (error) {
        await clearJwt();
        clearUserPlan();
        setUser(null);
        await AsyncStorage.removeItem(USER_CACHE_KEY);
        await Purchases.logOut().catch(e => console.log('RC logout failed on validation error'));
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };
    initializeAuth();
  }, [isReady, jwt, isInitialized]);

  const signInAnonymously = async (userData: any) => {
    try {
      const existingAnonymousId = userData.anonymous_id;
      const response = await axios.post(`${API_URL}/auth/anonymous`, {
        session_id: 'mobile_app',
        language: userData.language,
        gender: userData.gender,
        anonymous_id: existingAnonymousId
      }, { timeout: 30000 });
      
      const { access_token, user_info } = response.data;
      await setJwt(access_token);
      
      if (user_info.user_id && user_info.user_id !== existingAnonymousId) {
        await AsyncStorage.setItem(ANONYMOUS_USER_ID_KEY, user_info.user_id);
      }
      
      const completeUserInfo = {
        uid: user_info.user_id,
        name: user_info.fullname || i18n.t('profile.guest'),
        fullname: user_info.fullname || i18n.t('profile.guest'),
        displayName: user_info.fullname || i18n.t('profile.guest'),
        email: '',
        gender: user_info.gender || 'unisex',
        plan: user_info.plan || 'free',
        provider: 'anonymous',
        isAnonymous: true,
        profile_complete: user_info.profile_complete === true
      };
      
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      setUser(completeUserInfo);
      return completeUserInfo;
    } catch (error) {
      await clearJwt();
      setUser(null);
      throw error;
    }
  };

  const signInWithGoogle = async (accessToken: string) => {
    try {
      let response;
      if (user?.isAnonymous) {
        response = await axios.post(`${API_URL}/auth/convert-anonymous`, {
          oauth_token: accessToken, provider: 'google'
        }, { headers: { Authorization: `Bearer ${jwt}` }, timeout: 30000 });
        await AsyncStorage.removeItem(ANONYMOUS_USER_ID_KEY);
      } else {
        response = await axios.post(`${API_URL}/auth/google`, { 
          access_token: accessToken 
        }, { timeout: 30000 });
      }
      
      const { access_token, user_info } = response.data;
      
      const completeUserInfo = {
        uid: user_info?.uid,
        name: user_info?.name || '',
        fullname: user_info?.name || '',
        displayName: user_info?.name || '',
        email: user_info?.email || '',
        gender: user_info?.gender || null,
        plan: user_info?.plan || 'free',
        provider: 'google',
        isAnonymous: false,
        profile_complete: user_info?.profile_complete || false
      };
      
      await setJwt(access_token);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      setUser(completeUserInfo);
      
      if (user_info?.uid) {
        await Purchases.logIn(user_info.uid).catch(e => console.warn('Google RC login failed:', e));
      }
      
      return completeUserInfo;
    } catch (error) {
      throw error;
    }
  };

  const signInWithApple = async (credential: any) => {
    try {
      const givenName = credential.fullName?.givenName || '';
      const familyName = credential.fullName?.familyName || '';
      const nameFromApple = `${givenName} ${familyName}`.trim();
      const response = await axios.post(`${API_URL}/auth/apple`, {
        identity_token: credential.identityToken,
        authorization_code: credential.authorizationCode,
        user_info: { name: nameFromApple, email: credential.email }
      }, { timeout: 30000 });
      const { access_token, user_info } = response.data;
      if (!user_info) throw new Error("User info was not returned from the server.");
      
      await setJwt(access_token);
      const finalName = user_info.fullname || nameFromApple;
      const finalEmail = user_info.email || credential.email || '';
      const completeUserInfo = {
        uid: user_info.uid,
        name: finalName,
        fullname: finalName,
        displayName: finalName,
        email: finalEmail,
        gender: user_info.gender || null,
        plan: user_info.plan || 'free',
        provider: 'apple',
        isAnonymous: false,
        profile_complete: user_info?.profile_complete || false
      };
      
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      setUser(completeUserInfo);
      
      if (user_info.uid) {
        await Purchases.logIn(user_info.uid).catch(e => console.warn('Apple RC login failed:', e));
      }
      
      return completeUserInfo;
    } catch (error) {
      throw error;
    }
  };

  const updateUserInfo = async (info: { name: string; gender: string }): Promise<any> => {
    try {
      const token = useApiAuthStore.getState().jwt;
      if (!token) throw new Error("No token found");
      
      const response = await axios.post(
        `${API_URL}/api/users/update-info`, 
        { name: info.name, gender: info.gender }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const { profile_complete } = response.data;
      const updatedUser = {
        ...user,
        fullname: info.name,
        name: info.name,
        displayName: info.name,
        gender: info.gender,
        profile_complete: profile_complete === true
      };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      apiDeduplicator.clearCache('user_profile');
      
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const isAnon = user?.isAnonymous;
      setUser(null);
      await clearJwt();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      apiDeduplicator.clearCache();
      setLastProfileRefresh(0);
      clearUserPlan();
      
      if (!isAnon) {
        await AsyncStorage.removeItem(ANONYMOUS_USER_ID_KEY);
        await Purchases.logOut().catch(e => console.log('RC logout error (expected):', e));
      }
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const refreshUserProfile = async () => {
    const now = Date.now();
    if (now - lastProfileRefresh < 60000) return;
    if (user && !user.isAnonymous) {
      try {
        setLastProfileRefresh(now);
        await fetchUserProfile();
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
      }
    }
  };

  const value = {
    user,
    loading,
    isInitialized,
    signInWithGoogle,
    signInWithApple,
    signInAnonymously,
    updateUserInfo,
    logout,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};