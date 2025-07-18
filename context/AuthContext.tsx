// context/AuthContext.tsx - Final optimized and bug-free version

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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAuthFlowActive, setAuthFlowActive] = React.useState(false);
  
  // Component-level initialization tracking
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [lastProfileRefresh, setLastProfileRefresh] = React.useState(0);
  
  const { setJwt, clearJwt, loadJwt, isReady, jwt } = useApiAuthStore();
  const { clearUserPlan } = useUserPlanStore();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // İlk JWT yükleme
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

  // Ana initialization effect'i
  React.useEffect(() => {
    if (!isReady || isInitialized) return;

    const initializeAuth = async () => {
      console.log('🔐 Initializing auth...', { jwt: !!jwt });
      
      setIsInitialized(true);

      if (jwt) {
        let finalUser = null;
        try {
          // Token'dan user bilgisi çıkar
          const userInfo = await getUserFromToken(jwt);
          if (!userInfo) {
            throw new Error("Invalid token could not be decoded.");
          }

          // Cache'den ek bilgileri yükle
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
          
          // RevenueCat login
          if (finalUser?.uid) {
            try {
              await Purchases.logIn(finalUser.uid);
            } catch (revenueCatError) {
              console.warn('RevenueCat login failed:', revenueCatError);
            }
          }

        } catch (error) {
          console.error('🚨 Critical auth validation failed:', error);
          await clearJwt();
          clearUserPlan();
          setUser(null);
          await AsyncStorage.removeItem(USER_CACHE_KEY);
          setLoading(false);
          return;
        }
        
        // Background'da profile refresh
        if (finalUser && finalUser.uid) {
          try {
            console.log('🔄 Refreshing user profile in background...');
            await initializeUserProfile();
          } catch (profileError) {
            console.warn('Could not refresh user profile on startup:', profileError);
          }
        }

      } else {
        // JWT yok, temizlik yap
        setUser(null);
        clearUserPlan();
        await AsyncStorage.removeItem(USER_CACHE_KEY);
      }

      setLoading(false);
    };

    initializeAuth();
  }, [isReady]);

  const signInWithGoogle = async (accessToken: string) => {
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/google`, { access_token: accessToken }, { timeout: 30000 });
      const { access_token, user_info } = response.data;
      
      console.log('🔍 Google Backend response user_info:', JSON.stringify(user_info, null, 2));
      
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

      console.log('🔍 Google Created user object:', JSON.stringify(completeUserInfo, null, 2));

      await setJwt(access_token);
      console.log('✅ JWT token set successfully');
      
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      console.log('✅ User data cached successfully');
      
      setUser(completeUserInfo);
      console.log('✅ User state set successfully');

      // RevenueCat login (non-blocking)
      if (user_info?.uid) {
        try {
          await Purchases.logIn(user_info.uid);
          console.log('✅ Google RevenueCat login successful');
        } catch (revenueCatError) {
          console.warn('⚠️ Google RevenueCat login failed:', revenueCatError);
        }
      }

      // Profile refresh optimize edildi - sadece eksik data varsa
      const now = Date.now();
      if (now - lastProfileRefresh > 60000 && (!user_info?.gender || !user_info?.birthDate)) {
        setLastProfileRefresh(now);
        try {
          console.log('🔄 Google: Fetching additional profile data...');
          
          const { fetchUserProfile } = await import('@/services/userService');
          const profileData = await fetchUserProfile();
          
          if (profileData && (profileData.gender || profileData.fullname)) {
            const updatedUserInfo = {
              ...completeUserInfo,
              gender: profileData.gender || completeUserInfo.gender,
              fullname: profileData.fullname || completeUserInfo.fullname,
            };
            
            console.log('🔄 Google: Profile enhanced with additional data');
            setUser(updatedUserInfo);
            await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUserInfo));
          }
        } catch (profileError) {
          console.warn('⚠️ Google: Profile enhancement failed:', profileError);
        }
      } else {
        console.log('📋 Google: Profile refresh skipped - recent or complete data available');
      }

      setLoading(false);
      console.log('✅ Google sign-in completed successfully');
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

      console.log('🔍 Apple Backend response user_info:', JSON.stringify(user_info, null, 2));

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

      console.log('🔍 Apple Created user object:', JSON.stringify(completeUserInfo, null, 2));

      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      setUser(completeUserInfo);

      // RevenueCat login (non-blocking)
      if (user_info.uid) {
        try {
          await Purchases.logIn(user_info.uid);
          console.log('✅ Apple RevenueCat login successful');
        } catch (revenueCatError) {
          console.warn('⚠️ Apple RevenueCat login failed:', revenueCatError);
        }
      }

      // Profile refresh optimize edildi - Google ile aynı logic
      const now = Date.now();
      if (now - lastProfileRefresh > 60000 && (!user_info?.gender || !user_info?.birthDate)) {
        setLastProfileRefresh(now);
        try {
          console.log('🔄 Apple: Fetching additional profile data...');
          
          const { fetchUserProfile } = await import('@/services/userService');
          const profileData = await fetchUserProfile();
          
          if (profileData && (profileData.gender || profileData.fullname)) {
            const updatedUserInfo = {
              ...completeUserInfo,
              gender: profileData.gender || completeUserInfo.gender,
              fullname: profileData.fullname || completeUserInfo.fullname,
            };
            
            console.log('🔄 Apple: Profile enhanced with additional data');
            setUser(updatedUserInfo);
            await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUserInfo));
          }
        } catch (profileError) {
          console.warn('⚠️ Apple: Profile enhancement failed:', profileError);
        }
      } else {
        console.log('📋 Apple: Profile refresh skipped - recent or complete data available');
      }

      setLoading(false);
      console.log('✅ Apple sign-in completed successfully');
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
      
      const updatedUser = { 
        ...user, 
        name: info.name, 
        fullname: info.name, 
        displayName: info.name, 
        gender: info.gender, 
        birthDate: info.birthDate 
      };
      
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      
      // Profile refresh (throttled)
      const now = Date.now();
      if (now - lastProfileRefresh > 60000) {
        setLastProfileRefresh(now);
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

      // Logout işlemi başladığında navigation'ı durdur
      setAuthFlowActive(true);

      setUser(null);
      clearUserPlan();
      await clearJwt();
      await AsyncStorage.removeItem(USER_CACHE_KEY);

      setIsInitialized(false);
      setLastProfileRefresh(0);

      try {
        await Purchases.logOut();
        console.log('✅ RevenueCat logout successful');
      } catch (revenueCatError) {
        console.log('⚠️ RevenueCat logout error (expected):', revenueCatError);
      }

      // Tek navigation ile auth'a yönlendir
      console.log('🔐 Logout: Redirecting to auth...');
      router.replace('/(auth)');
      
      // Navigation tamamlandıktan sonra flag'i temizle
      setTimeout(() => {
        setAuthFlowActive(false);
        console.log('✅ Logout process completed');
      }, 1000);

    } catch (error) {
      console.error("🚨 Logout Error:", error);
      setUser(null);
      clearUserPlan();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      setIsInitialized(false);
      setLastProfileRefresh(0);
      setAuthFlowActive(false);
      router.replace('/(auth)');
    }
  };

  const refreshUserProfile = async () => {
    const now = Date.now();
    if (now - lastProfileRefresh < 60000) {
      console.log('🚫 Profile refresh throttled');
      return;
    }

    if (user) {
      try {
        setLastProfileRefresh(now);
        await initializeUserProfile();
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
      }
    }
  };

  // Navigation logic - Logout ve duplicate navigation fix
  React.useEffect(() => {
    if (!navigationState?.key || loading || isAuthFlowActive) {
      // isAuthFlowActive true ise (logout süreci) navigation yapma
      if (isAuthFlowActive && !user && !jwt) {
        console.log('⏸️ Navigation suspended during logout process');
      }
      return;
    }

    const handleNavigation = () => {
      const inAuthGroup = segments[0] === '(auth)';
      const currentPath = segments.join('/');
      const isNotFoundPage = segments.includes('+not-found');
      const isInTabs = segments[0] === '(tabs)';
      const isLogoutScenario = !user && !jwt && isInTabs;

      const shouldLog = isNotFoundPage || inAuthGroup || !isInTabs || isLogoutScenario;
      
      if (shouldLog || __DEV__) {
        console.log('🔍 Navigation Debug:', {
          user: !!user,
          jwt: !!jwt,
          userGender: user?.gender,
          userBirthDate: user?.birthDate,
          segments: segments,
          currentPath: currentPath,
          inAuthGroup: inAuthGroup,
          isNotFoundPage: isNotFoundPage,
          isInTabs: isInTabs,
          isLogoutScenario: isLogoutScenario
        });
      }

      if (user && jwt) {
        const profileComplete = user.gender && user.birthDate;
        
        if (shouldLog || __DEV__) {
          console.log('🚀 Navigation: User and JWT available, checking profile completion...');
          console.log('🔍 Profile completeness check:', {
            gender: user.gender,
            birthDate: user.birthDate,
            profileComplete: profileComplete
          });
        }
        
        if (!profileComplete) {
          if (segments[1] !== 'complete-profile') {
            console.log('📝 Navigation: Profile incomplete, redirecting to complete-profile');
            router.replace('/(auth)/complete-profile');
            return;
          }
          return;
        }
        
        if (profileComplete) {
          if (inAuthGroup || isNotFoundPage || currentPath === '' || currentPath === '+not-found') {
            console.log('🏠 Navigation: Profile complete, redirecting to home from:', currentPath);
            router.replace('/(tabs)/home');
            return;
          }
          
          if (isInTabs) {
            if (__DEV__ && shouldLog) {
              console.log('✅ Navigation: Already in tabs area');
            }
            return;
          }
          
          console.log('🔄 Navigation: Profile complete, ensuring user is in tabs area');
          router.replace('/(tabs)/home');
          return;
        }
      } else if (!user && !jwt) {
        if (!inAuthGroup) {
          // Sadece logout değil ise log
          if (!isLogoutScenario) {
            console.log('🔐 Navigation: No user/JWT, redirecting to auth');
          }
          router.replace('/(auth)');
          return;
        }
        return;
      }
    };

    const timer = setTimeout(handleNavigation, 250);
    return () => clearTimeout(timer);
    
  }, [user, jwt, loading, isAuthFlowActive, segments, navigationState?.key]);

  // Development debug helpers
  if (__DEV__) {
    React.useEffect(() => {
      (global as any).forceNavigateHome = () => {
        console.log('🔧 DEBUG: Force navigating to home');
        router.replace('/(tabs)/home');
      };
      
      (global as any).debugAuthState = () => {
        console.log('🔧 DEBUG Auth State:', {
          user: !!user,
          jwt: !!jwt,
          loading,
          isAuthFlowActive,
          segments,
          userComplete: !!(user?.gender && user?.birthDate)
        });
      };

      (global as any).testLogout = () => {
        console.log('🔧 DEBUG: Testing logout');
        logout();
      };
    }, [user, jwt, loading, isAuthFlowActive, segments]);
  }

  const value = { 
    user, 
    loading, 
    isAuthFlowActive, 
    setAuthFlowActive, 
    signInWithGoogle, 
    signInWithApple, 
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