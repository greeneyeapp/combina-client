import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
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
import { useAuth } from '@/hooks/useAuth';
import { clearAllData } from '@/utils/storage';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);

  const handleLanguagePress = () => {
    router.push('/(tabs)/profile/language');
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)');
  };

  const handleClearData = () => {
    Alert.alert(
      t('profile.clearDataTitle'),
      t('profile.clearDataMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          onPress: () => {
            clearAllData();
            Alert.alert(
              t('profile.dataCleared'),
              t('profile.dataRestart'),
              [
                {
                  text: t('common.ok'),
                  onPress: () => {
                    logout();
                    router.replace('/(auth)');
                  },
                },
              ]
            );
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('profile.title')} />

      <View style={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
          <Avatar size={80} user={user} />
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>
              {user?.name || t('profile.guest')}
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
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Globe color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {t('profile.language')}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.settingAction}
                onPress={handleLanguagePress}
              >
                <Text style={[styles.settingValue, { color: theme.colors.primary }]}>
                  {i18n.language === 'en' ? 'English' : i18n.language === 'tr' ? 'Türkçe' : 'Deutsch'}
                </Text>
                <ChevronRight color={theme.colors.textLight} size={16} />
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                {theme.mode === 'dark' ? (
                  <Moon color={theme.colors.text} size={20} />
                ) : (
                  <Sun color={theme.colors.text} size={20} />
                )}
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

            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                <Bell color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                  {t('profile.notifications')}
                </Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.white}
              />
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>
            {t('profile.account')}
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
            {!user?.isGuest && (
              <>
                <TouchableOpacity style={styles.settingRow}>
                  <View style={styles.settingLabelContainer}>
                    <UserCircle2 color={theme.colors.text} size={20} />
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                      {t('profile.editProfile')}
                    </Text>
                  </View>
                  <View style={styles.settingAction}>
                    <ChevronRight color={theme.colors.textLight} size={16} />
                  </View>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              </>
            )}

            <TouchableOpacity style={styles.settingRow}>
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
    flexWrap: 'wrap',
    maxWidth: 200,
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