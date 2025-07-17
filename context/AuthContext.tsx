// context/AuthContext.tsx - Optimize edilmiş versiyon

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Global initialization tracking
let authInitialized = false;
let lastProfileRefresh = 0;
const PROFILE_REFRESH_THROTTLE = 60 * 1000; // 1 dakika minimum aralık

function useProtectedRouter() {
  const { user, loading: authLoading, isAuthFlowActive } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    const isNotFound = segments.includes('+not-found');

    if (isNotFound) {
      const timer = setTimeout(() => {
        if (user) {
          const profileComplete = user.gender && user.birthDate;
          if (profileComplete) {
            router.replace('/(tabs)/home');
          } else {
            router.replace('/(auth)/complete-profile');
          }
        } else {
          router.replace('/(auth)');
        }
      }, 150);
      return () => clearTimeout(timer);
    }

    if (authLoading || isAuthFlowActive) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (user) {
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
  }, [navigationState?.key, user, segments, authLoading, isAuthFlowActive]);
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthFlowActive, setAuthFlowActive] = useState(false);
  const { setJwt, clearJwt, loadJwt, isReady, jwt } = useApiAuthStore();
  const { clearUserPlan } = useUserPlanStore();
  const segments = useSegments();

  useEffect(() => {
    loadJwt();
  }, [loadJwt]);

  useEffect(() => {
    // Prevent multiple initializations
    if (!isReady || authInitialized) return;

    const initializeAuth = async () => {
      console.log('🔐 Initializing auth...');
      authInitialized = true;

      if (jwt) {
        let finalUser = null;
        try {
          // 1. Adım: Token ve önbellekten kullanıcıyı oluştur (AĞ BAĞLANTISI GEREKTİRMEZ)
          const userInfo = await getUserFromToken(jwt);
          let cachedData = {};
          try {
            const cachedUser = await AsyncStorage.getItem(USER_CACHE_KEY);
            if (cachedUser) {
              cachedData = JSON.parse(cachedUser);
            }
          } catch (e) {
            console.warn('Could not load cached user data:', e);
          }

          if (!userInfo) {
            throw new Error("Invalid token could not be decoded.");
          }

          finalUser = { ...userInfo, ...cachedData };
          setUser(finalUser); // Kullanıcıyı hemen ayarla, arayüz bekletilmesin.
          if (finalUser?.uid) await Purchases.logIn(finalUser.uid);

        } catch (error) {
          // BU BLOK SADECE TOKEN GEÇERSİZSE VEYA ÇOK KRİTİK BİR HATA VARSA ÇALIŞIR
          console.error('Critical auth validation failed, logging out:', error);
          await clearJwt();
          clearUserPlan();
          setUser(null);
          await AsyncStorage.removeItem(USER_CACHE_KEY);
          setLoading(false);
          return; // Fonksiyondan çık
        }

        // 2. Adım: Profili arka planda güncelle (OTURUMU ETKİLEMEZ)
        if (finalUser && finalUser.uid) {
          try {
            console.log('🔄 Refreshing user profile in background...');
            await initializeUserProfile();
          } catch (profileError) {
            // Profil güncelleme başarısız olursa sadece logla, OTURUMU KAPATMA!
            console.warn('Could not refresh user profile on startup. App will use cached data:', profileError);
          }
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
        fullname: user_info?.name || '',
        displayName: user_info?.name || '',
        email: user_info?.email || '',
        gender: user_info?.gender || null,
        birthDate: user_info?.birthDate || null,
        plan: user_info?.plan || 'free',
        provider: 'google',
        isAnonymous: false
      };
      setUser(completeUserInfo);
      await setJwt(access_token);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      if (user_info?.uid) {
        await Purchases.logIn(user_info.uid);
      }

      // Profile initialization'ı throttle et
      const now = Date.now();
      if (now - lastProfileRefresh > PROFILE_REFRESH_THROTTLE) {
        lastProfileRefresh = now;
        await initializeUserProfile();
      }

      setLoading(false);
      return completeUserInfo;
    } catch (error) {
      setLoading(false);
      console.error('❌ GOOGLE SIGN-IN ERROR:', error);
      throw error;
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
        user_info: {
          name: nameForBackend,
          email: credential.email
        }
      }, { timeout: 30000 });

      const { access_token, user_info } = response.data;

      if (!user_info) {
        throw new Error("User info was not returned from the server.");
      }

      await setJwt(access_token);

      const finalName = user_info.fullname || user_info.name || nameForBackend;
      const finalEmail = user_info.email || credential.email || '';

      const completeUserInfo = {
        uid: user_info.uid,
        name: finalName,
        fullname: finalName,
        displayName: finalName,
        email: finalEmail,
        gender: user_info.gender || null,
        birthDate: user_info.birthDate || null,
        plan: user_info.plan || 'free',
        provider: 'apple',
        isAnonymous: false
      };

      setUser(completeUserInfo);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));

      if (user_info.uid) {
        await Purchases.logIn(user_info.uid);
      }

      // Profile initialization'ı throttle et
      const now = Date.now();
      if (now - lastProfileRefresh > PROFILE_REFRESH_THROTTLE) {
        lastProfileRefresh = now;
        await initializeUserProfile();
      }

      setLoading(false);
      return completeUserInfo;

    } catch (error) {
      setLoading(false);
      console.error('❌ APPLE SIGN-IN ERROR:', error);
      throw error;
    }
  };

  const updateUserInfo = async (info: { name: string; gender: string; birthDate: string }) => {
    try {
      const token = useApiAuthStore.getState().jwt;
      await axios.post(`${API_URL}/api/users/update-info`, { ...info }, { headers: { Authorization: `Bearer ${token}` } });
      const updatedUser = { ...user, name: info.name, fullname: info.name, displayName: info.name, gender: info.gender, birthDate: info.birthDate };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));

      // Profile refresh'i throttle et
      const now = Date.now();
      if (now - lastProfileRefresh > PROFILE_REFRESH_THROTTLE) {
        lastProfileRefresh = now;
        await refreshUserProfile();
      }
    } catch (error) {
      console.error('Update user info error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      const inAuthGroup = segments[0] === '(auth)';

      setUser(null);
      clearUserPlan();
      await clearJwt();
      await AsyncStorage.removeItem(USER_CACHE_KEY);

      // Auth state'i reset et
      authInitialized = false;
      lastProfileRefresh = 0;

      try {
        await Purchases.logOut();
        console.log('✅ RevenueCat logout successful');
      } catch (revenueCatError) {
        console.log('⚠️ RevenueCat logout error (expected):', revenueCatError);
      }

      if (inAuthGroup) {
        router.replace('/(auth)');
      }

    } catch (error) {
      console.error("🚨 Logout Error:", error);
      setUser(null);
      clearUserPlan();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      router.replace('/(auth)');
    }
  };

  const refreshUserProfile = async () => {
    // Throttling kontrolü
    const now = Date.now();
    if (now - lastProfileRefresh < PROFILE_REFRESH_THROTTLE) {
      console.log('🚫 Profile refresh throttled');
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

  const getUserFromToken = async (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { uid: payload.sub, isAnonymous: false, name: null, fullname: null, gender: null, birthDate: null };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  // Navigation effect'i sadece kritik durumlarda çalıştır
  useEffect(() => {
    const isReadyToRoute = !loading && !isAuthFlowActive;
    if (!isReadyToRoute) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (user && jwt) {
      const profileComplete = user.gender && user.birthDate && user.name;
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
  }, [user, jwt, loading, isAuthFlowActive, segments]);

  const value = { user, loading, isAuthFlowActive, setAuthFlowActive, signInWithGoogle, signInWithApple, updateUserInfo, logout, refreshUserProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <ProtectedRouterComponent />
    </AuthContext.Provider>
  );
};

function ProtectedRouterComponent() {
  useProtectedRouter();
  return null;
}

// Development utilities
if (__DEV__) {
  (global as any).resetAuthState = () => {
    authInitialized = false;
    lastProfileRefresh = 0;
    console.log('🔄 Auth state reset');
  };
}