// app/(auth)/index.tsx - Yönlendirme metodu 'replace' olarak güncellendi

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function AuthIndexScreen() {
  const { t } = useTranslation();
  const { theme, themeMode } = useTheme();
  // isAuthFlowActive artık AuthContext'ten gelmiyor, bu yüzden kaldıralım.
  // const { isAuthFlowActive } = useAuth();

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={
              themeMode === 'dark'
                ? require('@/assets/images/logo-dark.png')
                : require('@/assets/images/logo-light.png')
            }
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.tagline, { color: theme.colors.text }]}>
            {t('login.tagline')}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            label={t('auth.continueAsGuest')}
            // DÜZELTME: push yerine replace kullanılıyor
            onPress={() => router.replace('/(auth)/anonymous-signin')}
            variant="secondary"
            style={[styles.button, styles.guestButton]}
            size={isTablet ? 'large' : 'medium'}
          />
          
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            <Text style={[styles.dividerText, { color: theme.colors.textLight }]}>
              {t('common.or')}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          </View>

          <Button
            label={t('auth.signInWithGoogle')}
            // DÜZELTME: push yerine replace kullanılıyor
            onPress={() => router.replace('/(auth)/google-signin')}
            variant="outline"
            style={styles.button}
            icon="google"
            size={isTablet ? 'large' : 'medium'}
          />
          
          {Platform.OS === 'ios' && (
            <Button
              label={t('auth.signInWithApple')}
              // DÜZELTME: push yerine replace kullanılıyor
              onPress={() => router.replace('/(auth)/apple-signin')}
              variant="primary"
              style={styles.button}
              size={isTablet ? 'large' : 'medium'}
            />
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/(auth)/language' })}
          >
            <Text style={[
              styles.languageSelector, 
              { color: theme.colors.primary }
            ]}>
              {t('login.changeLanguage')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'space-around',
  },
  logoContainer: { 
    alignItems: 'center', 
  },
  logo: { 
    width: isTablet ? 320 : 220,
    height: isTablet ? 320 : 220,
  },
  tagline: { 
    fontFamily: 'Montserrat-Medium', 
    fontSize: isTablet ? 20 : 16,
    marginTop: 8, 
    textAlign: 'center' 
  },
  buttonContainer: { 
    width: '100%', 
    maxWidth: isTablet ? 450 : undefined, 
    alignSelf: 'center',
  },
  button: { 
    marginBottom: 16 
  },
  guestButton: {
    marginBottom: 24
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    marginBottom: 24
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: isTablet ? 16 : 14,
    fontFamily: 'Montserrat-Medium',
  },
  footer: { 
    alignItems: 'center', 
    marginBottom: 24 
  },
  languageSelector: { 
    fontFamily: 'Montserrat-Medium', 
    fontSize: isTablet ? 18 : 16,
    textDecorationLine: 'underline' 
  },
});
