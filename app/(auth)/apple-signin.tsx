import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import * as AppleAuthentication from 'expo-apple-authentication';

export default function AppleSignInScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { signInWithApple } = useAuth();
  const { show: showAlert } = useAlertStore();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      handleAppleSignIn();
    } else {
      router.back();
    }
  }, []);

  const handleAppleSignIn = async () => {
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const userInfo = await signInWithApple(credential);
      
      // Kullanıcı bilgileri eksikse, kullanıcı bilgi formuna yönlendir
      if (!userInfo.gender || !userInfo.birthDate) {
        router.replace('/(auth)/user-info');
      } else {
        router.replace('/(tabs)/wardrobe');
      }
    } catch (error: any) {
      if (error.code === 'ERR_CANCELED') {
        router.back();
      } else {
        showAlert({
          title: t('common.error'),
          message: t('auth.signInError'),
          buttons: [{ text: t('common.ok'), onPress: () => router.back() }]
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            {t('auth.signingInWithApple')}
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'Montserrat-Medium', fontSize: 16, marginTop: 16 },
});
