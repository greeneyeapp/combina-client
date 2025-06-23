import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Linking, ScrollView, Platform, ActivityIndicator } from 'react-native';
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
  Trash2,
  Crown,
  Star,
  Zap
} from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import Avatar from '@/components/profile/Avatar';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import { getUserProfile } from '@/services/userService';

import { restorePurchases } from '@/services/purchaseService';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { RefreshCw } from 'lucide-react-native';

interface UserPlan {
  plan: string;
  daily_limit: number;
  current_usage: number;
  remaining: number;
  percentage_used: number;
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { show: showAlert } = useAlertStore();
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const { refreshCustomerInfo } = useRevenueCat();
  const [isRestoring, setIsRestoring] = useState(false);

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

  // ProfileScreen.tsx'de useEffect'i güncelleyin
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserPlan({
          plan: profile.plan,
          daily_limit: profile.usage.daily_limit,
          current_usage: profile.usage.current_usage,
          remaining: profile.usage.remaining,
          percentage_used: profile.usage.percentage_used
        });
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // Fallback data veya error handling
      }
    };

    if (user && !user.isAnonymous) {
      fetchUserProfile();
    }

    
  }, [user]);

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'ios') {
      showAlert({
        title: t('subscription.notAvailable'),
        message: t('subscription.iosOnly'),
        buttons: [{ text: t('common.ok'), onPress: () => { } }]
      });
      return;
    }

    setIsRestoring(true);
    try {
      const result = await restorePurchases();

      if (result.success) {
        if (result.restoredPlan && result.restoredPlan !== 'free') {
          showAlert({
            title: t('subscription.restoreSuccessTitle'),
            message: t('subscription.restoreSuccessMessage', {
              plan: t(`profile.plans.${result.restoredPlan}`)
            }),
            buttons: [{ text: t('common.ok'), onPress: () => { } }]
          });
        } else {
          showAlert({
            title: t('subscription.noRestoreTitle'),
            message: t('subscription.noRestoreMessage'),
            buttons: [{ text: t('common.ok'), onPress: () => { } }]
          });
        }

        // Refresh both RevenueCat and profile data
        refreshCustomerInfo();
      } else {
        showAlert({
          title: t('subscription.restoreFailTitle'),
          message: result.error || t('subscription.restoreFailMessage'),
          buttons: [{ text: t('common.ok'), onPress: () => { } }]
        });
      }
    } catch (error) {
      showAlert({
        title: t('common.error'),
        message: t('subscription.unexpectedError'),
        buttons: [{ text: t('common.ok'), onPress: () => { } }]
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'standard':
        return <Star color={theme.colors.primary} size={20} />;
      case 'premium':
        return <Crown color="#FFD700" size={20} />;
      default:
        return <Zap color={theme.colors.textLight} size={20} />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'standard':
        return theme.colors.primary;
      case 'premium':
        return '#FFD700';
      default:
        return theme.colors.textLight;
    }
  };

  const getLanguageName = (code: string) =>
    languages.find(l => l.code === code)?.name || code;

  const handleLanguagePress = () => {
    router.push('/(tabs)/profile/language');
  };

  const handleSubscriptionPress = () => {
    router.push('/profile/subscription' as any);
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

        {/* Subscription Section */}
        {userPlan && (
          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>
              {t('profile.subscription')}
            </Text>

            <TouchableOpacity
              style={[styles.subscriptionCard, { backgroundColor: theme.colors.card }]}
              onPress={handleSubscriptionPress}
            >
              <View style={styles.subscriptionHeader}>
                <View style={styles.planInfo}>
                  {getPlanIcon(userPlan.plan)}
                  <Text style={[styles.planName, { color: getPlanColor(userPlan.plan) }]}>
                    {t(`profile.plans.${userPlan.plan}`)}
                  </Text>
                </View>
                <ChevronRight color={theme.colors.textLight} size={16} />
              </View>

              <View style={styles.usageInfo}>
                <Text style={[styles.usageText, { color: theme.colors.text }]}>
                  {t('profile.dailyUsage', {
                    used: userPlan.current_usage,
                    total: userPlan.daily_limit
                  })}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: getPlanColor(userPlan.plan),
                        width: `${userPlan.percentage_used}%`
                      }
                    ]}
                  />
                </View>
              </View>

              {userPlan.plan === 'free' && (
                <Text style={[styles.upgradeText, { color: theme.colors.primary }]}>
                  {t('profile.upgradeForMore')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

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
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>
            {t('profile.account')}
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
            {Platform.OS === 'ios' && (
              <>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={handleRestorePurchases}
                  disabled={isRestoring}
                >
                  <View style={styles.settingLabelContainer}>
                    <RefreshCw color={theme.colors.text} size={20} />
                    <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
                      {t('subscription.restorePurchases')}
                    </Text>
                  </View>
                  <View style={styles.settingAction}>
                    {isRestoring && <ActivityIndicator size="small" color={theme.colors.primary} />}
                    <ChevronRight color={theme.colors.textLight} size={16} />
                  </View>
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              </>
            )}
          </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  subscriptionCard: {
    padding: 16,
    borderRadius: 16,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginLeft: 8,
    textTransform: 'capitalize',
  },
  usageInfo: {
    marginBottom: 8,
  },
  usageText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  upgradeText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    marginTop: 4,
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