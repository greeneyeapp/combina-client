// app/subscription.tsx - Orijinal yapı korunarak iPad için yeniden boyutlandırıldı

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Linking, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Crown, CheckCircle2, Sparkles, Shirt, TrendingUp, ShieldX, Heart, Zap, ExternalLink
} from 'lucide-react-native';
import Button from '@/components/common/Button';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import Toast from 'react-native-toast-message';
import useAlertStore from '@/store/alertStore';
import { useRevenueCat } from '@/context/RevenueCatContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const IconMap: { [key: string]: React.ElementType } = {
  Shirt, TrendingUp, Sparkles, Heart, ShieldX
};

const getPackageIdentifier = (pkg: PurchasesPackage): 'premium_monthly' | 'premium_annual' | null => {
  const id = pkg.identifier.toLowerCase();
  if (id.includes('premium_annual')) return 'premium_annual';
  if (id.includes('premium_monthly')) return 'premium_monthly';
  return null;
}

const getPackageType = (pkg: PurchasesPackage): 'monthly' | 'yearly' | null => {
  const id = pkg.identifier.toLowerCase();
  if (id.includes('annual') || id.includes('yearly')) return 'yearly';
  if (id.includes('monthly')) return 'monthly';
  return null;
};

const mapEntitlementsToDetailedPlan = (entitlements: any): {
  plan: 'free' | 'premium';
  type: 'monthly' | 'yearly' | null;
  productIdentifier: string | null;
} => {
  if (!entitlements?.premium_access?.isActive) {
    return { plan: 'free', type: null, productIdentifier: null };
  }

  const productId = entitlements.premium_access.productIdentifier?.toLowerCase() || '';

  if (productId.includes('annual') || productId.includes('yearly')) {
    return {
      plan: 'premium',
      type: 'yearly',
      productIdentifier: entitlements.premium_access.productIdentifier
    };
  } else if (productId.includes('monthly')) {
    return {
      plan: 'premium',
      type: 'monthly',
      productIdentifier: entitlements.premium_access.productIdentifier
    };
  }

  return {
    plan: 'premium',
    type: 'monthly', // Default fallback
    productIdentifier: entitlements.premium_access.productIdentifier
  };
};

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { show: showAlert } = useAlertStore();
  const { customerInfo, isLoading: isRevenueCatLoading, currentPlan, refreshCustomerInfo } = useRevenueCat();
  const currentPlanInfo = customerInfo ? mapEntitlementsToDetailedPlan(customerInfo.entitlements.active) : { plan: 'free' as const, type: null, productIdentifier: null };
  const [isYearly, setIsYearly] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    const loadOfferings = async () => {
      setLoading(true);
      try {
        const availableOfferings = await Purchases.getOfferings();
        if (availableOfferings.current !== null) {
          setOfferings(availableOfferings.current);
        }
      } catch (error) {
        console.error(`Failed to load offerings on ${Platform.OS}:`, error);
      } finally {
        setLoading(false);
      }
    };
    loadOfferings();
  }, []);

  const proceedWithPurchase = async (packageToPurchase: PurchasesPackage, isUpgrade: boolean) => {
    setPurchasingId(packageToPurchase.identifier);
    try {
      await Purchases.purchasePackage(packageToPurchase);
      await refreshCustomerInfo();
      const successMessage = isUpgrade ? t('subscription.upgradeSuccessMessage') : t('subscription.purchaseSuccessMessage');
      Toast.show({
        type: 'success',
        text1: t('subscription.purchaseSuccessTitle'),
        text2: successMessage
      });
      router.back();
    } catch (error: any) {
      if (!error.userCancelled) {
        showAlert({
          title: t('subscription.purchaseFailTitle'),
          message: error.message || t('subscription.unexpectedError'),
          buttons: [{ text: t('common.ok') }]
        });
      }
    } finally {
      setPurchasingId(null);
    }
  };

  const manageSubscriptionInStore = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else {
      Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    const newPackageType = getPackageType(packageToPurchase);

    if (currentPlanInfo.plan === 'premium' && currentPlanInfo.type === newPackageType) {
      showAlert({
        title: t('subscription.alreadySubscribedTitle'),
        message: t('subscription.alreadySubscribedMessage'),
        buttons: [{ text: t('common.ok') }]
      });
      return;
    }

    if (currentPlanInfo.type === 'yearly' && newPackageType === 'monthly') {
      showAlert({
        title: t('subscription.downgradeTitle'),
        message: t('subscription.downgradeMessage'),
        buttons: [
          { text: t('common.cancel'), variant: 'outline' },
          { text: t('subscription.manageSubscription'), onPress: manageSubscriptionInStore }
        ]
      });
      return;
    }

    const isUpgrade = currentPlanInfo.type === 'monthly' && newPackageType === 'yearly';
    if (isUpgrade) {
      showAlert({
        title: t('subscription.upgradeConfirmTitle'),
        message: t('subscription.upgradeConfirmMessage'),
        buttons: [
          { text: t('common.cancel'), variant: 'outline' },
          { text: t('subscription.confirmUpgrade'), onPress: () => proceedWithPurchase(packageToPurchase, true) }
        ]
      });
      return;
    }
    proceedWithPurchase(packageToPurchase, false);
  };

  const renderCurrentSubscriptionStatus = () => {
    if (currentPlanInfo.plan !== 'premium' || !customerInfo) return null;
    return (
      <View style={[styles.statusContainer, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}>
        <View style={styles.statusHeader}>
          <Crown size={isTablet ? 22 : 18} color={theme.colors.primary} />
          <Text style={[styles.statusText, { color: theme.colors.primary }]}>
            {t('subscription.activeSubscription', { type: t(`subscription.${currentPlanInfo.type}`) })}
          </Text>
        </View>
        {customerInfo.entitlements.active.premium_access?.expirationDate && (
          <Text style={[styles.statusSubtext, { color: theme.colors.textLight }]}>
            {customerInfo.entitlements.active.premium_access.willRenew
              ? t('subscription.renewsOn', { date: new Date(customerInfo.entitlements.active.premium_access.expirationDate).toLocaleDateString() })
              : t('subscription.expiresOn', { date: new Date(customerInfo.entitlements.active.premium_access.expirationDate).toLocaleDateString() })
            }
          </Text>
        )}
      </View>
    );
  };

  const renderCurrentFreePlanInfo = () => {
    if (currentPlan !== 'free') return null;
    const freeFeatures = t('subscription.free.features', { returnObjects: true }) as string[];
    return (
      <View style={[styles.freePlanContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.freePlanHeader}>
          <Zap size={isTablet ? 22 : 18} color={theme.colors.textLight} />
          <Text style={[styles.freePlanTitle, { color: theme.colors.text }]}>{t('subscription.free.title')}</Text>
        </View>
        <View style={styles.freePlanFeatures}>
          {freeFeatures.map((feature, index) => (
            <Text key={index} style={[styles.freePlanFeatureText, { color: theme.colors.textLight }]}>• {feature}</Text>
          ))}
        </View>
      </View>
    );
  };

  const getYearlySavings = () => {
    if (!offerings) return 0;
    const yearlyPackage = offerings.availablePackages.find(p => getPackageIdentifier(p) === 'premium_annual');
    const monthlyPackage = offerings.availablePackages.find(p => getPackageIdentifier(p) === 'premium_monthly');
    if (yearlyPackage && monthlyPackage) {
      const yearlyPrice = yearlyPackage.product.price;
      const totalMonthlyPrice = monthlyPackage.product.price * 12;
      if (totalMonthlyPrice > 0) {
        return Math.round(((totalMonthlyPrice - yearlyPrice) / totalMonthlyPrice) * 100);
      }
    }
    return 0;
  }

  const renderPlanToggle = () => {
    if (!offerings) return null;
    const packages = offerings.availablePackages.filter(p => getPackageIdentifier(p));
    if (packages.length < 2) return null;
    const savings = getYearlySavings();
    return (
      <View style={[styles.toggleContainer, { backgroundColor: theme.colors.card }]}>
        <TouchableOpacity style={[styles.toggleOption, !isYearly && { backgroundColor: theme.colors.primary }]} onPress={() => setIsYearly(false)}>
          <Text style={[styles.toggleText, { color: !isYearly ? theme.colors.white : theme.colors.text }]}>{t('subscription.monthly')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleOption, isYearly && { backgroundColor: theme.colors.primary }]} onPress={() => setIsYearly(true)}>
          <Text style={[styles.toggleText, { color: isYearly ? theme.colors.white : theme.colors.text }]}>{t('subscription.yearly')}</Text>
          {savings > 0 && (<View style={[styles.saveBadge, { backgroundColor: theme.colors.success }]}><Text style={styles.saveText}>{t('subscription.saveUpTo', { percent: savings })}</Text></View>)}
        </TouchableOpacity>
      </View>
    );
  };

  const getButtonState = (packageType: 'monthly' | 'yearly') => {
    if (currentPlanInfo.plan === 'free') {
      return {
        label: t('subscription.startPlan', { plan: t(`subscription.${packageType}`) }),
        variant: 'primary' as const, disabled: false, icon: null,
        onPressAction: (pkg: PurchasesPackage) => handlePurchase(pkg),
      };
    }
    if (currentPlanInfo.type === packageType) {
      return {
        label: t('subscription.currentPlan'),
        variant: 'outline' as const, disabled: true,
        icon: <CheckCircle2 size={16} color={theme.colors.success} />,
        onPressAction: () => { },
      };
    }
    if (currentPlanInfo.type === 'monthly' && packageType === 'yearly') {
      return {
        label: t('subscription.upgradeToYearly'),
        variant: 'primary' as const, disabled: false,
        icon: <TrendingUp size={16} color="#FFFFFF" />,
        onPressAction: (pkg: PurchasesPackage) => handlePurchase(pkg),
      };
    }
    if (currentPlanInfo.type === 'yearly' && packageType === 'monthly') {
      return {
        label: t('subscription.manageInAppStore'),
        variant: 'outline' as const, disabled: false,
        icon: <ExternalLink size={16} color={theme.colors.primary} />,
        onPressAction: () => manageSubscriptionInStore(),
      };
    }
    return {
      label: t('subscription.selectPlan'),
      variant: 'primary' as const, disabled: false, icon: null,
      onPressAction: (pkg: PurchasesPackage) => handlePurchase(pkg),
    };
  };

  const renderSelectedPlan = () => {
    if (!offerings) return null;
    const selectedPackage = offerings.availablePackages.find(p => {
      const id = getPackageIdentifier(p);
      return isYearly ? id === 'premium_annual' : id === 'premium_monthly';
    });
    if (!selectedPackage) return null;

    const isLoading = purchasingId === selectedPackage.identifier;
    const packageType = isYearly ? 'yearly' : 'monthly';
    const savingsPercentage = getYearlySavings();
    const buttonState = getButtonState(packageType);
    const premiumFeatures = t('subscription.features', { returnObjects: true }) as { icon: string; text: string }[] || [];

    return (
      <View style={[styles.planCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary }]}>
        <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.premiumBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Crown size={isTablet ? 20 : 16} color="#FFFFFF" />
          <Text style={styles.premiumBadgeText}>{t('subscription.premium')}</Text>
        </LinearGradient>
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.text }]}>{selectedPackage.product.priceString}</Text>
            <Text style={[styles.priceUnit, { color: theme.colors.textLight }]}>/{isYearly ? t('subscription.year') : t('subscription.month')}</Text>
          </View>
          {isYearly && savingsPercentage > 0 && <Text style={[styles.priceSubtext, { color: theme.colors.success }]}>{t('subscription.savePercent', { percent: savingsPercentage })} {t('subscription.comparedToMonthly')}</Text>}
          {!isYearly && <Text style={[styles.priceSubtext, { color: theme.colors.textLight }]}>{t('subscription.billedMonthly')}</Text>}
        </View>
        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>{t('subscription.whatsIncluded')}</Text>
          {premiumFeatures.map((feature, index) => {
            const IconComponent = IconMap[feature.icon];
            return (
              <View key={index} style={styles.featureRow}>
                {IconComponent ? <IconComponent size={isTablet ? 22 : 18} color="#FFD700" /> : <View style={{ width: 18 }} />}
                <Text style={[styles.featureText, { color: theme.colors.text }]}>{feature.text}</Text>
              </View>
            );
          })}
        </View>
        <Button
          label={isLoading ? t('subscription.processing') : buttonState.label}
          onPress={() => buttonState.onPressAction(selectedPackage)}
          variant={buttonState.variant}
          style={styles.planButton}
          disabled={buttonState.disabled || isLoading}
          loading={isLoading}
          icon={buttonState.icon}
          size={isTablet ? 'large' : 'medium'}
        />
      </View>
    );
  };

  const renderContent = () => {
    if (loading || isRevenueCatLoading) {
      return (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.messageText, { color: theme.colors.text }]}>{t('subscription.loadingPlans')}</Text>
        </View>
      );
    }
    if (!offerings) {
      return (
        <View style={styles.centeredContainer}>
          <Text style={[styles.messageText, { color: theme.colors.textLight }]}>{t('subscription.loadError')}</Text>
        </View>
      );
    }
    return (
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
          {renderCurrentSubscriptionStatus()}
          {renderCurrentFreePlanInfo()}
          <View style={styles.heroSection}>
            <Crown color="#FFD700" size={isTablet ? 48 : 32} />
            <Text style={[styles.heroTitle, { color: theme.colors.text }]}>{t('subscription.premiumHeroTitle')}</Text>
            <Text style={[styles.heroSubtitle, { color: theme.colors.textLight }]}>{t('subscription.premiumHeroSubtitle')}</Text>
          </View>
          {renderPlanToggle()}
          {renderSelectedPlan()}

          {/* --- DEĞİŞİKLİK BURADA BAŞLIYOR --- */}
          <View style={styles.legalLinksContainer}>
            <TouchableOpacity onPress={() => Linking.openURL('https://greeneyeapp.com/privacy.html')}>
              <Text style={[styles.legalLinkText, { color: theme.colors.textLight }]}>
                {t('profile.privacyPolicy')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.legalLinkSeparator, { color: theme.colors.textLight }]}>•</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://greeneyeapp.com/terms-of-use.html')}>
              <Text style={[styles.legalLinkText, { color: theme.colors.textLight }]}>
                {t('profile.termsOfUse')}
              </Text>
            </TouchableOpacity>
          </View>
          {/* --- DEĞİŞİKLİK BİTTİ --- */}

        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.text} size={isTablet ? 28 : 24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('subscription.title')}</Text>
        <View style={{ width: isTablet ? 28 : 24 }} />
      </View>
      {renderContent()}
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  backButton: { padding: 8 },
  title: { fontFamily: 'PlayfairDisplay-Bold', fontSize: isTablet ? 30 : 24, flex: 1, textAlign: 'center' },
  content: { flex: 1 },
  scrollContent: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: isTablet ? 700 : undefined,
    paddingHorizontal: 16,
  },
  centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  messageText: { fontFamily: 'Montserrat-Medium', fontSize: isTablet ? 18 : 16 },
  statusContainer: { marginTop: 16, padding: isTablet ? 24 : 16, borderRadius: 16, borderWidth: 2 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusText: { fontFamily: 'Montserrat-Bold', fontSize: isTablet ? 18 : 16, marginLeft: 12 },
  statusSubtext: { fontFamily: 'Montserrat-Regular', fontSize: isTablet ? 16 : 14, marginLeft: isTablet ? 40 : 26 },
  freePlanContainer: { marginTop: 16, padding: isTablet ? 24 : 16, borderRadius: 16, borderWidth: 1 },
  freePlanHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  freePlanTitle: { fontFamily: 'Montserrat-Bold', fontSize: isTablet ? 18 : 14, marginLeft: 8 },
  freePlanFeatures: { gap: 8, marginBottom: 16, paddingLeft: 8 },
  freePlanFeatureText: { fontFamily: 'Montserrat-Regular', fontSize: isTablet ? 15 : 13, lineHeight: 22 },
  heroSection: { alignItems: 'center', paddingVertical: isTablet ? 48 : 24, paddingHorizontal: 24, paddingTop: 32 },
  heroTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: isTablet ? 40 : 28, textAlign: 'center', marginTop: 16, marginBottom: 12 },
  heroSubtitle: { fontFamily: 'Montserrat-Regular', fontSize: isTablet ? 18 : 16, textAlign: 'center', lineHeight: isTablet ? 28 : 22, maxWidth: 600 },
  toggleContainer: { flexDirection: 'row', marginBottom: 24, padding: 6, borderRadius: 16 },
  toggleOption: { flex: 1, paddingVertical: isTablet ? 16 : 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  toggleText: { fontFamily: 'Montserrat-Bold', fontSize: isTablet ? 16 : 14 },
  saveBadge: { position: 'absolute', top: -8, right: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  saveText: { fontSize: isTablet ? 12 : 10, fontFamily: 'Montserrat-Bold', color: '#FFFFFF' },
  planCard: { marginBottom: 32, padding: isTablet ? 32 : 24, borderRadius: 24, borderWidth: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginBottom: 24 },
  premiumBadgeText: { fontFamily: 'Montserrat-Bold', fontSize: isTablet ? 16 : 14, color: '#FFFFFF', marginLeft: 8 },
  priceSection: { marginBottom: 32 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  price: { fontFamily: 'PlayfairDisplay-Bold', fontSize: isTablet ? 48 : 36 },
  priceUnit: { fontFamily: 'Montserrat-Regular', fontSize: isTablet ? 20 : 16, marginLeft: 8 },
  priceSubtext: { fontFamily: 'Montserrat-Medium', fontSize: isTablet ? 16 : 14 },
  featuresContainer: { marginBottom: 32 },
  featuresTitle: { fontFamily: 'Montserrat-Bold', fontSize: isTablet ? 20 : 16, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  featureText: { fontFamily: 'Montserrat-Medium', fontSize: isTablet ? 18 : 14, marginLeft: 16, flex: 1 },
  planButton: { marginTop: 8 },

  // --- DEĞİŞİKLİK BURADA BAŞLIYOR ---
  legalLinksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  legalLinkText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 14 : 12,
    textDecorationLine: 'underline',
  },
  legalLinkSeparator: {
    marginHorizontal: 8,
    fontSize: 12,
  },
  // --- DEĞİŞİKLİK BİTTİ ---
});