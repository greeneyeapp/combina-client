// kodlar/context/AuthContext.tsx

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useApiAuthStore } from '@/store/apiAuthStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { initializeUserProfile } from '@/services/userService';
import axios from 'axios';
import API_URL from '@/config';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
// useSegments hook'unu import ediyoruz
import { router, useSegments } from 'expo-router';

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthFlowActive, setAuthFlowActive] = useState(false);
  const [skipInitialize, setSkipInitialize] = useState(false);
  const { setJwt, clearJwt, loadJwt, isReady, jwt } = useApiAuthStore();
  const { clearUserPlan } = useUserPlanStore();
  // Mevcut route segmentlerini almak için hook'u burada çağırıyoruz.
  const segments = useSegments();

  useEffect(() => {
    const loadCachedUser = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem(USER_CACHE_KEY);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
      } catch (error) {
        console.error('Failed to load cached user:', error);
      }
    };
    loadCachedUser();
    loadJwt();
  }, [loadJwt]);

  useEffect(() => {
    if (!isReady || skipInitialize) return;
    const initializeAuth = async () => {
      if (user && user.name && user.uid) { setLoading(false); return; }
      if (jwt) {
        try {
          const userInfo = await getUserFromToken(jwt);
          setUser(userInfo);
          if (userInfo?.uid) await Purchases.logIn(userInfo.uid);
          await initializeUserProfile();
        } catch (error) {
          await clearJwt(); clearUserPlan(); setUser(null);
          await AsyncStorage.removeItem(USER_CACHE_KEY);
        }
      } else {
        setUser(null); clearUserPlan();
        await AsyncStorage.removeItem(USER_CACHE_KEY);
      }
      setLoading(false);
    };
    initializeAuth();
  }, [isReady, jwt, skipInitialize]);

  const signInWithGoogle = async (accessToken: string) => {
    setLoading(true);
    setSkipInitialize(true);

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
      await initializeUserProfile();
      setLoading(false);
      setSkipInitialize(false);
      return completeUserInfo;
    } catch (error) {
      setLoading(false);
      setSkipInitialize(false);
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
      });

      const { access_token, user_info } = response.data;

      if (!user_info) {
        throw new Error("User info was not returned from the server.");
      }

      await setJwt(access_token);

      const completeUserInfo = {
        uid: user_info.uid,
        name: user_info.name || '',
        fullname: user_info.name || '',
        displayName: user_info.name || '',
        email: user_info.email || '',
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
      await initializeUserProfile();

      return completeUserInfo;

    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUserInfo = async (info: { name: string; gender: string; birthDate: string }) => {
    try {
      await axios.post(`${API_URL}/api/users/update-info`, { ...info }, { headers: { Authorization: `Bearer ${jwt}` } });
      const updatedUser = { ...user, name: info.name, fullname: info.name, displayName: info.name, gender: info.gender, birthDate: info.birthDate };
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      await refreshUserProfile();
    } catch (error) {
      console.error('Update user info error:', error); throw error;
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

      try {
        await Purchases.logOut();
        console.log('✅ RevenueCat logout successful');
      } catch (revenueCatError) {
        console.log('⚠️ RevenueCat logout error (expected):', revenueCatError);
      }

      // *** NIHAI ÇÖZÜM ***
      // Eğer kullanıcı zaten (auth) grubundaki bir ekrandaysa (örn: complete-profile),
      // o zaman manuel olarak ana giriş ekranına yönlendir.
      // Değilse (örn: profile ekranındaysa), yönlendirmeyi useProtectedRouter'a bırak.
      if (inAuthGroup) {
        router.replace('/(auth)');
        console.log('🎉 Logout from auth screen. Manually redirecting.');
      } else {
        console.log('🎉 Logout from tabs screen. Letting protected router handle redirection.');
      }

    } catch (error) {
      console.error("🚨 Logout Error:", error);
      setUser(null);
      clearUserPlan();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      // Hata durumunda her zaman güvenli limana dön.
      router.replace('/(auth)');
    }
  };

  const refreshUserProfile = async () => {
    if (user) { try { await initializeUserProfile(); } catch (error) { console.error("Failed to refresh user profile:", error); } }
  };

  const getUserFromToken = async (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { uid: payload.sub, isAnonymous: false, name: null, fullname: null, gender: null, birthDate: null };
    } catch (error) {
      console.error('Failed to decode token:', error); return null;
    }
  };

  const value = { user, loading, isAuthFlowActive, setAuthFlowActive, signInWithGoogle, signInWithApple, updateUserInfo, logout, refreshUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};