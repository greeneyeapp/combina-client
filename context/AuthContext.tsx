// context/AuthContext.tsx - Yönlendirme yarış durumu düzeltildi

import React from 'react';
import { useApiAuthStore } from '@/store/apiAuthStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { fetchUserProfile } from '@/services/userService';
import axios from 'axios';
import API_URL from '@/config';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useRootNavigationState, useSegments } from 'expo-router';
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
  
  // DÜZELTME: Navigation state için yeni state'ler
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [pendingNavigation, setPendingNavigation] = React.useState<string | null>(null);

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
      console.log('🔐 Initializing auth session...');
      try {
        if (jwt) {
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
            isAnonymous: profileData.isAnonymous || false,
            profile_complete: profileData.profile_complete === true,
          };
          setUser(completeUserInfo);
          await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
          console.log('✅ Token validated, user profile is fresh.');
          
          // DÜZELTME: Sadece non-anonymous kullanıcılar için RevenueCat login
          if (completeUserInfo.uid && !completeUserInfo.isAnonymous) {
            await Purchases.logIn(completeUserInfo.uid).catch(e => console.warn('RC login failed during init:', e));
          } else if (completeUserInfo.isAnonymous) {
            console.log('📋 Skipping RevenueCat login for anonymous user');
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
        console.log('✅ Auth initialization completed.');
      }
    };
    initializeAuth();
  }, [isReady, jwt, isInitialized]);

  // DÜZELTME: Aggressive navigation flag reset - güvenlik önlemi
  React.useEffect(() => {
    // Navigation flag'i çok uzun süre takılı kalmasın
    const clearStuckNavigation = setInterval(() => {
      if (isNavigating) {
        console.log('🔧 Force clearing stuck navigation flag');
        setIsNavigating(false);
        setPendingNavigation(null);
      }
    }, 2000); // 2 saniyede bir kontrol et

    return () => clearInterval(clearStuckNavigation);
  }, [isNavigating]);

  // DÜZELTME: User state değişimlerini izle - provider'a göre farklı handling
  React.useEffect(() => {
    // User state değiştiğinde navigation'ı resetle
    if (user && jwt) {
      const isOAuthProvider = user.provider === 'google' || user.provider === 'apple';
      
      if (isOAuthProvider) {
        console.log(`👤 OAuth user (${user.provider}) state changed, gentle navigation reset`);
        // OAuth için daha nazik reset - sadece pending'i temizle
        setPendingNavigation(null);
        // isNavigating'i hemen temizleme, biraz bekle
        setTimeout(() => {
          setIsNavigating(false);
        }, 100);
      } else {
        console.log(`👤 ${user.provider || 'unknown'} user state changed, resetting navigation flags`);
        setIsNavigating(false);
        setPendingNavigation(null);
      }
    }
  }, [user?.uid, user?.profile_complete, user?.provider, jwt]);

  // DÜZELTME: Navigation effect'i - OAuth sign-in sürecini koru
  React.useEffect(() => {
    if (!navigationState?.key || !isInitialized || loading) {
      return;
    }

    // DÜZELTME: OAuth sign-in sürecindeyse navigation'ı tetikleme
    const currentPath = segments.join('/');
    const isOAuthSignInInProgress = currentPath.includes('google-signin') || currentPath.includes('apple-signin');
    
    if (isOAuthSignInInProgress && !user) {
      console.log('⏳ OAuth sign-in in progress, skipping navigation...');
      return;
    }

    // DÜZELTME: Provider'a göre farklı debounce süreleri
    const getDebounceTime = () => {
      if (user?.provider === 'google' || user?.provider === 'apple') {
        return 500; // OAuth providers için daha uzun bekle
      }
      if (user?.provider === 'anonymous') {
        return 200; // Anonymous için hızlı
      }
      return 300; // Diğerleri için orta
    };

    const navigationTimer = setTimeout(() => {
      performNavigation();
    }, getDebounceTime());

    return () => clearTimeout(navigationTimer);
  }, [
    user?.profile_complete, 
    user?.uid, 
    jwt, 
    segments.join('/'),
    navigationState?.key, 
    isInitialized,
    loading,
    user?.provider
  ]);

  const performNavigation = async () => {
    const inAuthGroup = segments[0] === '(auth)';
    const currentPath = segments.join('/');

    console.log('🧭 Navigation check:', {
      currentPath,
      inAuthGroup,
      hasUser: !!user,
      hasJwt: !!jwt,
      profileComplete: user?.profile_complete,
      isAnonymous: user?.isAnonymous,
      userUid: user?.uid,
      provider: user?.provider,
      isNavigating
    });

    // DÜZELTME: OAuth providers için özel handling
    const isOAuthProvider = user?.provider === 'google' || user?.provider === 'apple';
    
    if (isNavigating) {
      if (isOAuthProvider) {
        console.log('🚫 OAuth navigation in progress, waiting once...');
        return;
      } else {
        console.log('🚫 Navigation already in progress, force resetting and continuing...');
        setIsNavigating(false);
        setPendingNavigation(null);
      }
    }
    
    setIsNavigating(true);
    
    try {
      if (user && jwt) {
        // DÜZELTME: OAuth providers için ekstra kontrol
        if (isOAuthProvider && !user.profile_complete && user.profile_complete !== false) {
          console.log('⏳ OAuth user profile still loading, waiting...');
          return;
        }

        if (user.profile_complete === true) {
          // Profil tamamlanmış - ana uygulamaya yönlendir
          if (inAuthGroup) {
            console.log(`🏠 Profile complete (${user.provider}). Redirecting to home.`);
            router.replace('/(tabs)/home');
          }
        } else {
          // DÜZELTME: Profil tamamlanmamış - complete-profile'a yönlendir
          if (currentPath !== '(auth)/complete-profile') {
            console.log(`📝 Profile incomplete (${user.provider}). Redirecting to complete-profile.`);
            router.replace('/(auth)/complete-profile');
          } else {
            console.log('📍 Already on complete-profile page');
          }
        }
      } else {
        // DÜZELTME: OAuth sign-in sürecindeyse auth/index'e gitme
        const isOAuthSignInInProgress = currentPath.includes('google-signin') || currentPath.includes('apple-signin');
        
        if (!inAuthGroup && !isOAuthSignInInProgress) {
          console.log('🚪 No user found. Redirecting to auth screen.');
          router.replace('/(auth)');
        } else if (isOAuthSignInInProgress) {
          console.log('⏳ OAuth sign-in in progress, staying put...');
          // OAuth sign-in sürecinde yönlendirme yapma
        }
      }
    } catch (error) {
      console.error('❌ Navigation error:', error);
    } finally {
      // DÜZELTME: Provider'a göre farklı cleanup süreleri
      const cleanupTime = isOAuthProvider ? 200 : 50;
      setTimeout(() => {
        setIsNavigating(false);
        setPendingNavigation(null);
        console.log(`🔓 Navigation flags cleared (${user?.provider || 'unknown'})`);
      }, cleanupTime);
    }
  };

  const signInAnonymously = async (userData: any) => {
    try {
      // DÜZELTME: Sign-in başlamadan önce navigation state'ini temizle
      setIsNavigating(false);
      setPendingNavigation(null);
      
      // DÜZELTME: Anonymous ID'yi doğrudan userData'dan al (component'ten geliyor)
      const existingAnonymousId = userData.anonymous_id;
      console.log(`🆔 Anonymous sign-in request:`, {
        providedId: existingAnonymousId,
        hasId: !!existingAnonymousId,
        language: userData.language,
        gender: userData.gender
      });
      
      const response = await axios.post(`${API_URL}/auth/anonymous`, {
        session_id: 'mobile_app',
        language: userData.language,
        gender: userData.gender,
        anonymous_id: existingAnonymousId // Component'ten gelen ID'yi kullan
      }, { timeout: 30000 });
      
      const { access_token, user_info } = response.data;
      await setJwt(access_token);
      
      // DÜZELTME: Anonymous ID güncellemesi - backend'den gelen ID'yi sakla
      if (user_info.user_id) {
        if (user_info.user_id !== existingAnonymousId) {
          await AsyncStorage.setItem(ANONYMOUS_USER_ID_KEY, user_info.user_id);
          console.log(`📝 Stored new anonymous ID: ${user_info.user_id}`);
        } else {
          console.log(`🔄 Using existing anonymous ID: ${user_info.user_id}`);
        }
      }
      
      const completeUserInfo = {
        uid: user_info.user_id,
        name: user_info.fullname || i18n.t('profile.guest'),
        fullname: user_info.fullname || i18n.t('profile.guest'),
        displayName: user_info.fullname || i18n.t('profile.guest'),
        email: '',
        gender: user_info.gender || 'unisex',
        plan: user_info.plan || 'anonymous',
        provider: 'anonymous',
        isAnonymous: true,
        profile_complete: user_info.profile_complete === true
      };
      
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(completeUserInfo));
      setUser(completeUserInfo);
      
      // DÜZELTME: User set edildikten sonra navigation'ı tekrar temizle
      setTimeout(() => {
        setIsNavigating(false);
        setPendingNavigation(null);
      }, 100);
      
      // DÜZELTME: Backend yanıtına göre log mesajı
      const wasResumed = existingAnonymousId && user_info.user_id === existingAnonymousId;
      console.log(`✅ Anonymous session ${wasResumed ? 'resumed' : 'created'}.`);
      
      return completeUserInfo;
    } catch (error) {
      console.error('❌ ANONYMOUS SIGN-IN ERROR:', error);
      await clearJwt();
      setUser(null);
      throw error;
    }
  };

  const signInWithGoogle = async (accessToken: string) => {
    try {
      console.log('🔄 Starting Google sign-in process...');
      
      let response;
      if (user?.isAnonymous) {
        console.log('🔄 Converting anonymous user to Google authenticated user...');
        response = await axios.post(`${API_URL}/auth/convert-anonymous`, {
          oauth_token: accessToken, provider: 'google'
        }, { headers: { Authorization: `Bearer ${jwt}` }, timeout: 30000 });
        await AsyncStorage.removeItem(ANONYMOUS_USER_ID_KEY);
        console.log('🧹 Cleared anonymous ID after account conversion.');
      } else {
        console.log('🔄 Normal Google sign-in...');
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
      
      console.log('✅ Google user created, setting user state...');
      setUser(completeUserInfo);
      
      if (user_info?.uid) {
        await Purchases.logIn(user_info.uid).catch(e => console.warn('⚠️ Google RC login failed:', e));
      }
      
      console.log(`✅ Google sign-in completed. Profile complete: ${completeUserInfo.profile_complete}`);
      return completeUserInfo;
    } catch (error) {
      console.error('❌ GOOGLE SIGN-IN ERROR:', error);
      throw error;
    }
  };

  const signInWithApple = async (credential: any) => {
    try {
      console.log('🔄 Starting Apple sign-in process...');
      
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
      
      console.log('✅ Apple user created, setting user state...');
      setUser(completeUserInfo);
      
      if (user_info.uid) {
        await Purchases.logIn(user_info.uid).catch(e => console.warn('⚠️ Apple RC login failed:', e));
      }
      
      console.log(`✅ Apple sign-in completed. Profile complete: ${completeUserInfo.profile_complete}`);
      return completeUserInfo;
    } catch (error) {
      console.error('❌ APPLE SIGN-IN ERROR:', error);
      throw error;
    }
  };

  const updateUserInfo = async (info: { name: string; gender: string }): Promise<any> => {
    try {
      const token = useApiAuthStore.getState().jwt;
      if (!token) throw new Error("No token found");
      console.log('🚀 Updating user info via API for user:', user?.uid);
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
      console.log('✅ User info updated successfully. New state:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Update user info error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      const isAnon = user?.isAnonymous;
      const currentAnonymousId = isAnon ? user?.uid : null;
      
      // DÜZELTME: Logout başında navigation'ı temizle
      setIsNavigating(false);
      setPendingNavigation(null);
      
      setUser(null);
      await clearJwt();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
      apiDeduplicator.clearCache();
      setLastProfileRefresh(0);
      clearUserPlan();
      
      // DÜZELTME: Anonymous kullanıcı logout'unda ID'yi KOR
      if (isAnon && currentAnonymousId) {
        console.log(`🔄 Preserving anonymous ID for future login: ${currentAnonymousId}`);
        // Anonymous ID'yi koruyoruz - logout sonrası tekrar giriş için
        // ANONYMOUS_USER_ID_KEY'i SİLME!
      } else {
        // Normal authenticated kullanıcı - tüm verileri temizle
        await AsyncStorage.removeItem(ANONYMOUS_USER_ID_KEY);
        await Purchases.logOut().catch(e => console.log('⚠️ RC logout error (expected):', e));
        console.log('🧹 Cleared all user data including anonymous ID');
      }
      
      console.log('✅ Logout process completed');
    } catch (error) {
      console.error("🚨 Logout Error:", error);
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