// app/_layout.tsx - File system based image storage + Cache Manager

import React, { useEffect } from 'react';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/locales/i18n';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import CustomAlert from '@/components/common/CustomAlert';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import CustomToast from '@/components/common/CustomToast';
import Purchases from 'react-native-purchases';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingGuide from '@/components/onboarding/OnboardingGuide';
import { initializeApp } from '@/utils/appInitialization';
import { initializeCaches, validateAndCleanCaches } from '@/utils/cacheManager';
import { RevenueCatProvider } from '@/context/RevenueCatContext'; // YENİ IMPORT

SplashScreen.preventAutoHideAsync();

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

    if (authLoading || isAuthFlowActive) return;

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

function RootLayoutNav(): React.JSX.Element | null {
  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });

  useProtectedRouter();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <OnboardingGuide />
    </>
  );
}

export default function RootLayout(): React.JSX.Element {
  const toastConfig: Record<string, (props: BaseToastProps) => React.JSX.Element> = {
    success: (props) => <CustomToast {...props} type="success" />,
    info: (props) => <CustomToast {...props} type="info" />,
    error: (props) => <CustomToast {...props} type="error" />,
  };

  useEffect(() => {
    let cacheMonitorCleanup: (() => void) | undefined;

    const initializeAppServices = async () => {
      try {
        console.log('🚀 Starting app initialization...');

        // Simple translation fallback for layout context
        const t = (key: string, options?: any) => {
          // Fallback translation for cache manager in layout
          const translations: Record<string, string> = {
            'cacheManager.recommendations.performingWell': 'File system is performing well',
            'cacheManager.recommendations.needsAttention': 'File system needs attention',
            'cacheManager.recommendations.highStorageUsage': 'High storage usage - consider cleanup',
            'cacheManager.recommendations.cacheOptimal': 'File system cache is optimal',
            'cacheManager.analytics.failed': 'Analytics failed - check logs'
          };
          return translations[key] || key;
        };

        // 1. App restart check (simplified)
        const CURRENT_SESSION_KEY = 'current_session';
        const currentSession = Date.now().toString();
        const lastSession = await AsyncStorage.getItem(CURRENT_SESSION_KEY);

        if (lastSession && Math.abs(Date.now() - parseInt(lastSession)) > 7 * 24 * 60 * 60 * 1000) {
          console.log('🔄 Fresh start detected, reinitializing...');
          // File system cache'ini temizle fresh start'ta
          const cacheStats = await validateAndCleanCaches(t);
          console.log('🧹 Fresh start cleanup:', cacheStats.recommendations);
        }

        await AsyncStorage.setItem(CURRENT_SESSION_KEY, currentSession);

        // 2. Language setup
        const langPromise = (async () => {
          const savedLanguage = await AsyncStorage.getItem('app_language');
          if (savedLanguage) {
            await i18n.changeLanguage(savedLanguage);
          } else {
            const supportedLanguages = [
              'ar', 'bg', 'de', 'el', 'en', 'es', 'fr', 'he', 'hi',
              'id', 'it', 'ja', 'ko', 'pt', 'ru', 'tl', 'tr', 'zh'
            ];
            const deviceLanguageCode = Localization.getLocales()[0]?.languageCode ?? 'en';
            const finalLanguage = supportedLanguages.includes(deviceLanguageCode)
              ? deviceLanguageCode
              : 'en';
            await i18n.changeLanguage(finalLanguage);
            await AsyncStorage.setItem('app_language', finalLanguage);
          }
        })();

        // 3. RevenueCat configuration
        const purchasesPromise = (async () => {
          const apiKey = Platform.select({
            ios: 'appl_DuXXAykkepzomdHesCIharljFmd',
            android: 'goog_PDkLWblJUhcgbNKkgItuNKXvkZh'
          });
          if (apiKey) {
            await Purchases.configure({ apiKey });
            console.log(`✅ RevenueCat initialized successfully for ${Platform.OS}`);
          }
        })();

        // 4. File system based image storage initialization
        const appInitPromise = initializeApp();

        // 5. File system cache manager initialization
        const cacheInitPromise = (async () => {
          console.log('🗄️ Initializing file system cache manager...');
          cacheMonitorCleanup = initializeCaches();

          // Development'ta cache durumunu log'la
          if (__DEV__) {
            setTimeout(async () => {
              const stats = await validateAndCleanCaches(t);
              console.log('📊 Initial file system stats:', stats.recommendations);
            }, 2000);
          }

          console.log('✅ File system cache manager initialized');
        })();

        // Tüm servisleri paralel olarak başlat
        await Promise.all([langPromise, purchasesPromise, appInitPromise, cacheInitPromise]);

        console.log('✅ All app services initialized successfully');

        // Development'ta periodic cache validation
        if (__DEV__) {
          const validationInterval = setInterval(async () => {
            await validateAndCleanCaches(t);
          }, 5 * 60 * 1000); // Her 5 dakikada bir

          // Cleanup function'a ekle
          const originalCleanup = cacheMonitorCleanup;
          cacheMonitorCleanup = () => {
            originalCleanup?.();
            clearInterval(validationInterval);
          };
        }

      } catch (error) {
        console.error('❌ Failed to initialize app services:', error);
      }
    };

    initializeAppServices();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up app services...');
      cacheMonitorCleanup?.();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AuthProvider>
            <RevenueCatProvider>
              <RootLayoutNav />
              <CustomAlert />
              <Toast config={toastConfig} />
            </RevenueCatProvider>
          </AuthProvider>
        </ThemeProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});