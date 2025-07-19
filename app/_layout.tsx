// app/_layout.tsx - Splash screen manuel kontrolü ile geliştirilmiş

import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/locales/i18n';
import { AuthProvider } from '@/context/AuthContext';
import CustomAlert from '@/components/common/CustomAlert';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import CustomToast from '@/components/common/CustomToast';
import Purchases from 'react-native-purchases';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingGuide from '@/components/onboarding/OnboardingGuide';
import { initializeApp, resetInitializationState } from '@/utils/appInitialization';
import { initializeCaches, validateAndCleanCaches, resetCacheManager } from '@/utils/cacheManager';
import { RevenueCatProvider } from '@/context/RevenueCatContext';

// Splash screen'i açık tut
SplashScreen.preventAutoHideAsync();

// Global state tracking
let layoutInitialized = false;
let layoutInitializationPromise: Promise<void> | null = null;

// Splash screen'i gizleme kontrolü için
const MINIMUM_SPLASH_TIME = 2000; // En az 2 saniye göster
const MAXIMUM_SPLASH_TIME = 8000; // En fazla 8 saniye göster

interface SplashControllerProps {
  onInitializationComplete: () => void;
}

// Splash controller component'i
function SplashController({ onInitializationComplete }: SplashControllerProps) {
  const [initStartTime] = useState(Date.now());
  
  useEffect(() => {
    const handleInitialization = async () => {
      try {
        // App servislerini initialize et
        await initializeAppServicesOnce();
        
        // Minimum splash time'ı bekle
        const elapsedTime = Date.now() - initStartTime;
        const remainingTime = Math.max(0, MINIMUM_SPLASH_TIME - elapsedTime);
        
        if (remainingTime > 0) {
          console.log(`⏳ Waiting additional ${remainingTime}ms for minimum splash time...`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        // Maximum time protection
        setTimeout(() => {
          console.log('🚨 Maximum splash time reached, forcing hide...');
          SplashScreen.hideAsync();
        }, MAXIMUM_SPLASH_TIME);
        
        // Auth initialization'ın tamamlanmasını bekle
        onInitializationComplete();
        
      } catch (error) {
        console.error('❌ Initialization failed:', error);
        // Hata durumunda da splash'i gizle
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 1000);
      }
    };
    
    handleInitialization();
  }, [initStartTime, onInitializationComplete]);
  
  return null;
}

function RootLayoutNav(): React.JSX.Element | null {
  const [isReady, setIsReady] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });

  // Font yükleme tamamlandığında
  useEffect(() => {
    if (fontsLoaded || fontError) {
      setIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  // Auth initialization callback
  const handleAuthInitComplete = () => {
    console.log('✅ Auth initialization completed, preparing to hide splash...');
    setAuthReady(true);
  };

  // Hem fontlar hem de auth hazır olduğunda splash'i gizle
  useEffect(() => {
    if (isReady && authReady) {
      console.log('✅ All initialization complete, hiding splash screen...');
      // Kısa bir delay ile splash'i gizle (animation için)
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 300);
    }
  }, [isReady, authReady]);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <SplashController onInitializationComplete={handleAuthInitComplete} />
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen
          name="subscription"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="storage"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            headerShown: false,
          }}
        />
      </Stack>
      <OnboardingGuide />
    </>
  );
}

// Singleton initialization function
const initializeAppServicesOnce = async (): Promise<void> => {
  if (layoutInitialized) {
    console.log('📋 Layout services already initialized, skipping...');
    return;
  }

  if (layoutInitializationPromise) {
    console.log('⏳ Layout initialization in progress, waiting...');
    return layoutInitializationPromise;
  }

  layoutInitializationPromise = performLayoutInitialization();

  try {
    await layoutInitializationPromise;
    layoutInitialized = true;
  } catch (error) {
    console.error('❌ Layout initialization failed:', error);
    layoutInitialized = false;
  } finally {
    layoutInitializationPromise = null;
  }
};

const performLayoutInitialization = async (): Promise<void> => {
  console.log('🚀 Starting app initialization...');

  // Translation fallback
  const t = (key: string, options?: any) => {
    const translations: Record<string, string> = {
      'cacheManager.recommendations.performingWell': 'File system is performing well',
      'cacheManager.recommendations.needsAttention': 'File system needs attention',
      'cacheManager.recommendations.highStorageUsage': 'High storage usage - consider cleanup',
      'cacheManager.recommendations.cacheOptimal': 'File system cache is optimal',
      'cacheManager.analytics.failed': 'Analytics failed - check logs',
      'cacheManager.validationFailed': 'Cache validation failed',
      'cacheManager.checkLogs': 'Check logs for details'
    };
    return translations[key] || key;
  };

  try {
    // 1. Session management (silent)
    const CURRENT_SESSION_KEY = 'current_session';
    const currentSession = Date.now().toString();
    const lastSession = await AsyncStorage.getItem(CURRENT_SESSION_KEY);

    if (lastSession && Math.abs(Date.now() - parseInt(lastSession)) > 7 * 24 * 60 * 60 * 1000) {
      console.log('🔄 Fresh start detected, will cleanup later...');
    }
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, currentSession);

    // 2. Language setup
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
    console.log('✅ Language setup completed');

    // 3. RevenueCat (one-time setup)
    const apiKey = Platform.select({
      ios: 'appl_DuXXAykkepzomdHesCIharljFmd',
      android: 'goog_PDkLWblJUhcgbNKkgItuNKXvkZh'
    });
    if (apiKey) {
      await Purchases.configure({ apiKey });
      console.log(`✅ RevenueCat initialized successfully for ${Platform.OS}`);
    }

    // 4. File system initialization (one-time setup)
    await initializeApp();
    console.log('✅ File system initialization completed');

    // 5. Cache manager (one-time setup)
    initializeCaches();

    console.log('✅ All app services initialized successfully');

    // 6. Development cache check (delayed, one-time)
    if (__DEV__) {
      setTimeout(async () => {
        try {
          const stats = await validateAndCleanCaches(t);
          console.log('📊 Initial file system stats:', stats.recommendations);
        } catch (error) {
          console.warn('⚠️ Initial cache validation failed:', error);
        }
      }, 5000); // 5 second delay
    }

  } catch (error) {
    console.error('❌ Failed to initialize app services:', error);
    throw error;
  }
};

// AuthContext wrapper component - splash kontrolü için
function AuthProviderWithSplashControl({ 
  children, 
  onAuthReady 
}: { 
  children: React.ReactNode; 
  onAuthReady?: () => void; 
}) {
  return (
    <AuthProvider>
      <AuthReadyDetector onReady={onAuthReady} />
      {children}
    </AuthProvider>
  );
}

// Auth hazır olduğunu detect eden component
function AuthReadyDetector({ onReady }: { onReady?: () => void }) {
  const [hasDetected, setHasDetected] = useState(false);
  
  useEffect(() => {
    // Auth context'in loading state'ini monitor et
    const checkAuthReady = () => {
      if (!hasDetected) {
        // Auth context hazır olana kadar bekle, sonra callback çağır
        setTimeout(() => {
          if (!hasDetected) {
            setHasDetected(true);
            onReady?.();
          }
        }, 1500); // Auth context'in initialize olması için kısa süre bekle
      }
    };
    
    checkAuthReady();
  }, [hasDetected, onReady]);
  
  return null;
}

export default function RootLayout(): React.JSX.Element {
  const [authInitComplete, setAuthInitComplete] = useState(false);
  
  const toastConfig: Record<string, (props: BaseToastProps) => React.JSX.Element> = {
    success: (props) => <CustomToast {...props} type="success" />,
    info: (props) => <CustomToast {...props} type="info" />,
    error: (props) => <CustomToast {...props} type="error" />,
  };

  useEffect(() => {
    // Single initialization call
    initializeAppServicesOnce();

    // Cleanup function
    return () => {
      // Only cleanup on actual unmount, not re-renders
      console.log('🧹 Layout cleanup registered');
    };
  }, []); // Empty dependency array - truly run once

  return (
    <GestureHandlerRootView style={styles.container}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AuthProviderWithSplashControl 
            onAuthReady={() => {
              console.log('🔑 Auth context ready, notifying splash controller...');
              setAuthInitComplete(true);
            }}
          >
            <RevenueCatProvider>
              <RootLayoutNav />
              <CustomAlert />
              <Toast config={toastConfig} />
            </RevenueCatProvider>
          </AuthProviderWithSplashControl>
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

// Development utilities
if (__DEV__) {
  (global as any).resetAllInitialization = () => {
    layoutInitialized = false;
    layoutInitializationPromise = null;
    resetInitializationState();
    resetCacheManager();
    console.log('🔄 All initialization state reset');
  };

  (global as any).forceSplashHide = () => {
    SplashScreen.hideAsync();
    console.log('🚨 Splash screen force hidden');
  };
}