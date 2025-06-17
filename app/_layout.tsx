import { useEffect } from 'react';
import { Stack, router, useRootNavigationState, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/locales/i18n';
import { useAuth } from '@/context/AuthContext';
import { AuthProvider } from '@/context/AuthContext';
import CustomAlert from '@/components/common/CustomAlert';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import CustomToast from '@/components/common/CustomToast';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, loading } = useAuth();
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

  if (!fontsLoaded || fontError || loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="webview" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const toastConfig: Record<string, (props: BaseToastProps) => JSX.Element> = {
    success: (props) => <CustomToast {...props} type="success" />,
    info: (props) => <CustomToast {...props} type="info" />,
    error: (props) => <CustomToast {...props} type="error" />,
  };

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
