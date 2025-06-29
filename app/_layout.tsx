// kodlar/app/_layout.tsx

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

SplashScreen.preventAutoHideAsync();

function useProtectedRouter() {
  const { user, loading: authLoading, isAuthFlowActive } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    // Navigasyon hazır değilse bekle.
    if (!navigationState?.key) return;
    
    const isNotFound = segments.includes('+not-found');

    // --- İnternetten Bulunan Çözüm: GECİKMELİ YÖNLENDİRME ---
    // Eğer Expo Router yolunu şaşırıp +not-found'a düşerse,
    // bu genellikle harici bir işlemden (Google/Apple girişi) sonra olur.
    // State'in oturması için çok kısa bir gecikme ile yönlendirme yapacağız.
    if (isNotFound) {
      console.log("⚠️ Detected '+not-found' state. Applying delayed redirect based on research...");
      const timer = setTimeout(() => {
        // Gecikme sonunda, kullanıcı durumu ne ise ona göre karar ver.
        if (user) {
          const profileComplete = user.gender && user.birthDate;
          if (profileComplete) {
            router.replace('/(tabs)/wardrobe');
          } else {
            router.replace('/(auth)/complete-profile');
          }
        } else {
          router.replace('/(auth)');
        }
      }, 150); // State'in güncellenmesi için 150ms bekle.

      return () => clearTimeout(timer); // Hook'tan çıkılırsa zamanlayıcıyı temizle.
    }

    // İşlem devam ediyorsa dokunma.
    if (authLoading || isAuthFlowActive) {
      return;
    }
    
    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Standart yönlendirme kuralları (eğer +not-found durumu yoksa çalışacak)
    if (user) {
      const profileComplete = user.gender && user.birthDate;
      if (!profileComplete && segments[1] !== 'complete-profile') {
        router.replace('/(auth)/complete-profile');
      } else if (profileComplete && inAuthGroup) {
        router.replace('/(tabs)/wardrobe');
      }
    } else {
      if (inTabsGroup) {
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

  useProtectedRouter(); // Yönlendirme mantığını burada çağırıyoruz.

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
    const initializeAppServices = async () => {
      try {
        const langPromise = (async () => {
          const savedLanguage = await AsyncStorage.getItem('app_language');
          
          if (savedLanguage) {
            // Kayıtlı dil varsa, onu kullan.
            await i18n.changeLanguage(savedLanguage);
          } else {
            // Kayıtlı dil yoksa, cihaz dilini kontrol et.
            
            // 1. DEĞİŞİKLİK: DESTEKLENEN TÜM DİLLERİ BURAYA EKLİYORUZ.
            const supportedLanguages = [
              'ar', 'bg', 'de', 'el', 'en', 'es', 'fr', 'he', 'hi', 
              'id', 'it', 'ja', 'ko', 'pt', 'ru', 'tl', 'tr', 'zh'
            ];
            
            // 2. DEĞİŞİKLİK: NULL KONTROLÜ İLE TYPESCRIPT HATASINI ÇÖZÜYORUZ.
            // Cihazın ilk dilini al, eğer yoksa varsayılan olarak 'en' kullan.
            const deviceLanguageCode = Localization.getLocales()[0]?.languageCode ?? 'en';

            // Cihazın dili desteklenen diller arasında mı kontrol et.
            const finalLanguage = supportedLanguages.includes(deviceLanguageCode) 
              ? deviceLanguageCode 
              : 'en'; // Desteklenmiyorsa yine İngilizce'ye dön.
              
            await i18n.changeLanguage(finalLanguage);
            await AsyncStorage.setItem('app_language', finalLanguage);
          }
        })();
        
        const purchasesPromise = (async () => {
          const apiKey = Platform.select({ ios: 'appl_DuXXAykkepzomdHesCIharljFmd', android: 'goog_PDkLWblJUhcgbNKkgItuNKXvkZh' });
          if (apiKey) { 
            await Purchases.configure({ apiKey }); 
            console.log(`RevenueCat initialized successfully for ${Platform.OS}`); 
          }
        })();

        const appInitPromise = initializeApp();
        
        await Promise.all([langPromise, purchasesPromise, appInitPromise]);
      } catch (error) {
        console.error('Failed to initialize app services:', error);
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