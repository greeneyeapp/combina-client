import React, { useEffect } from 'react';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/locales/i18n';
import { useAuth } from '@/context/AuthContext';
import { AuthProvider } from '@/context/AuthContext';
import CustomAlert from '@/components/common/CustomAlert';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import CustomToast from '@/components/common/CustomToast';
import Purchases from 'react-native-purchases';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import OnboardingGuide from '@/components/onboarding/OnboardingGuide';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav(): React.JSX.Element | null {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const shouldUseRevenueCat = user && !user.isAnonymous && Platform.OS === 'ios';
  const revenueCatState = useRevenueCat();

  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });

  useEffect(() => {
    const isReady = (fontsLoaded || fontError) && !loading && navigationState?.key;
    if (!isReady) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (user && inAuthGroup) {
      if (user.isAnonymous || user.emailVerified) {
        router.replace('/(tabs)/wardrobe');
      }
    } else if (!user && inTabsGroup) {
      router.replace('/(auth)');
    }
  }, [user, segments, loading, fontsLoaded, fontError, navigationState?.key]);

  useEffect(() => {
    if (shouldUseRevenueCat && !revenueCatState.isLoading) {
      console.log('RevenueCat Status:', {
        isProUser: revenueCatState.isProUser,
        currentPlan: revenueCatState.currentPlan,
        activeEntitlements: Object.keys(revenueCatState.activeEntitlements),
      });
    }
  }, [shouldUseRevenueCat, revenueCatState.isLoading, revenueCatState.currentPlan]);

  if (!fontsLoaded || fontError || loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout(): React.JSX.Element {
  const toastConfig: Record<string, (props: BaseToastProps) => React.JSX.Element> = {
    success: (props) => <CustomToast {...props} type="success" />,
    info: (props) => <CustomToast {...props} type="info" />,
    error: (props) => <CustomToast {...props} type="error" />,
  };

  // Dil ayarını başlat
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Önce kayıtlı dil tercihini kontrol et
        const savedLanguage = await AsyncStorage.getItem('app_language');

        if (savedLanguage) {
          // Kullanıcı daha önce bir dil seçmişse onu kullan
          await i18n.changeLanguage(savedLanguage);
        } else {
          // Kayıtlı dil yoksa telefon dilini kullan
          const deviceLanguage = Localization.locale;
          const languageCode = deviceLanguage.split('-')[0]; // 'tr-TR' -> 'tr'

          // Desteklenen diller listesi (i18n konfigürasyonunuza göre güncelleyin)
          const supportedLanguages = ['en', 'tr']; // Bu listeyi desteklediğiniz dillere göre güncelleyin

          const finalLanguage = supportedLanguages.includes(languageCode)
            ? languageCode
            : 'en'; // Varsayılan dil

          await i18n.changeLanguage(finalLanguage);
          // İlk kez ayarlanan dili kaydet
          await AsyncStorage.setItem('app_language', finalLanguage);
          console.log('Device language applied:', finalLanguage, 'from device locale:', deviceLanguage);
        }
      } catch (error) {
        console.error('Language initialization error:', error);
        // Hata durumunda varsayılan dil
        await i18n.changeLanguage('en');
      }
    };

    initializeLanguage();
  }, []);

  useEffect(() => {
    const initializePurchases = async () => {
      const apiKey = Platform.select({
        ios: 'appl_DuXXAykkepzomdHesCIharljFmd',
        android: 'goog_PDkLWblJuhcgbNKkgItuNKxVkZh',
      });

      if (!apiKey) {
        console.log("No RevenueCat API key found for this platform.");
        return;
      }

      try {
        await Purchases.configure({ apiKey });
        console.log('RevenueCat initialized successfully');
      } catch (error) {
        if (Platform.OS === 'android') {
          console.error('RevenueCat initialization failed on Android:', error);
        } else if (Platform.OS === 'ios') {
          console.error('RevenueCat initialization failed on iOS:', error);
        } else {
          console.error('RevenueCat initialization failed:', error);
        }
      }
    };

    initializePurchases();
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
            <CustomAlert />
            <Toast config={toastConfig} />
            <OnboardingGuide />
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