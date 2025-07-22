

// app/(tabs)/profile/language.tsx - iPad için ortalanmış ve orantılı tasarım

import React from 'react';
// YENİ: Dimensions modülü eklendi
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft, Check } from 'lucide-react-native';
import Button from '@/components/common/Button';
import HeaderBar from '@/components/common/HeaderBar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// YENİ: iPad tespiti
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const languages = [
  { code: 'ar', name: 'العربية' },
  { code: 'bg', name: 'Български' },
  { code: 'de', name: 'Deutsch' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'he', name: 'עברית' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'it', name: 'Italiano' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'tl', name: 'Filipino' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'zh', name: '中文' }
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const saveLanguage = async () => {
    try {
      await i18n.changeLanguage(selectedLanguage);
      await AsyncStorage.setItem('app_language', selectedLanguage);
      console.log('Language saved:', selectedLanguage);
      router.replace('/(tabs)/profile');
    } catch (error) {
      console.error('Error saving language:', error);
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('language.title')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={isTablet ? 28 : 24} />}
        onLeftPress={() => router.replace('/(tabs)/profile')}
      />

      {/* YENİ: İçeriği sarmalayan ve ortalayan View */}
      <View style={styles.contentWrapper}>
        <View style={styles.content}>
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            {t('language.subtitle')}
          </Text>

          <ScrollView
            style={{ flex: 1, width: '100%' }} // Genişliğin %100 olmasını sağla
            contentContainerStyle={styles.languageList}
            showsVerticalScrollIndicator={false}
          >
            {languages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  { borderColor: theme.colors.border },
                  selectedLanguage === language.code && {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.primaryLight,
                  },
                ]}
                onPress={() => handleLanguageChange(language.code)}
              >
                <Text
                  style={[
                    styles.languageName,
                    { color: theme.colors.text },
                    selectedLanguage === language.code && { color: theme.colors.primary },
                  ]}
                >
                  {language.name}
                </Text>
                {selectedLanguage === language.code && (
                  <Check color={theme.colors.primary} size={isTablet ? 28 : 20} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Button
            label={t('language.save')}
            onPress={saveLanguage}
            variant="primary"
            style={styles.saveButton}
            size={isTablet ? 'large' : 'medium'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // YENİ: Dış sarmalayıcı
  contentWrapper: {
    flex: 1,
    alignItems: 'center', // İçeriği yatayda ortala
    padding: isTablet ? 32 : 0,
  },
  // YENİ: İçeriğin genişliğini ayarlayan stil
  content: {
    flex: 1,
    width: '100%',
    maxWidth: isTablet ? 700 : undefined,
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 20 : 16, // Büyüdü
    marginBottom: isTablet ? 32 : 24,
    textAlign: isTablet ? 'center' : 'left', // Tablette ortalandı
  },
  languageList: {
    paddingBottom: 32,
    gap: isTablet ? 20 : 16, // Boşluk artırıldı
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: isTablet ? 24 : 16, // Büyüdü
    paddingHorizontal: isTablet ? 32 : 24,
    borderWidth: 1,
    borderRadius: 16, // Daha yuvarlak
  },
  languageName: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 20 : 16, // Büyüdü
  },
  saveButton: {
    marginTop: 32,
    marginBottom: 16,
  },
});