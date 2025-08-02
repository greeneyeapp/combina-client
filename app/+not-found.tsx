// app/+not-found.tsx - OAuth callback sırasında global flag

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// Global OAuth flag
let globalOAuthInProgress = false;

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  
  const [redirectMessage, setRedirectMessage] = useState(t('navigation.redirecting'));

  useEffect(() => {
    const handleOAuthCallback = () => {
      console.log('🔍 NotFound screen - checking params:', params);
      
      // DÜZELTME: OAuth callback parametrelerini kontrol et
      const isOAuthCallback = !!(
        params.code || 
        params.access_token || 
        params.state || 
        params.error ||
        params.authorization_code ||
        String(params.success) === 'true' ||
        String(params.cancelled) === 'true'
      );

      if (isOAuthCallback) {
        console.log('🔄 OAuth callback detected, setting global flag...');
        setRedirectMessage(t('authFlow.anonymousSignIn.pleaseWait'));
        
        // Global flag set et - NavigationGuard için
        globalOAuthInProgress = true;
        
        // 8 saniye sonra flag'i temizle
        setTimeout(() => {
          globalOAuthInProgress = false;
          console.log('✅ Global OAuth flag cleared');
        }, 8000);
        
        // OAuth callback durumunda hiçbir şey yapma - WebBrowser otomatik handle eder
        return;
      }

      // OAuth callback değilse, normal not-found
      setRedirectMessage('Page not found - redirecting...');
    };

    // Kısa gecikme ile callback kontrolü
    const timer = setTimeout(handleOAuthCallback, 300);
    return () => clearTimeout(timer);
  }, [params]);

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
              {redirectMessage}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

// Global flag export
export { globalOAuthInProgress };

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
});