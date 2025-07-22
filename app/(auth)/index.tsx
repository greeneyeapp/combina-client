// app/auth/index.tsx - iPad için büyütülmüş ve orantılı tasarım

import React from 'react';
// YENİ: Dimensions modülü eklendi
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/common/Button';

// YENİ: iPad tespiti
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function AuthIndexScreen() {
  const { t } = useTranslation();
  const { theme, themeMode } = useTheme();
  const { isAuthFlowActive } = useAuth();

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
            // DEĞİŞİKLİK: Stil artık StyleSheet'ten dinamik olarak geliyor
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.tagline, { color: theme.colors.text }]}>
            {t('login.tagline')}
          </Text>
        </View>

        {/* DEĞİŞİKLİK: Buton konteyneri artık ortalanmış ve genişliği sınırlı */}
        <View style={styles.buttonContainer}>
          <Button
            label={t('auth.signInWithGoogle')}
            onPress={() => router.push('/(auth)/google-signin')}
            variant="outline"
            style={styles.button}
            icon="google"
            disabled={isAuthFlowActive}
            // YENİ: Buton boyutu tablet için büyütüldü
            size={isTablet ? 'large' : 'medium'}
          />
          
          {Platform.OS === 'ios' && (
            <Button
              label={t('auth.signInWithApple')}
              onPress={() => router.push('/(auth)/apple-signin')}
              variant="primary"
              style={styles.button}
              disabled={isAuthFlowActive}
              // YENİ: Buton boyutu tablet için büyütüldü
              size={isTablet ? 'large' : 'medium'}
            />
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/(auth)/language' })}
            disabled={isAuthFlowActive}
          >
            <Text style={[
              styles.languageSelector, 
              { 
                color: isAuthFlowActive ? theme.colors.textLight : theme.colors.primary,
                opacity: isAuthFlowActive ? 0.5 : 1
              }
            ]}>
              {t('login.changeLanguage')}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'space-around', // DEĞİŞİKLİK: Elemanları dikeyde daha iyi dağıtmak için
  },
  logoContainer: { 
    alignItems: 'center', 
    // marginTop: 12, // Dikey boşluk justifyContent ile yönetiliyor
  },
  logo: { 
    width: isTablet ? 320 : 220, // Büyüdü
    height: isTablet ? 320 : 220, // Büyüdü
  },
  tagline: { 
    fontFamily: 'Montserrat-Medium', 
    fontSize: isTablet ? 20 : 16, // Büyüdü
    marginTop: 8, 
    textAlign: 'center' 
  },
  buttonContainer: { 
    width: '100%', 
    // YENİ: Tablette genişliği sınırla ve ortala
    maxWidth: isTablet ? 450 : undefined, 
    alignSelf: 'center',
  },
  button: { 
    marginBottom: 16 
  },
  footer: { 
    alignItems: 'center', 
    marginBottom: 24 
  },
  languageSelector: { 
    fontFamily: 'Montserrat-Medium', 
    fontSize: isTablet ? 18 : 16, // Büyüdü
    textDecorationLine: 'underline' 
  },
});