// context/AuthContext.tsx - Anonymous user desteği ve conversion logic eklendi

import React from 'react';
import { useApiAuthStore } from '@/store/apiAuthStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { initializeUserProfile, fetchUserProfile, getUserProfile } from '@/services/userService';
import axios from 'axios';
import API_URL from '@/config';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRootNavigationState, useSegments } from 'expo-router';
import { apiDeduplicator } from '@/utils/apiDeduplication';
import { useConfigStore } from '@/store/configStore';

const USER_CACHE_KEY = 'cached_user_data';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  isAuthFlowActive: boolean;
  isInitialized: boolean;
  setAuthFlowActive: (isActive: boolean) => void;
  signInWithGoogle: (accessToken: string) => Promise<any>;
  signInWithApple: (credential: any) => Promise<any>;
  signInAnonymously: (userData: any) => Promise<any>;
  updateUserInfo: (info: { name: string; gender: string }) => Promise<void>;
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
  const [isAuthFlowActive, setAuthFlowActive] = React.useState(false);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [lastProfileRefresh, setLastProfileRefresh] = React.useState(0);

  const { setJwt, clearJwt, loadJwt, isReady, jwt } = useApiAuthStore();
  const { clearUserPlan } = useUserPlanStore();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  React.useEffect(() => {
    loadJwt();
  }, [loadJwt]);

  React.useEffect(() => {
    if (!isReady || isInitialized) return;

    const initializeAuth = async () => {
      console.log('🔐 Initializing auth...', { jwt: !!jwt });
      try {
        if (jwt) {
          const cachedUser = await AsyncStorage.getItem(USER_CACHE_KEY);
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          }

          useConfigStore.getState().fetchOccasionRules();

          console.log('🔄 Validating token with backend...');
          
          // Anonymous user için backend çağrısını atla
          const parsedUser = cachedUser ? JSON.parse(cachedUser) : null;
          if (parsedUser?.isAnonymous) {
            console.log('✅ Anonymous user, skipping backend validation');
            setUser(parsedUser);
          } else {
            // Normal user için backend validation
            const profileData = await fetchUserProfile();
            const completeUserInfo = {
              uid: profileData.user_id,
              email: (profileData as any).email || '',
              name: profileData.fullname || '',
              fullname: profileData.fullname || '',
              displayName: profileData.fullname || '',
              gender: profileData.gender || null,
              plan: profileData.plan || 'free',
              provider: 'api',
              isAnonymous: false,
              profile_complete: !!(profileData.fullname && profileData.gender) // YENİ: profile completeness
            };
            
            setUser(completeUserInfo);
            await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
            console.log('✅ Token validated, user profile is fresh.');
          }

          if (parsedUser?.uid && !parsedUser?.isAnonymous) {
            await Purchases.logIn(parsedUser.uid).catch(e => console.warn('RC login failed during init:', e));
          }
        } else {
          setUser(null);
          clearUserPlan();
          await AsyncStorage.removeItem(USER_CACHE_KEY);
        }
      } catch (error) {
        console.error('🚨 Token validation failed. Logging out...', error);
        await clearJwt();
        clearUserPlan();
        setUser(null);
        await AsyncStorage.removeItem(USER_CACHE_KEY);
        await Purchases.logOut().catch(e => console.log('RC logout failed on validation error'));
      } finally {
        setLoading(false);
        setIsInitialized(true);
        console.log('✅ Auth initialization completed');
      }
    };

    initializeAuth();
  }, [isReady, jwt]);

  // GÜNCELLENE NAVIGATION LOGIC
  React.useEffect(() => {
    if (!navigationState?.key || loading || isAuthFlowActive || !isInitialized) {
      return;
    }

    const handleNavigation = () => {
      const inAuthGroup = segments[0] === '(auth)';
      
      if (user && jwt) {
        // Anonymous kullanıcı için farklı mantık
        if (user.isAnonymous) {
          // Anonymous kullanıcı ana sayfaya yönlendir
          if (inAuthGroup) {
            console.log('🔄 Anonymous user: redirecting to home');
            router.replace('/(tabs)/home');
          }
        } else {
          // Authenticated kullanıcı için profile completeness kontrolü
          const profileComplete = user.profile_complete !== false && user.gender && user.name;
          
          if (!profileComplete) {
            if (segments[1] !== 'complete-profile') {
              console.log('📝 Profile incomplete: redirecting to complete-profile');
              router.replace('/(auth)/complete-profile');
            }
          } else {
            if (inAuthGroup) {
              console.log('🏠 Profile complete: redirecting from auth to home');
              router.replace('/(tabs)/home');
            }
          }
        }
      } else {
        // Kullanıcı giriş yapmamışsa auth'a yönlendir
        if (!inAuthGroup) {
          router.replace('/(auth)');
        }
      }
    };

    const timer = setTimeout(handleNavigation, 100);
    return () => clearTimeout(timer);
  }, [user, jwt, loading, isAuthFlowActive, segments, navigationState?.key, isInitialized]);

  // GÜNCELLENEN GOOGLE SIGN-IN
  const signInWithGoogle = async (accessToken: string) => {
    setLoading(true);
    try {
      // Eğer şu anda anonymous kullanıcıysak, conversion endpoint'ini kullan
      if (user?.isAnonymous) {
        console.log('🔄 Converting anonymous user to Google authenticated user...');
        
        const response = await axios.post(`${API_URL}/auth/convert-anonymous`, {
          oauth_token: accessToken,
          provider: 'google'
        }, { 
          headers: { Authorization: `Bearer ${jwt}` },
          timeout: 30000 
        });
        
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
          profile_complete: user_info?.profile_complete || false,
          converted_from_anonymous: true
        };
        
        await setJwt(access_token);
        await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
        setUser(completeUserInfo);
        
        if (user_info?.uid) {
          await Purchases.logIn(user_info.uid).catch(e => console.warn('⚠️ Google RC login failed:', e));
        }
        
        console.log('✅ Anonymous user converted to Google user successfully');
        setLoading(false);
        return completeUserInfo;
        
      } else {
        // Normal Google sign-in logic
        console.log('🔄 Normal Google sign-in...');
        
        const response = await axios.post(`${API_URL}/auth/google`, { 
          access_token: accessToken 
        }, { timeout: 30000 });
        
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
          await Purchases.logIn(user_info.uid).catch(e => console.warn('⚠️ Google RC login failed:', e));
        }
        
        setLoading(false);
        return completeUserInfo;
      }
    } catch (error) {
      setLoading(false);
      console.error('❌ GOOGLE SIGN-IN ERROR:', error);
      throw error;
    }
  };

  // GÜNCELLENEN APPLE SIGN-IN
  const signInWithApple = async (credential: any) => {
    setLoading(true);
    try {
      const givenName = credential.fullName?.givenName || '';
      const familyName = credential.fullName?.familyName || '';
      const nameFromApple = `${givenName} ${familyName}`.trim();

      // Eğer şu anda anonymous kullanıcıysak, conversion endpoint'ini kullan
      if (user?.isAnonymous) {
        console.log('🔄 Converting anonymous user to Apple authenticated user...');
        
        // Apple conversion henüz API'de implement edilmemiş, şimdilik normal flow
        // TODO: Apple conversion endpoint'i hazır olduğunda burası güncellenecek
        console.log('⚠️ Apple conversion not implemented yet, using normal flow');
      }

      // Normal Apple sign-in logic
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
        await Purchases.logIn(user_info.uid).catch(e => console.warn('⚠️ Apple RC login failed:', e));
      }
      
      setLoading(false);
      return completeUserInfo;
    } catch (error) {
      setLoading(false);
      console.error('❌ APPLE SIGN-IN ERROR:', error);
      throw error;
    }
  };

  // GÜNCELLENEN ANONYMOUS SIGN-IN
  const signInAnonymously = async (userData: any) => {
    setLoading(true);
    try {
      console.log('🔄 Starting anonymous session with backend...');
      
      // Backend'deki anonymous session endpoint'ini çağır
      const response = await axios.post(`${API_URL}/auth/anonymous`, {
        session_id: userData.session_id || 'mobile_app',
        language: userData.language || 'en',
        gender: userData.gender || 'unisex'
      }, { timeout: 30000 });
      
      const { session_id, access_token, user_info } = response.data;
      
      const completeUserInfo = {
        uid: session_id,
        name: `Guest User`,
        fullname: `Guest User`,
        displayName: `Guest User`,
        email: '',
        gender: user_info?.gender || 'unisex',
        plan: 'anonymous',
        provider: 'anonymous',
        isAnonymous: true,
        profile_complete: false, // Anonymous kullanıcılar profile complete etmez
        language: user_info?.language || 'en'
      };
      
      await setJwt(access_token);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      setUser(completeUserInfo);
      
      console.log('✅ Anonymous session started successfully');
      setLoading(false);
      return completeUserInfo;
      
    } catch (error) {
      console.error('❌ ANONYMOUS SIGN-IN ERROR:', error);
      
      // Backend hatası durumunda fallback olarak local anonymous user oluştur
      console.log('🔄 Fallback: Creating local anonymous user...');
      
      const mockToken = `anonymous_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const completeUserInfo = {
        uid: `anon_${Date.now()}`,
        name: `Guest User`,
        fullname: `Guest User`,
        displayName: `Guest User`,
        email: '',
        gender: userData.gender || 'unisex',
        plan: 'anonymous',
        provider: 'anonymous',
        isAnonymous: true,
        profile_complete: false,
        language: userData.language || 'en'
      };
      
      await setJwt(mockToken);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      setUser(completeUserInfo);
      
      console.log('✅ Local anonymous user created as fallback');
      setLoading(false);
      return completeUserInfo;
    }
  };

  const updateUserInfo = async (info: { name: string; gender: string }): Promise<any> => {
    try {
      // Anonymous user için sadece local update
      if (user?.isAnonymous) {
        const updatedUser = {
          ...user,
          fullname: info.name,
          name: info.name,
          displayName: info.name,
          gender: info.gender,
          profile_complete: true // Local olarak complete işaretleyelim
        };
        setUser(updatedUser);
        await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
        console.log('✅ Anonymous user info updated locally');
        return updatedUser;
      }

      // Normal user için backend çağrısı
      const token = useApiAuthStore.getState().jwt;
      if (!token) throw new Error("No token found");
      
      await axios.post(`${API_URL}/api/users/update-info`, { 
        name: info.name, 
        gender: info.gender 
      }, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log('Profile updated on backend, refetching...');
      const updatedPlan = await getUserProfile(true);
      const updatedUser = {
        ...user,
        fullname: updatedPlan.fullname,
        name: updatedPlan.fullname,
        displayName: updatedPlan.fullname,
        gender: updatedPlan.gender,
        profile_complete: !!(updatedPlan.fullname && updatedPlan.gender)
      };
      
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      console.log('✅ AuthContext user state updated with fresh data.');
      return updatedUser;
    } catch (error) {
      console.error('Update user info error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      setAuthFlowActive(true);
      setUser(null);
      useUserPlanStore.getState().clearUserPlan();
      await clearJwt();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      apiDeduplicator.clearCache();
      setIsInitialized(false);
      setLastProfileRefresh(0);
      
      // Anonymous kullanıcılar için RevenueCat logout yapma
      if (!user?.isAnonymous) {
        await Purchases.logOut().catch(e => console.log('⚠️ RC logout error (expected):', e));
      }
      
      router.replace('/(auth)');
      setTimeout(() => {
        setAuthFlowActive(false);
        console.log('✅ Logout process completed');
      }, 500);
    } catch (error) {
      console.error("🚨 Logout Error:", error);
      setUser(null);
      useUserPlanStore.getState().clearUserPlan();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      setIsInitialized(false);
      setLastProfileRefresh(0);
      setAuthFlowActive(false);
      router.replace('/(auth)');
    }
  };

  const refreshUserProfile = async () => {
    const now = Date.now();
    if (now - lastProfileRefresh < 60000) return;
    
    // Anonymous user için profile refresh yapma
    if (user && !user.isAnonymous) {
      try {
        setLastProfileRefresh(now);
        await initializeUserProfile();
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
      }
    }
  };

  const value = {
    user,
    loading,
    isAuthFlowActive,
    isInitialized,
    setAuthFlowActive,
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