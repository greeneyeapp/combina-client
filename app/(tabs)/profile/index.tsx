import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import {
  Moon,
  Sun,
  Globe,
  LogOut,
  ChevronRight,
  UserCircle2,
  HelpCircle,
  Bell,
  Trash2
} from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import Avatar from '@/components/profile/Avatar';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { show: showAlert } = useAlertStore();

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
  
  const getLanguageName = (code: string) =>
    languages.find(l => l.code === code)?.name || code;

  const handleLanguagePress = () => {
    router.push('/(tabs)/profile/language');
  };

  const handleLogout = () => {
    showAlert({
      title: t('logout.alertTitle'),
      message: t('logout.alertMessage'),
      buttons: [
        { text: t('common.cancel'), onPress: () => { } },
        { text: t('common.continue'), onPress: doLogout }
      ]
    });
  };

  function doLogout() {
    logout();
    router.replace('/(auth)');
  }

  const handleClearData = () => {
    showAlert({
      title: t('profile.clearDataTitle'),
      message: t('profile.clearDataMessage'),
      buttons: [
        { text: t('common.cancel'), onPress: () => { }, variant: 'outline' },
        {
          text: t('profile.continueToDelete'),
          onPress: () => {
            Linking.openURL('https://greeneyeapp.com/data-deletion.html');
          },
          variant: 'destructive',
        }
      ]
    });
  };

  const handleHelpPress = async () => {
    const url = 'https://greeneyeapp.com/contact.html';

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showAlert({
          title: t('common.error'),
          message: `${t('profile.cannotOpenLink')} ${url}`,
          buttons: [{ text: t('common.ok'), onPress: () => { } }]
        });
      }
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: t('profile.cannotOpenLink'),
        buttons: [{ text: t('common.ok'), onPress: () => { } }]
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('profile.title')} />

      <View style={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
          <Avatar size={80} user={user} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>
              {user?.displayName || t('profile.guest')}
            </Text>
            <Text
              style={[styles.profileEmail, { color: theme.colors.textLight }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.email || t('profile.guestSubtitle')}
            </Text>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>
            {t('profile.preferences')}
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity style={styles.settingRow} onPress={handleLanguagePress}>
              <View style={styles.settingLabelContainer}>
                <Globe color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {t('profile.language')}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <Text style={[styles.settingValue, { color: theme.colors.primary }]}>
                  {getLanguageName(i18n.language)}
                </Text>
                <ChevronRight color={theme.colors.textLight} size={16} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                {theme.mode === 'dark' ? <Moon color={theme.colors.text} size={20} /> : <Sun color={theme.colors.text} size={20} />}
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {t('profile.darkMode')}
                </Text>
              </View>
              <Switch
                value={theme.mode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.white}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>
            {t('profile.account')}
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleHelpPress}
            >
              <View style={styles.settingLabelContainer}>
                <HelpCircle color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {t('profile.help')}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <ChevronRight color={theme.colors.textLight} size={16} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleClearData}
            >
              <View style={styles.settingLabelContainer}>
                <Trash2 color={theme.colors.error} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.error }]}>
                  {t('profile.clearData')}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <ChevronRight color={theme.colors.textLight} size={16} />
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleLogout}
            >
              <View style={styles.settingLabelContainer}>
                <LogOut color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {t('profile.logout')}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <ChevronRight color={theme.colors.textLight} size={16} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    flexShrink: 1,
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  settingsCard: {
    borderRadius: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    marginLeft: 12,
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginRight: 8,
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});