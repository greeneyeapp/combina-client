import React from 'react';
import { useApiAuthStore } from '@/store/apiAuthStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { initializeUserProfile } from '@/services/userService';
import axios from 'axios';
import API_URL from '@/config';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRootNavigationState, useSegments } from 'expo-router';

const USER_CACHE_KEY = 'cached_user_data';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isAuthFlowActive: boolean;
  setAuthFlowActive: (isActive: boolean) => void;
  signInWithGoogle: (accessToken: string) => Promise<any>;
  signInWithApple: (credential: any) => Promise<any>;
  updateUserInfo: (info: { name: string; gender: string; birthDate: string }) => Promise<void>;
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

let authInitialized = false;
let lastProfileRefresh = 0;
const PROFILE_REFRESH_THROTTLE = 60 * 1000; // 1 dakika minimum aralık

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAuthFlowActive, setAuthFlowActive] = React.useState(false);
  const { setJwt, clearJwt, loadJwt, isReady, jwt } = useApiAuthStore();
  const { clearUserPlan } = useUserPlanStore();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  React.useEffect(() => {
    loadJwt();
  }, [loadJwt]);

  const getUserFromToken = async (token: string) => {
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedPayload = atob(payloadBase64);
      const payload = JSON.parse(decodedPayload);
      return { uid: payload.sub, isAnonymous: false, name: null, fullname: null, gender: null, birthDate: null };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  React.useEffect(() => {
    if (!isReady || authInitialized) return;

    const initializeAuth = async () => {
      console.log('🔐 Initializing auth...');
      authInitialized = true;

      if (jwt) {
        let finalUser = null;
        try {
          const userInfo = await getUserFromToken(jwt);
          if (!userInfo) {
            throw new Error("Invalid token could not be decoded.");
          }
          
          let cachedData = {};
          try {
            const cachedUser = await AsyncStorage.getItem(USER_CACHE_KEY);
            if (cachedUser) {
              cachedData = JSON.parse(cachedUser);
            }
          } catch (e) {
            console.warn('Could not load cached user data:', e);
          }

          finalUser = { ...userInfo, ...cachedData };
          setUser(finalUser);
          if (finalUser?.uid) await Purchases.logIn(finalUser.uid);

          // Arka planda profili sessizce yenile
          console.log('🔄 Refreshing user profile in background...');
          initializeUserProfile().catch(profileError => {
            console.warn('Could not refresh user profile on startup. App will use cached data:', profileError);
          });

        } catch (error) {
          // Sadece token geçersizse veya kritik bir hata varsa çıkış yap
          console.error('Critical auth validation failed, logging out:', error);
          await logout(); // Logout fonksiyonunu çağırarak temiz bir çıkış sağla
          return;
        }
      } else {
        setUser(null);
        clearUserPlan();
        await AsyncStorage.removeItem(USER_CACHE_KEY);
      }
      setLoading(false);
    };

    initializeAuth();
  }, [isReady, jwt]);

  const signInWithGoogle = async (accessToken: string) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/google`, { access_token: accessToken }, { timeout: 30000 });
      const { access_token, user_info } = response.data;
      const completeUserInfo = {
        uid: user_info?.uid,
        name: user_info?.name || '',
        displayName: user_info?.name || '',
        email: user_info?.email || '',
        gender: user_info?.gender || null,
        birthDate: user_info?.birthDate || null,
      };
      setUser(completeUserInfo);
      await setJwt(access_token);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      if (user_info?.uid) {
        await Purchases.logIn(user_info.uid);
      }
      await initializeUserProfile();
      return completeUserInfo;
    } catch (error) {
      console.error('❌ GOOGLE SIGN-IN ERROR:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async (credential: any) => {
    setLoading(true);
    try {
      const givenName = credential.fullName?.givenName || '';
      const familyName = credential.fullName?.familyName || '';
      const nameForBackend = `${givenName} ${familyName}`.trim();

      const response = await axios.post(`${API_URL}/auth/apple`, {
        identity_token: credential.identityToken,
        authorization_code: credential.authorizationCode,
        user_info: { name: nameForBackend, email: credential.email }
      }, { timeout: 30000 });

      const { access_token, user_info } = response.data;
      if (!user_info) throw new Error("User info was not returned from the server.");

      await setJwt(access_token);
      const finalName = user_info.name || nameForBackend;
      const finalEmail = user_info.email || credential.email || '';

      const completeUserInfo = {
        uid: user_info.uid,
        name: finalName,
        displayName: finalName,
        email: finalEmail,
        gender: user_info.gender || null,
        birthDate: user_info.birthDate || null,
      };
      setUser(completeUserInfo);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      if (user_info.uid) {
        await Purchases.logIn(user_info.uid);
      }
      await initializeUserProfile();
      return completeUserInfo;
    } catch (error) {
      console.error('❌ APPLE SIGN-IN ERROR:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserInfo = async (info: { name: string; gender: string; birthDate: string }) => {
    const token = useApiAuthStore.getState().jwt;
    await axios.post(`${API_URL}/api/users/update-info`, { ...info }, { headers: { Authorization: `Bearer ${token}` } });
    const updatedUser = { ...user, name: info.name, displayName: info.name, gender: info.gender, birthDate: info.birthDate };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
    await refreshUserProfile();
  };

  const logout = async () => {
    console.log('🚪 Starting logout process...');
    setUser(null);
    clearUserPlan();
    await clearJwt();
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    authInitialized = false;
    try {
      await Purchases.logOut();
      console.log('✅ RevenueCat logout successful');
    } catch (revenueCatError) {
      console.warn('⚠️ RevenueCat logout error (can be ignored):', revenueCatError);
    }
    router.replace('/(auth)');
  };

  const refreshUserProfile = async () => {
    const now = Date.now();
    if (now - lastProfileRefresh < PROFILE_REFRESH_THROTTLE) {
      return;
    }
    if (user) {
      try {
        lastProfileRefresh = now;
        await initializeUserProfile();
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
      }
    }
  };

  React.useEffect(() => {
    if (!navigationState?.key || loading || isAuthFlowActive) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (user && jwt) {
      const profileComplete = user.gender && user.birthDate;
      if (!profileComplete && segments[1] !== 'complete-profile') {
        router.replace('/(auth)/complete-profile');
      } else if (profileComplete && inAuthGroup) {
        router.replace('/(tabs)/home');
      }
    } else {
      if (!inAuthGroup) {
        router.replace('/(auth)');
      }
    }
  }, [user, jwt, loading, isAuthFlowActive, segments, navigationState?.key]);

  const value = { user, loading, isAuthFlowActive, setAuthFlowActive, signInWithGoogle, signInWithApple, updateUserInfo, logout, refreshUserProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};