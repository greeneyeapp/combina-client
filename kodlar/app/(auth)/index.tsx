import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/common/Button';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      await signInAnonymously(auth);
      // Yönlendirmeyi ana _layout.tsx yapacak
    } catch (error) {
      console.error(error);
      alert('Misafir olarak giriş yapılamadı.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: theme.colors.primary }]}>Combina</Text>
          <Text style={[styles.tagline, { color: theme.colors.text }]}>
            {t('login.tagline')}
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          {/* DEĞİŞİKLİK: Dosya adını değiştirdikten sonra yolu güncelliyoruz */}
          <Button
            label={t('login.emailSignIn')}
            onPress={() => router.push({ pathname: '/(auth)/loginEmail' })}
            variant="primary"
            style={styles.button}
          />
          <Button
            label={t('login.register')}
            onPress={() => router.push({ pathname: '/(auth)/register' })}
            variant="outline"
            style={styles.button}
          />
          <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
            <Text style={[styles.guestText, { color: theme.colors.text }]}>
              {isGuestLoading ? t('login.loading') : t('login.continueAsGuest')}
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
  logoContainer: { alignItems: 'center', marginTop: 40 },
  logo: { width: 120, height: 120 },
  appName: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 42, marginTop: 16 },
  tagline: { fontFamily: 'Montserrat-Medium', fontSize: 16, marginTop: 8, textAlign: 'center' },
  buttonContainer: { width: '100%', paddingHorizontal: 16 },
  button: { marginBottom: 16 },
  guestButton: { alignItems: 'center', paddingVertical: 16 },
  guestText: { fontFamily: 'Montserrat-Medium', fontSize: 16 },
  footer: { alignItems: 'center', marginBottom: 24 },
  languageSelector: { fontFamily: 'Montserrat-Medium', fontSize: 16, textDecorationLine: 'underline' },
});
