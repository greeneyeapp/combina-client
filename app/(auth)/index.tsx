import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { Apple } from 'lucide-react-native';
import Button from '@/components/common/Button';

// Firebase ve Google Girişi için gerekli importlar
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '@/firebaseConfig'; // Firebase yapılandırma dosyamız

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '58339241217-f7682ccbkcdgqobsvcd3m3o3b0ll8562.apps.googleusercontent.com', 
      offlineAccess: true, 
    });
  }, []);

  const handleGuestLogin = () => {
    router.replace('/(tabs)/wardrobe');
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();

      if (idToken) {
        const googleCredential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, googleCredential);
        router.replace('/(tabs)/wardrobe');
      }
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.error(error);
        Alert.alert(t('common.error'), t('login.googleError'));
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleOtherLogins = (provider: string) => {
    console.log(`Login with ${provider}`);
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
          <Button
            icon="google"
            label={t('login.googleSignIn')}
            onPress={handleGoogleLogin} 
            variant="outline"
            style={styles.button}
            loading={isGoogleLoading}
            disabled={isGoogleLoading}
          />

          {Platform.OS === 'ios' && (
            <Button
              icon={<Apple color={theme.colors.text} size={24} />}
              label={t('login.appleSignIn')}
              onPress={() => handleOtherLogins('Apple')}
              variant="outline"
              style={styles.button}
            />
          )}

          <Button
            label={t('login.register')}
            onPress={() => router.push('/(auth)/register')}
            variant="primary"
            style={styles.button}
          />

          <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
            <Text style={[styles.guestText, { color: theme.colors.text }]}>
              {t('login.continueAsGuest')}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/(auth)/language')}>
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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 42,
    marginTop: 16,
  },
  tagline: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  button: {
    marginBottom: 16,
  },
  guestButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  guestText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  languageSelector: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
