// context/AuthContext.tsx - Login persist sorunu düzeltilmiş versiyon

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

// DÜZELTME: Global state'i component içine taşıdık
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAuthFlowActive, setAuthFlowActive] = React.useState(false);
  
  // DÜZELTME: Component-level initialization tracking
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

  // DÜZELTME: Ana initialization effect'i sadece bir kez çalışacak şekilde düzenledik
  React.useEffect(() => {
    // DÜZELTME: Sadece isReady true olduğunda ve henüz initialize olmadığında çalıştır
    if (!isReady || isInitialized) return;

    const initializeAuth = async () => {
      console.log('🔐 Initializing auth...', { jwt: !!jwt });
      
      setIsInitialized(true); // DÜZELTME: Hemen başta set et

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
              // RevenueCat hatası fatal değil, devam et
            }
          }

        } catch (error) {
          console.error('🚨 Critical auth validation failed:', error);
          // DÜZELTME: Kritik hata durumunda temizlik yap ama loading'i false yap
          await clearJwt();
          clearUserPlan();
          setUser(null);
          await AsyncStorage.removeItem(USER_CACHE_KEY);
          setLoading(false);
          return;
        }
        
        // Background'da profile refresh (hata olsa bile devam et)
        if (finalUser && finalUser.uid) {
          try {
            console.log('🔄 Refreshing user profile in background...');
            await initializeUserProfile();
          } catch (profileError) {
            console.warn('Could not refresh user profile on startup:', profileError);
            // Profile refresh hatası kritik değil, cached data ile devam et
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
  }, [isReady]); // DÜZELTME: Sadece isReady bağımlılığı

  const signInWithGoogle = async (accessToken: string) => {
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/google`, { access_token: accessToken }, { timeout: 30000 });
      const { access_token, user_info } = response.data;
      
      // DÜZELTME: Backend response'unu log'la
      console.log('🔍 Backend response user_info:', JSON.stringify(user_info, null, 2));
      
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

      console.log('🔍 Created user object:', JSON.stringify(completeUserInfo, null, 2));

      // DÜZELTME: Önce JWT'yi set et, sonra user'ı set et
      await setJwt(access_token);
      console.log('✅ JWT token set successfully');
      
      // DÜZELTME: Cache'e kaydet
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      console.log('✅ User data cached successfully');
      
      // DÜZELTME: Son olarak user state'i set et (navigation trigger'ı)
      setUser(completeUserInfo);
      console.log('✅ User state set successfully');
      
      // RevenueCat login (non-blocking)
      if (user_info?.uid) {
        try {
          await Purchases.logIn(user_info.uid);
          console.log('✅ RevenueCat login successful');
        } catch (revenueCatError) {
          console.warn('⚠️ RevenueCat login failed:', revenueCatError);
        }
      }

      // Profile refresh (throttled)
      const now = Date.now();
      if (now - lastProfileRefresh > 60000) { // 1 dakika throttle
        setLastProfileRefresh(now);
        try {
          // DÜZELTME: Direkt fetchUserProfile kullan ve user state'i güncelle
          console.log('🔄 Fetching user profile to complete user data...');
          
          // Import gerekli: import { fetchUserProfile } from '@/services/userService';
          const { fetchUserProfile } = await import('@/services/userService');
          const profileData = await fetchUserProfile();
          
          if (profileData) {
            const updatedUserInfo = {
              ...completeUserInfo,
              gender: profileData.gender || completeUserInfo.gender,
              // DÜZELTME: created_at değil, orijinal birthDate'i koru
              birthDate: completeUserInfo.birthDate, // Backend'den ilk gelen doğru
              fullname: profileData.fullname || completeUserInfo.fullname,
            };
            
            console.log('🔄 Updating user state with profile data:', {
              gender: updatedUserInfo.gender,
              birthDate: updatedUserInfo.birthDate,
              originalBirthDate: completeUserInfo.birthDate,
              profileDataKeys: Object.keys(profileData)
            });
            
            // DÜZELTME: User state'i güncelle ve navigation'ı tetikle
            setUser(updatedUserInfo);
            await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUserInfo));
          }
        } catch (profileError) {
          console.warn('⚠️ Profile refresh failed during sign in:', profileError);
          // Profile fetch hata verirse de navigation çalışsın
        }
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
        try {
          await Purchases.logIn(user_info.uid);
        } catch (revenueCatError) {
          console.warn('RevenueCat login failed during Apple sign in:', revenueCatError);
        }
      }

      // Profile refresh (throttled)
      const now = Date.now();
      if (now - lastProfileRefresh > 60000) { // 1 dakika throttle
        setLastProfileRefresh(now);
        try {
          await initializeUserProfile();
        } catch (profileError) {
          console.warn('Profile refresh failed during Apple sign in:', profileError);
        }
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

      setUser(null);
      clearUserPlan();
      await clearJwt();
      await AsyncStorage.removeItem(USER_CACHE_KEY);

      // DÜZELTME: Local state'i de sıfırla
      setIsInitialized(false);
      setLastProfileRefresh(0);

      try {
        await Purchases.logOut();
        console.log('✅ RevenueCat logout successful');
      } catch (revenueCatError) {
        console.log('⚠️ RevenueCat logout error (expected):', revenueCatError);
      }

      router.replace('/(auth)');

    } catch (error) {
      console.error("🚨 Logout Error:", error);
      setUser(null);
      clearUserPlan();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      setIsInitialized(false);
      setLastProfileRefresh(0);
      router.replace('/(auth)');
    }
  };

  const refreshUserProfile = async () => {
    const now = Date.now();
    if (now - lastProfileRefresh < 60000) { // 1 dakika throttle
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

  // Navigation logic - DÜZELTME: Sıralama ve delay eklendi
  React.useEffect(() => {
    if (!navigationState?.key || loading || isAuthFlowActive) return;

    // DÜZELTME: JWT ve user state'in sync olmasını bekle
    const handleNavigation = () => {
      const inAuthGroup = segments[0] === '(auth)';

      console.log('🔍 Navigation Debug:', {
        user: !!user,
        jwt: !!jwt,
        userGender: user?.gender,
        userBirthDate: user?.birthDate,
        segments: segments,
        inAuthGroup: inAuthGroup
      });

      if (user && jwt) {
        console.log('🚀 Navigation: User and JWT available, checking profile completion...');
        const profileComplete = user.gender && user.birthDate;
        
        console.log('🔍 Profile completeness check:', {
          gender: user.gender,
          birthDate: user.birthDate,
          profileComplete: profileComplete
        });
        
        if (!profileComplete && segments[1] !== 'complete-profile') {
          console.log('📝 Navigation: Profile incomplete, redirecting to complete-profile');
          router.replace('/(auth)/complete-profile');
        } else if (profileComplete && inAuthGroup) {
          console.log('🏠 Navigation: Profile complete, redirecting to home');
          router.replace('/(tabs)/home');
        } else if (profileComplete && !inAuthGroup) {
          console.log('✅ Navigation: Already in correct location (home)');
        } else {
          console.log('🔄 Navigation: Waiting for profile completion flow');
        }
      } else if (!user && !jwt && !inAuthGroup) {
        console.log('🔐 Navigation: No user/JWT, redirecting to auth');
        router.replace('/(auth)');
      } else {
        console.log('⏳ Navigation: Waiting for user/JWT to be available');
      }
    };

    // DÜZELTME: Biraz delay ekle ki JWT set olabilsin
    const timer = setTimeout(handleNavigation, 100);
    return () => clearTimeout(timer);
    
  }, [user, jwt, loading, isAuthFlowActive, segments, navigationState?.key]);

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