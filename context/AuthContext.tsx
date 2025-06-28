import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useApiAuthStore } from '@/store/apiAuthStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { initializeUserProfile } from '@/services/userService';
import axios from 'axios';
import API_URL from '@/config';
import Purchases from 'react-native-purchases';

interface AuthContextType {
  user: any | null; // Artık Firebase User değil, kendi user objemiz
  loading: boolean;
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
  const { setJwt, clearJwt, loadJwt, isReady, jwt } = useApiAuthStore();
  const { clearUserPlan } = useUserPlanStore();

  useEffect(() => {
    loadJwt();
  }, [loadJwt]);

  useEffect(() => {
    if (!isReady) return;

    const initializeAuth = async () => {
      if (jwt) {
        try {
          // JWT token'dan user bilgilerini al
          const userInfo = await getUserFromToken(jwt);
          setUser(userInfo);
          
          // RevenueCat'i başlat
          if (userInfo?.uid) {
            await Purchases.logIn(userInfo.uid);
          }
          
          await initializeUserProfile();
        } catch (error) {
          console.error("Failed to initialize auth:", error);
          await clearJwt();
          clearUserPlan();
          setUser(null);
        }
      } else {
        setUser(null);
        clearUserPlan();
      }
      setLoading(false);
    };

    initializeAuth();
  }, [isReady, jwt]);

  const signInWithGoogle = async (accessToken: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/google`, {
        access_token: accessToken
      });
      
      const { access_token, user_info } = response.data;
      await setJwt(access_token);
      setUser(user_info);
      
      // RevenueCat'i başlat
      if (user_info?.uid) {
        await Purchases.logIn(user_info.uid);
      }
      
      await initializeUserProfile();
      return user_info;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signInWithApple = async (credential: any) => {
    try {
      const response = await axios.post(`${API_URL}/auth/apple`, {
        identity_token: credential.identityToken,
        authorization_code: credential.authorizationCode,
        user_info: credential.fullName
      });
      
      const { access_token, user_info } = response.data;
      await setJwt(access_token);
      setUser(user_info);
      
      // RevenueCat'i başlat
      if (user_info?.uid) {
        await Purchases.logIn(user_info.uid);
      }
      
      await initializeUserProfile();
      return user_info;
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  };

  const updateUserInfo = async (info: { name: string; gender: string; birthDate: string }) => {
    try {
      await axios.post(`${API_URL}/api/users/update-info`, {
        ...info
      }, {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      await refreshUserProfile();
    } catch (error) {
      console.error('Update user info error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await Purchases.logOut();
      await clearJwt();
      setUser(null);
      clearUserPlan();
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const refreshUserProfile = async () => {
    if (user) {
      try {
        await initializeUserProfile();
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
      }
    }
  };

  const getUserFromToken = async (token: string) => {
    try {
      // JWT token'ı decode et (basit versiyonu)
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { uid: payload.sub, isAnonymous: false };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    updateUserInfo,
    logout,
    refreshUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};