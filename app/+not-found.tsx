// app/+not-found.tsx - OAuth redirect handling eklendi

import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user, isInitialized } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    // DÜZELTME: OAuth callback handling
    const handleRedirect = () => {
      console.log('🔍 NotFound screen - checking redirect params:', params);
      
      // Google OAuth callback kontrolü
      if (params.code || params.access_token || params.state) {
        console.log('🚫 OAuth callback detected in NotFound, redirecting to auth');
        router.replace('/(auth)');
        return;
      }

      // Auth context hazır olduktan sonra yönlendir
      if (isInitialized) {
        if (user) {
          if (user.profile_complete) {
            console.log('🏠 User authenticated and complete, redirecting to home');
            router.replace('/(tabs)/home');
          } else {
            console.log('📝 User authenticated but incomplete, redirecting to complete-profile');
            router.replace('/(auth)/complete-profile');
          }
        } else {
          console.log('🚪 No user found, redirecting to auth');
          router.replace('/(auth)');
        }
      }
    };

    // Kısa bir gecikme ile redirect
    const timer = setTimeout(handleRedirect, 1000);
    return () => clearTimeout(timer);
  }, [params, user, isInitialized]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[theme.colors.background, theme.colors.secondary]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={[styles.indicatorContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
            
            <Text style={[styles.text, { color: theme.colors.text }]}>
              {t('navigation.redirecting')}
            </Text>
            
            <Text style={[styles.debugText, { color: theme.colors.textLight }]}>
              {user ? `User: ${user.provider}` : 'No user'}
              {isInitialized ? ' | Auth Ready' : ' | Auth Loading'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  indicatorContainer: {
    width: isTablet ? 120 : 80,
    height: isTablet ? 120 : 80,
    borderRadius: isTablet ? 60 : 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 20 : 16,
  },
  debugText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
  },
});