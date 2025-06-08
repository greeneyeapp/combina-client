import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft, Check } from 'lucide-react-native';
import Button from '@/components/common/Button';
import HeaderBar from '@/components/common/HeaderBar';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'de', name: 'Deutsch' },
];

export default function LanguageScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [selectedLanguage, setSelectedLanguage] = React.useState(i18n.language);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const saveLanguage = () => {
    i18n.changeLanguage(selectedLanguage);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('language.title')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={() => router.back()}
      />

      <View style={styles.content}>
        <Text style={[styles.subtitle, { color: theme.colors.text }]}>
          {t('language.subtitle')}
        </Text>

        <View style={styles.languageList}>
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
                <Check color={theme.colors.primary} size={20} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Button
          label={t('language.save')}
          onPress={saveLanguage}
          variant="primary"
          style={styles.saveButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    marginBottom: 24,
  },
  languageList: {
    gap: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: 12,
  },
  languageName: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  saveButton: {
    marginTop: 32,
  },
});