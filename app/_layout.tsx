import React, { useEffect, useState } from 'react';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/locales/i18n';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useOnboardingStore } from '@/store/onboardingStore';
import CustomAlert from '@/components/common/CustomAlert';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import CustomToast from '@/components/common/CustomToast';
import Purchases from 'react-native-purchases';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingGuide from '@/components/onboarding/OnboardingGuide';
import { initializeApp } from '@/utils/appInitialization';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav(): React.JSX.Element | null {
  const { user, loading: authLoading, isAuthFlowActive } = useAuth();
  const { checkIfOnboardingCompleted, startOnboarding } = useOnboardingStore();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });

  useEffect(() => {
    const isAppReady = (fontsLoaded || fontError) && !authLoading && navigationState?.key;
    if (!isAppReady) return;

    console.log('🔍 Navigation check - Current segments:', segments);
    console.log('🔍 Navigation check - User:', !!user);
    console.log('🔍 Navigation check - Auth flow active:', isAuthFlowActive);

    const inAuthGroup = segments[0] === '(auth)';
    const isNotFoundPage = segments.includes('+not-found');
    const isGoogleSignIn = segments.includes('google-signin');
    const isCompleteProfile = segments.includes('complete-profile');

    // Google sign-in sayfasındayken auth flow aktifse navigation'ı engelle
    if (isGoogleSignIn && isAuthFlowActive) {
      console.log('⏸️ On Google sign-in page with active auth flow, waiting...');
      return;
    }

    // Not-found sayfasındaysak ve auth flow aktif değilse yönlendir
    if (isNotFoundPage && !isAuthFlowActive) {
      console.log('🔄 User on not-found page, redirecting...');
      
      if (user) {
        const hasGender = user.gender && user.gender !== null && user.gender !== '';
        const hasBirthDate = user.birthDate && user.birthDate !== null && user.birthDate !== '';
        if (!hasGender || !hasBirthDate) {
          router.replace('/(auth)/complete-profile');
        } else {
          router.replace('/(tabs)/wardrobe');
        }
      } else {
        router.replace('/(auth)');
      }
      SplashScreen.hideAsync();
      return;
    }

    if (user) {
      const hasGender = user.gender && user.gender !== null && user.gender !== '';
      const hasBirthDate = user.birthDate && user.birthDate !== null && user.birthDate !== '';
      
      // Complete profile sayfasındaysa navigation'ı engelle
      if (isCompleteProfile) {
        console.log('📝 On complete-profile page, staying here');
        return;
      }
      
      if (inAuthGroup && !isGoogleSignIn && !isCompleteProfile) {
        if (!hasGender || !hasBirthDate) {
          console.log('🔄 User logged in but profile incomplete, redirecting to complete-profile');
          router.replace('/(auth)/complete-profile');
        } else {
          console.log('🔄 User logged in and profile complete, redirecting to wardrobe');
          router.replace('/(tabs)/wardrobe');
          
          // Onboarding kontrolü
          setTimeout(async () => {
            try {
              const isCompleted = await checkIfOnboardingCompleted();
              if (!isCompleted) {
                console.log('🎯 Starting onboarding for first time user');
                startOnboarding();
              }
            } catch (error) {
              console.error('Error checking onboarding:', error);
            }
          }, 1000);
        }
      }
    } else {
      if (!inAuthGroup && !authLoading) {
        console.log('🔄 No user, redirecting to auth index');
        router.replace('/(auth)');
      }
    }
    
    SplashScreen.hideAsync();
  }, [user, segments, authLoading, fontsLoaded, fontError, navigationState?.key, isAuthFlowActive]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <OnboardingGuide />
    </>
  );
}

export default function RootLayout(): React.JSX.Element {
  const [servicesInitialized, setServicesInitialized] = useState(false);
  const toastConfig: Record<string, (props: BaseToastProps) => React.JSX.Element> = {
    success: (props) => <CustomToast {...props} type="success" />,
    info: (props) => <CustomToast {...props} type="info" />,
    error: (props) => <CustomToast {...props} type="error" />,
  };

  useEffect(() => {
    const initializeAppServices = async () => {
      try {
        const langPromise = (async () => {
          const savedLanguage = await AsyncStorage.getItem('app_language');
          if (savedLanguage) { await i18n.changeLanguage(savedLanguage); }
          else {
            const deviceLanguage = Localization.getLocales()[0].languageCode;
            const supportedLanguages = ['en', 'tr'];
            const finalLanguage = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en';
            await i18n.changeLanguage(finalLanguage);
            await AsyncStorage.setItem('app_language', finalLanguage);
          }
        })();
        const purchasesPromise = (async () => {
          const apiKey = Platform.select({ ios: 'appl_DuXXAykkepzomdHesCIharljFmd', android: 'goog_PDkLWblJUhcgbNKkgItuNKXvkZh' });
          if (apiKey) { await Purchases.configure({ apiKey }); console.log(`RevenueCat initialized successfully for ${Platform.OS}`); }
        })();
        const appInitPromise = initializeApp();
        await Promise.all([langPromise, purchasesPromise, appInitPromise]);
      } catch (error) {
        console.error('Failed to initialize app services:', error);
      } finally {
        setServicesInitialized(true);
      }
    };
    initializeAppServices();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
            <CustomAlert />
            <Toast config={toastConfig} />
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