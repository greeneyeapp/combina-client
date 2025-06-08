import { useEffect } from 'react';
import { Stack, router, useRootNavigationState } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/locales/i18n';
import { AuthProvider, useAuthContext } from '@/context/AuthContext';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { user, isLoading } = useAuthContext();
  const navigationState = useRootNavigationState();
  
  const [fontsLoaded, fontError] = useFonts({
    'Montserrat-Regular': require('../assets/fonts/Montserrat-Regular.ttf'),
    'Montserrat-Medium': require('../assets/fonts/Montserrat-Medium.ttf'),
    'Montserrat-Bold': require('../assets/fonts/Montserrat-Bold.ttf'),
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
  });

  useEffect(() => {
    const isReady = (fontsLoaded || fontError) && !isLoading && navigationState?.key;
    
    if (isReady) {
      SplashScreen.hideAsync();
      if (user) {
        router.replace('/(tabs)/wardrobe');
      } else {
        router.replace('/(auth)');
      }
    }
  }, [fontsLoaded, fontError, isLoading, user, navigationState?.key]);

  if (!fontsLoaded || fontError || isLoading) {
    return null;
  }
  
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
  return (
    <GestureHandlerRootView style={styles.container}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
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
