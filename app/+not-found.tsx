// kodlar/app/+not-found.tsx

import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

/**
 * Bu ekran, normalde bulunamayan sayfalar için bir hata ekranıdır.
 * Ancak, harici giriş (Google/Apple) sonrası Expo Router anlık olarak buraya düştüğü için,
 * bu geçiş anını kullanıcıya bir hata gibi değil, genel bir yükleme/yönlendirme
 * ekranı gibi göstererek kullanıcı deneyimini (UX) pürüzsüzleştiriyoruz.
 */
export default function NotFoundScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={[theme.colors.background, theme.colors.secondary]}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            
            {/* HEM GOOGLE HEM DE APPLE İÇİN UYGUN GENEL BİR METİN KULLANIYORUZ */}
            <Text style={[styles.text, { color: theme.colors.text }]}>
              {t('navigation.redirecting')}
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
    gap: 20,
  },
  text: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
});