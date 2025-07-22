// kodlar/app/+not-found.tsx - iPad için büyütülmüş ve orantılı tasarım

import React from 'react';
// YENİ: Dimensions modülü eklendi
import { View, StyleSheet, ActivityIndicator, Text, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

// YENİ: iPad tespiti
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

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
            {/* YENİ: ActivityIndicator artık daha büyük bir kutu içinde */}
            <View style={[styles.indicatorContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
            
            <Text style={[styles.text, { color: theme.colors.text }]}>
              {t('navigation.redirecting')}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
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
    gap: 24, // Boşluk artırıldı
  },
  // YENİ: Yükleme ikonu için sarmalayıcı
  indicatorContainer: {
    width: isTablet ? 120 : 80,
    height: isTablet ? 120 : 80,
    borderRadius: isTablet ? 60 : 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 20 : 16, // Büyüdü
  },
});