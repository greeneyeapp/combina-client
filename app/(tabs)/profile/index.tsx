// app/(tabs)/profile/index.tsx - With Storage Management

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Linking,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
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
  Trash2,
  Crown,
  Star,
  Zap,
  HelpCircle,
  RefreshCw,
  HardDrive
} from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import Avatar from '@/components/profile/Avatar';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import { getUserProfile } from '@/services/userService';
import { restorePurchases } from '@/services/purchaseService';
import { useRevenueCat } from '@/context/RevenueCatContext';

interface UsageInfo {
  daily_limit: number;
  current_usage: number;
  percentage_used: number;
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { show: showAlert } = useAlertStore();

  const { currentPlan, isLoading: isPlanLoading, refreshCustomerInfo } = useRevenueCat();

  const [usageInfo, setUsageInfo] = useState<UsageInfo | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(true);
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

  useEffect(() => {
    const fetchUsage = async () => {
      if (user && !user.isAnonymous) {
        try {
          setIsUsageLoading(true);
          const profile = await getUserProfile(true);
          setUsageInfo({
            daily_limit: profile.usage.daily_limit,
            current_usage: profile.usage.current_usage,
            percentage_used: profile.usage.percentage_used
          });
        } catch (error) {
          console.error('Failed to fetch user usage info:', error);
        } finally {
          setIsUsageLoading(false);
        }
      } else {
        setIsUsageLoading(false);
      }
    };

    fetchUsage();
  }, [user]);

  const handleRestorePurchases = async () => {
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
            buttons: [{ text: t('common.ok') }]
          });
          refreshCustomerInfo();
        } else {
          showAlert({
            title: t('subscription.noRestoreTitle'),
            message: t('subscription.noRestoreMessage'),
            buttons: [{ text: t('common.ok') }]
          });
        }
      } else {
        showAlert({
          title: t('subscription.restoreFailTitle'),
          message: result.error || t('subscription.restoreFailMessage'),
          buttons: [{ text: t('common.ok') }]
        });
      }
    } catch (error) {
      console.log(error);
      showAlert({
        title: t('common.error'),
        message: t('subscription.unexpectedError'),
        buttons: [{ text: t('common.ok') }]
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'standard': return <Star color={theme.colors.primary} size={20} />;
      case 'premium': return <Crown color="#FFD700" size={20} />;
      default: return <Zap color={theme.colors.textLight} size={20} />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'standard': return theme.colors.primary;
      case 'premium': return '#FFD700';
      default: return theme.colors.textLight;
    }
  };

  const getLanguageName = (code: string) => languages.find(l => l.code === code)?.name || code;
  const handleLanguagePress = () => router.push('/(tabs)/profile/language');
  const handleSubscriptionPress = () => router.push('/subscription');
  const handleStoragePress = () => router.push('/storage');
  
  const handleLogout = () => {
    showAlert({
      title: t('logout.alertTitle'),
      message: t('logout.alertMessage'),
      buttons: [
        { text: t('common.cancel') },
        {
          text: t('common.continue'),
          onPress: logout
        }
      ]
    });
  };

  const handleClearData = () => {
    showAlert({
      title: t('profile.clearDataTitle'),
      message: t('profile.clearDataMessage'),
      buttons: [
        { text: t('common.cancel'), variant: 'outline' },
        {
          text: t('profile.continueToDelete'),
          onPress: () => Linking.openURL('https://greeneyeapp.com/data-deletion.html'),
          variant: 'destructive',
        }
      ]
    });
  };

  const handleHelpPress = () => Linking.openURL('https://greeneyeapp.com/contact.html');

  const renderSubscriptionCard = () => {
    if (isPlanLoading) {
      return (
        <View style={[styles.subscriptionCard, { backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center', height: 80 }]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.subscriptionCard, { backgroundColor: theme.colors.card }]}
        onPress={handleSubscriptionPress}
      >
        <View style={[
          styles.subscriptionHeader,
          currentPlan !== 'free' && { marginBottom: 0 }
        ]}>
          <View style={styles.planInfo}>
            {getPlanIcon(currentPlan)}
            <Text style={[styles.planName, { color: getPlanColor(currentPlan) }]}>
              {t(`profile.plans.${currentPlan}`)}
            </Text>
          </View>
          <ChevronRight color={theme.colors.textLight} size={16} />
        </View>

        {currentPlan === 'free' && (
          <Text style={[styles.upgradeText, { color: theme.colors.primary }]}>
            {t('profile.upgradeForMore')}
          </Text>
        )}
      </TouchableOpacity>
    );
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

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>
            {t('profile.subscription')}
          </Text>
          {renderSubscriptionCard()}
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>
            {t('profile.preferences')}
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity style={styles.settingRow} onPress={handleLanguagePress}>
              <View style={styles.settingLabelContainer}>
                <Globe color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.language')}</Text>
              </View>
              <View style={styles.settingAction}>
                <Text style={[styles.settingValue, { color: theme.colors.primary }]}>{getLanguageName(i18n.language)}</Text>
                <ChevronRight color={theme.colors.textLight} size={16} />
              </View>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.settingRow}>
              <View style={styles.settingLabelContainer}>
                {theme.mode === 'dark' ? <Moon color={theme.colors.text} size={20} /> : <Sun color={theme.colors.text} size={20} />}
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.darkMode')}</Text>
              </View>
              <Switch value={theme.mode === 'dark'} onValueChange={toggleTheme} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} thumbColor={theme.colors.white} />
            </View>
          </View>
        </View>

        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>
            {t('profile.account')}
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
            <TouchableOpacity style={styles.settingRow} onPress={handleStoragePress}>
              <View style={styles.settingLabelContainer}>
                <HardDrive color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('storage.title')}</Text>
              </View>
              <ChevronRight color={theme.colors.textLight} size={16} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <TouchableOpacity style={styles.settingRow} onPress={handleHelpPress}>
              <View style={styles.settingLabelContainer}>
                <HelpCircle color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.help')}</Text>
              </View>
              <ChevronRight color={theme.colors.textLight} size={16} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <TouchableOpacity style={styles.settingRow} onPress={handleRestorePurchases} disabled={isRestoring}>
              <View style={styles.settingLabelContainer}>
                <RefreshCw color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('subscription.restorePurchases')}</Text>
              </View>
              <View style={styles.settingAction}>
                {isRestoring ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <ChevronRight color={theme.colors.textLight} size={16} />
                )}
              </View>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <TouchableOpacity style={styles.settingRow} onPress={handleClearData}>
              <View style={styles.settingLabelContainer}>
                <Trash2 color={theme.colors.error} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.error }]}>{t('profile.clearData')}</Text>
              </View>
              <ChevronRight color={theme.colors.textLight} size={16} />
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
              <View style={styles.settingLabelContainer}>
                <LogOut color={theme.colors.text} size={20} />
                <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.logout')}</Text>
              </View>
              <ChevronRight color={theme.colors.textLight} size={16} />
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