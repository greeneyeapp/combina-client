// components/NavigationGuard.tsx - OAuth callback sırasında tamamen pasif

import { useEffect, useState } from 'react';
import { router, useSegments, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function NavigationGuard() {
  const { user, isInitialized, loading } = useAuth();
  const segments = useSegments();
  const params = useLocalSearchParams();
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);

  // OAuth progress tracking
  useEffect(() => {
    const isOAuthCallback = !!(
      params.code || 
      params.access_token || 
      params.state || 
      params.error ||
      params.authorization_code
    );

    if (isOAuthCallback) {
      console.log('🔄 NavigationGuard: OAuth callback detected, disabling navigation for 5 seconds');
      setIsOAuthInProgress(true);
      
      // OAuth işlemi için 5 saniye bekle
      const timer = setTimeout(() => {
        console.log('✅ NavigationGuard: OAuth cooldown period ended');
        setIsOAuthInProgress(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [params]);

  useEffect(() => {
    if (!isInitialized || loading) return;

    const currentPath = segments.join('/');
    const inAuthGroup = segments[0] === '(auth)';
    
    // DÜZELTME: OAuth callback sırasında NavigationGuard'ı kapat
    if (isOAuthInProgress) {
      console.log('⏸️ NavigationGuard DISABLED - OAuth in progress');
      return;
    }
    
    // DÜZELTME: Sadece OAuth ekranlarında NavigationGuard'ı kapat (anonymous-signin hariç)
    const isOAuthScreen = currentPath.includes('google-signin') || 
                         currentPath.includes('apple-signin');
    
    if (isOAuthScreen) {
      console.log(`⏸️ NavigationGuard DISABLED - OAuth screen: ${currentPath}`);
      return;
    }

    // DÜZELTME: Complete-profile ekranında da NavigationGuard'ı kapat
    if (currentPath === '(auth)/complete-profile') {
      console.log(`⏸️ NavigationGuard DISABLED - complete-profile screen`);
      return;
    }

    // Navigation logic - sadece gerçek not-found durumları için
    const performNavigation = () => {
      if (user) {
        // User var
        if (user.profile_complete) {
          // Profile complete - home'a git
          if (inAuthGroup) {
            console.log('🏠 NavigationGuard: Profile complete, redirecting to home');
            router.replace('/(tabs)/home');
          }
        } else {
          // Profile incomplete - complete-profile'a git
          if (currentPath !== '(auth)/complete-profile') {
            console.log('📝 NavigationGuard: Profile incomplete, redirecting to complete-profile');
            router.replace('/(auth)/complete-profile');
          }
        }
      } else {
        // User yok - auth'a git (ama OAuth sırasında değil)
        if (!inAuthGroup && !isOAuthInProgress) {
          console.log('🚪 NavigationGuard: No user, redirecting to auth');
          router.replace('/(auth)');
        }
      }
    };

    // Longer delay to avoid race conditions
    const timer = setTimeout(performNavigation, 1500);
    return () => clearTimeout(timer);

  }, [user?.profile_complete, user?.uid, segments.join('/'), isInitialized, loading, isOAuthInProgress]);

  return null;
}