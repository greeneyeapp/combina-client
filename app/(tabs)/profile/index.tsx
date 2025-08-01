// app/(tabs)/profile/index.tsx - Guest user desteği eklendi

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Switch,
  Linking, ScrollView, ActivityIndicator, Dimensions, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import {
  Moon, Sun, Globe, LogOut, ChevronRight, Trash2, Crown,
  Star, Zap, HelpCircle, RefreshCw, HardDrive,
  FileText, Lock, UserCheck, AlertCircle
} from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import Avatar from '@/components/profile/Avatar';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import { getUserProfile, deleteUserAccount } from '@/services/userService';
import { restorePurchases } from '@/services/purchaseService';
import { useRevenueCat } from '@/context/RevenueCatContext';
import { useClothingStore } from '@/store/clothingStore';
import { useOutfitStore } from '@/store/outfitStore';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

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

  const handlePrivacyPolicyPress = () => Linking.openURL('https://greeneyeapp.com/privacy.html');
  const handleTermsOfUsePress = () => Linking.openURL('https://greeneyeapp.com/terms-of-use.html');

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
        if (result.newPlan && result.newPlan !== 'free') {
          showAlert({
            title: t('subscription.restoreSuccessTitle'),
            message: t('subscription.restoreSuccessMessage', { plan: t(`profile.plans.${result.newPlan}`) }),
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
    const iconSize = isTablet ? 24 : 20;
    switch (plan) {
      case 'standard': return <Star color={theme.colors.primary} size={iconSize} />;
      case 'premium': return <Crown color="#FFD700" size={iconSize} />;
      default: return <Zap color={theme.colors.textLight} size={iconSize} />;
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
      title: t('logout.alertTitle'), message: t('logout.alertMessage'),
      buttons: [{ text: t('common.cancel') }, { text: t('common.continue'), onPress: logout }]
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
          variant: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            setIsGlobalLoading(true);
            try {
              const result = await deleteUserAccount();
              if (result.success) {
                console.log('🧹 Clearing all local user data after account deletion...');
                await useClothingStore.getState().clearAllClothing();
                useOutfitStore.getState().clearAllOutfits();
                console.log('✅ Local data cleared.');
                logout();
              } else {
                setIsGlobalLoading(false);
                setIsDeleting(false);
                showAlert({
                  title: t('common.error'),
                  message: result.error || t('subscription.unexpectedError'),
                  buttons: [{ text: t('common.ok') }]
                });
              }
            } catch (error) {
              console.error('Account deletion failed:', error);
              setIsGlobalLoading(false);
              setIsDeleting(false);
              showAlert({
                title: t('common.error'),
                message: t('subscription.unexpectedError'),
                buttons: [{ text: t('common.ok') }]
              });
            }
          }
        }
      ]
    });
  };

  const handleHelpPress = () => Linking.openURL('https://greeneyeapp.com/contact.html');

  // OKUNABİLİRLİK GARANTİLİ VE TIKLANAMAZ TASARIM
  const renderGuestUpgradeSection = () => {
    if (!user?.isAnonymous) return null;

    return (
      <View style={styles.settingsSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>{t('profile.guestAccount')}</Text>

        {/* TouchableOpacity, View olarak değiştirildi ve onPress kaldırıldı */}
        <View
          style={[
            styles.guestUpgradeCard,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border
            }
          ]}
        >
          {/* Sol taraftaki renkli vurgu şeridi */}
          <View style={[styles.accentBar, { backgroundColor: theme.colors.primary }]} />

          <View style={styles.guestUpgradeContent}>
            <View style={styles.guestUpgradeHeader}>
              <AlertCircle color={theme.colors.primary} size={isTablet ? 28 : 24} />
              <Text style={[styles.guestUpgradeTitle, { color: theme.colors.text }]}>
                {t('profile.upgradeGuestTitle')}
              </Text>
            </View>
            <Text style={[styles.guestUpgradeDesc, { color: theme.colors.textSecondary }]}>
              {t('profile.upgradeGuestDesc')}
            </Text>

            <View style={[styles.divider, { backgroundColor: theme.colors.border, marginVertical: 16 }]} />

            <View style={styles.guestFeaturesList}>
              <Text style={[styles.guestFeature, { color: theme.colors.textSecondary }]}>
                <Text style={{ color: theme.colors.primary }}>•</Text> {t('profile.crossDeviceSync')}
              </Text>
              <Text style={[styles.guestFeature, { color: theme.colors.textSecondary }]}>
                <Text style={{ color: theme.colors.primary }}>•</Text> {t('profile.neverLoseData')}
              </Text>
              <Text style={[styles.guestFeature, { color: theme.colors.textSecondary }]}>
                <Text style={{ color: theme.colors.primary }}>•</Text> {t('profile.fullFeatureAccess')}
              </Text>
            </View>
          </View>

          {/* Yönlendirme oku (ChevronRight) kaldırıldı */}
        </View>
      </View>
    );
  };

  const renderSubscriptionCard = () => {
    // Guest user için subscription card gösterme
    if (user?.isAnonymous) return null;

    if (isPlanLoading) {
      return (
        <View style={[styles.subscriptionCard, { backgroundColor: theme.colors.card, justifyContent: 'center', alignItems: 'center', height: 80 }]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }
    return (
      <TouchableOpacity style={[styles.subscriptionCard, { backgroundColor: theme.colors.card }]} onPress={handleSubscriptionPress}>
        <View style={[styles.subscriptionHeader, currentPlan !== 'free' && { marginBottom: 0 }]}>
          <View style={styles.planInfo}>
            {getPlanIcon(currentPlan)}
            <Text style={[styles.planName, { color: getPlanColor(currentPlan) }]}>{t(`profile.plans.${currentPlan}`)}</Text>
          </View>
          <ChevronRight color={theme.colors.textLight} size={isTablet ? 20 : 16} />
        </View>
        {currentPlan === 'free' && (<Text style={[styles.upgradeText, { color: theme.colors.primary }]}>{t('profile.upgradeForMore')}</Text>)}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Modal
        transparent={true}
        animationType="fade"
        visible={isGlobalLoading}
      >
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={theme.colors.white} />
          <Text style={styles.loadingOverlayText}>{t('profile.deletingData')}</Text>
        </View>
      </Modal>

      <HeaderBar title={t('profile.title')} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          <View style={[styles.profileCard, { backgroundColor: theme.colors.card }]}>
            <Avatar size={isTablet ? 100 : 80} user={user} />
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text }]}>
                {user?.displayName || t('profile.guest')}
                {user?.isAnonymous && (
                  <Text style={[styles.guestBadge, { color: theme.colors.primary }]}> ({t('common.guest')})</Text>
                )}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.textLight }]} numberOfLines={1} ellipsizeMode="tail">
                {user?.isAnonymous ? t('profile.guestSubtitle') : (user?.email || t('profile.guestSubtitle'))}
              </Text>
            </View>
          </View>

          {/* Guest upgrade section */}
          {renderGuestUpgradeSection()}

          {/* Subscription section - sadece normal user için */}
          {!user?.isAnonymous && (
            <View style={styles.settingsSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>{t('profile.subscription')}</Text>
              {renderSubscriptionCard()}
            </View>
          )}

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>{t('profile.preferences')}</Text>
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
              <TouchableOpacity style={styles.settingRow} onPress={handleLanguagePress}>
                <View style={styles.settingLabelContainer}>
                  <Globe color={theme.colors.text} size={isTablet ? 24 : 20} />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.language')}</Text>
                </View>
                <View style={styles.settingAction}>
                  <Text style={[styles.settingValue, { color: theme.colors.primary }]}>{getLanguageName(i18n.language)}</Text>
                  <ChevronRight color={theme.colors.textLight} size={isTablet ? 20 : 16} />
                </View>
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.settingRow}>
                <View style={styles.settingLabelContainer}>
                  {theme.mode === 'dark' ? <Moon color={theme.colors.text} size={isTablet ? 24 : 20} /> : <Sun color={theme.colors.text} size={isTablet ? 24 : 20} />}
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.darkMode')}</Text>
                </View>
                <Switch value={theme.mode === 'dark'} onValueChange={toggleTheme} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} thumbColor={theme.colors.white} transform={isTablet ? [{ scaleX: 1.3 }, { scaleY: 1.3 }] : []} />
              </View>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <TouchableOpacity style={styles.settingRow} onPress={handleStoragePress}>
                <View style={styles.settingLabelContainer}>
                  <HardDrive color={theme.colors.text} size={isTablet ? 24 : 20} />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('storage.title')}</Text>
                </View>
                <ChevronRight color={theme.colors.textLight} size={isTablet ? 20 : 16} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textLight }]}>{t('profile.account')}</Text>
            <View style={[styles.settingsCard, { backgroundColor: theme.colors.card }]}>
              <TouchableOpacity style={styles.settingRow} onPress={handlePrivacyPolicyPress}>
                <View style={styles.settingLabelContainer}>
                  <Lock color={theme.colors.text} size={isTablet ? 24 : 20} />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.privacyPolicy')}</Text>
                </View>
                <ChevronRight color={theme.colors.textLight} size={isTablet ? 20 : 16} />
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <TouchableOpacity style={styles.settingRow} onPress={handleTermsOfUsePress}>
                <View style={styles.settingLabelContainer}>
                  <FileText color={theme.colors.text} size={isTablet ? 24 : 20} />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.termsOfUse')}</Text>
                </View>
                <ChevronRight color={theme.colors.textLight} size={isTablet ? 20 : 16} />
              </TouchableOpacity>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <TouchableOpacity style={styles.settingRow} onPress={handleHelpPress}>
                <View style={styles.settingLabelContainer}>
                  <HelpCircle color={theme.colors.text} size={isTablet ? 24 : 20} />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.help')}</Text>
                </View>
                <View style={styles.settingAction}>
                  <ChevronRight color={theme.colors.textLight} size={isTablet ? 20 : 16} />
                </View>
              </TouchableOpacity>

              {/* Sadece normal user için restore purchases ve delete account */}
              {!user?.isAnonymous && (
                <>
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                  <TouchableOpacity style={styles.settingRow} onPress={handleRestorePurchases} disabled={isRestoring}>
                    <View style={styles.settingLabelContainer}>
                      <RefreshCw color={theme.colors.text} size={isTablet ? 24 : 20} />
                      <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('subscription.restorePurchases')}</Text>
                    </View>
                    <View style={styles.settingAction}>
                      {isRestoring ? <ActivityIndicator size="small" color={theme.colors.primary} /> : <ChevronRight color={theme.colors.textLight} size={isTablet ? 20 : 16} />}
                    </View>
                  </TouchableOpacity>
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                  <TouchableOpacity style={styles.settingRow} onPress={handleClearData} disabled={isDeleting}>
                    <View style={styles.settingLabelContainer}>
                      <Trash2 color={theme.colors.error} size={isTablet ? 24 : 20} />
                      <Text style={[styles.settingLabel, { color: theme.colors.error }]}>{t('profile.clearData')}</Text>
                    </View>
                    {isDeleting
                      ? <ActivityIndicator size="small" color={theme.colors.error} />
                      : <ChevronRight color={theme.colors.textLight} size={isTablet ? 20 : 16} />
                    }
                  </TouchableOpacity>
                  <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
                </>
              )}

              <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
                <View style={styles.settingLabelContainer}>
                  <LogOut color={theme.colors.text} size={isTablet ? 24 : 20} />
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{t('profile.logout')}</Text>
                </View>
                <View style={styles.settingAction}>
                  <ChevronRight color={theme.colors.textLight} size={isTablet ? 20 : 16} />
                </View>
              </TouchableOpacity>
            </View>
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
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: isTablet ? 800 : undefined,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: isTablet ? 24 : 16,
    borderRadius: 20,
    marginBottom: 32,
  },
  profileInfo: {
    marginLeft: isTablet ? 24 : 16,
    flex: 1,
  },
  profileName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: isTablet ? 24 : 18,
    marginBottom: 8,
  },
  profileEmail: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 16 : 14,
    flexShrink: 1,
  },
  guestBadge: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 16 : 14,
  },
  guestUpgradeCard: {
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  accentBar: {
    width: 8,
    height: '100%',
  },
  guestUpgradeContent: {
    flex: 1,
    paddingVertical: isTablet ? 20 : 16,
    paddingHorizontal: isTablet ? 20 : 16,
  },
  guestUpgradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  guestUpgradeTextContainer: {
    flex: 1,
  },
  guestUpgradeTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: isTablet ? 19 : 17,
    flex: 1,
  },
  guestUpgradeDesc: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 16 : 14,
    lineHeight: isTablet ? 24 : 22,
    paddingLeft: isTablet ? 40 : 36, // İkon ile hizalamak için
  },
  guestFeaturesList: {
    gap: 10,
    paddingLeft: isTablet ? 40 : 36, // İkon ile hizalamak için
  },
  guestFeaturesTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: isTablet ? 16 : 14,
    marginBottom: 8,
  },
  guestFeature: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 15 : 13,
    lineHeight: isTablet ? 22 : 20,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: isTablet ? 16 : 14,
    marginBottom: 12,
    paddingHorizontal: 8,
    textTransform: 'uppercase',
  },
  settingsCard: {
    borderRadius: 20,
  },
  subscriptionCard: {
    padding: isTablet ? 20 : 16,
    borderRadius: 20,
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
    fontSize: isTablet ? 20 : 16,
    marginLeft: 12,
    textTransform: 'capitalize',
  },
  upgradeText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 14 : 12,
    marginTop: 4,
  },
  chevronIcon: {
    marginRight: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: isTablet ? 20 : 16,
    paddingHorizontal: isTablet ? 24 : 16,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 18 : 16,
    marginLeft: 16,
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 18 : 14,
    marginRight: 8,
  },
  divider: {
    height: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayText: {
    color: '#FFFFFF',
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 18 : 16,
    marginTop: 16,
  },
});