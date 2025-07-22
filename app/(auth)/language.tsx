// app/(auth)/language.tsx - iPad için ortalanmış ve orantılı tasarım

import React from 'react';
// YENİ: Dimensions modülü eklendi
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft, Check } from 'lucide-react-native';
import Button from '@/components/common/Button';
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
      router.back();
    } catch (error) {
      console.error('Error saving language:', error);
      router.back();
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.text} size={isTablet ? 28 : 24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('language.title')}
          </Text>
          <View style={{ width: isTablet ? 28 : 24 }} />
        </View>

        {/* YENİ: İçeriği sarmalayan ve ortalayan View */}
        <View style={styles.contentWrapper}>
            <View style={styles.content}>
                <Text style={[styles.subtitle, { color: theme.colors.text }]}>
                    {t('language.subtitle')}
                </Text>
                <ScrollView
                    style={{ flex: 1, width: '100%' }}
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
    </LinearGradient>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: isTablet ? 30 : 24,
  },
  // YENİ: Dış sarmalayıcı
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    padding: isTablet ? 32 : 0,
  },
  // YENİ: İçeriğin genişliğini ayarlayan stil
  content: {
    flex: 1,
    width: '100%',
    maxWidth: isTablet ? 600 : undefined,
    padding: isTablet ? 0 : 24,
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 20 : 16,
    marginBottom: isTablet ? 32 : 24,
    textAlign: isTablet ? 'center' : 'left',
  },
  languageList: {
    paddingBottom: 32,
    gap: isTablet ? 20 : 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: isTablet ? 24 : 16,
    paddingHorizontal: isTablet ? 32 : 24,
    borderWidth: 1,
    borderRadius: 16,
  },
  languageName: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 20 : 16,
  },
  saveButton: {
    marginTop: 32,
  },
});