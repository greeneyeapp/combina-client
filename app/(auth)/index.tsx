import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/common/Button';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme, themeMode } = useTheme();

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
                ? require('@/assets/images/logo-dark.webp')
                : require('@/assets/images/logo-light.webp')
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
            label={t('login.title')}
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            style={styles.button}
          />
          <Button
            label={t('login.register')}
            onPress={() => router.push('/(auth)/register')}
            variant="outline"
            style={styles.button}
          />

          <TouchableOpacity style={styles.forgotPasswordButton} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={[styles.guestText, { color: theme.colors.textLight }]}>
              {t('login.forgotPassword')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push({ pathname: '/(auth)/language' })}>
            <Text style={[styles.languageSelector, { color: theme.colors.primary }]}>
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
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  logoContainer: { alignItems: 'center', marginTop: 12 },
  logo: { width: 220, height: 220 },
  appName: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 42, marginTop: 16 },
  tagline: { fontFamily: 'Montserrat-Medium', fontSize: 16, marginTop: 8, textAlign: 'center' },
  buttonContainer: { width: '100%', paddingHorizontal: 16 },
  button: { marginBottom: 16 },
  forgotPasswordButton: { alignItems: 'center', paddingVertical: 8 },
  guestButton: { alignItems: 'center', paddingVertical: 16 },
  guestText: { fontFamily: 'Montserrat-Medium', fontSize: 16 },
  footer: { alignItems: 'center', marginBottom: 24 },
  languageSelector: { fontFamily: 'Montserrat-Medium', fontSize: 16, textDecorationLine: 'underline' },
});
