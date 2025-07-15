// app/(tabs)/profile/subscription.tsx - TAM VE DÜZELTİLMİŞ KOD

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Linking } from 'react-native';
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

// Çeviri dosyasındaki ikon isimlerini gerçek bileşenlerle eşleştirir
const IconMap: { [key: string]: React.ElementType } = {
  Shirt,
  TrendingUp,
  Sparkles,
  Heart,
  ShieldX,
};

// Plan hiyerarşisi (kullanılmıyor ama referans olarak kalabilir)
const planHierarchy = {
  premium_monthly: 1,
  premium_annual: 2,
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

  // Fallback
  return {
    plan: 'premium',
    type: 'monthly',
    productIdentifier: entitlements.premium_access.productIdentifier
  };
};


export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { show: showAlert } = useAlertStore();

  const { customerInfo, isLoading: isRevenueCatLoading, currentPlan } = useRevenueCat();
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

      const successMessage = isUpgrade
        ? t('subscription.upgradeSuccessMessage')
        : t('subscription.purchaseSuccessMessage');

      Toast.show({
        type: 'success',
        text1: t('subscription.purchaseSuccessTitle'),
        text2: successMessage
      });
      router.replace('/(tabs)/profile');

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

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    const newPackageType = getPackageType(packageToPurchase);

    // 1. Aynı plana tekrar abone olmasını engelle
    if (currentPlanInfo.plan === 'premium' && currentPlanInfo.type === newPackageType) {
      showAlert({
        title: t('subscription.alreadySubscribedTitle'),
        message: t('subscription.alreadySubscribedMessage'),
        buttons: [{ text: t('common.ok') }]
      });
      return;
    }

    // 2. Yıllıktan aylığa düşüşü engelle (App Store üzerinden yapılmalı)
    if (currentPlanInfo.type === 'yearly' && newPackageType === 'monthly') {
      showAlert({
        title: t('subscription.downgradeTitle'),
        message: t('subscription.downgradeMessage'),
        buttons: [
          { text: t('common.cancel'), variant: 'outline' },
          {
            text: t('subscription.manageSubscription'),
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('https://apps.apple.com/account/subscriptions');
              } else {
                Linking.openURL('https://play.google.com/store/account/subscriptions');
              }
            }
          }
        ]
      });
      return;
    }

    // 3. Aylıktan yıllığa yükseltme onayı
    const isUpgrade = currentPlanInfo.type === 'monthly' && newPackageType === 'yearly';
    if (isUpgrade) {
      showAlert({
        title: t('subscription.upgradeConfirmTitle'),
        message: t('subscription.upgradeConfirmMessage'),
        buttons: [
          { text: t('common.cancel'), variant: 'outline' },
          {
            text: t('subscription.confirmUpgrade'),
            onPress: () => proceedWithPurchase(packageToPurchase, true) // isUpgrade = true
          }
        ]
      });
      return;
    }

    // 4. Standart yeni satın alma
    proceedWithPurchase(packageToPurchase, false); // isUpgrade = false
  };

  const renderCurrentSubscriptionStatus = () => {
    if (currentPlanInfo.plan !== 'premium' || !customerInfo) return null;

    return (
      <View style={[styles.statusContainer, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}>
        <View style={styles.statusHeader}>
          <Crown size={18} color={theme.colors.primary} />
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
          <Zap size={18} color={theme.colors.textLight} />
          <Text style={[styles.freePlanTitle, { color: theme.colors.text }]}>
            {t('subscription.free.title')}
          </Text>
        </View>
        <View style={styles.freePlanFeatures}>
          {freeFeatures.map((feature, index) => (
            <Text key={index} style={[styles.freePlanFeatureText, { color: theme.colors.textLight }]}>
              • {feature}
            </Text>
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
        <TouchableOpacity
          style={[styles.toggleOption, !isYearly && { backgroundColor: theme.colors.primary }]}
          onPress={() => setIsYearly(false)}
        >
          <Text style={[styles.toggleText, { color: !isYearly ? theme.colors.white : theme.colors.text }]}>
            {t('subscription.monthly')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleOption, isYearly && { backgroundColor: theme.colors.primary }]}
          onPress={() => setIsYearly(true)}
        >
          <Text style={[styles.toggleText, { color: isYearly ? theme.colors.white : theme.colors.text }]}>
            {t('subscription.yearly')}
          </Text>
          {savings > 0 && (
            <View style={[styles.saveBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.saveText}>{t('subscription.saveUpTo', { percent: savings })}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const getButtonState = (packageType: 'monthly' | 'yearly') => {
    if (currentPlanInfo.plan === 'free') {
      return {
        label: t('subscription.startPlan', { plan: t(`subscription.${packageType}`) }),
        variant: 'primary' as const,
        disabled: false,
        icon: null
      };
    }

    if (currentPlanInfo.type === packageType) {
      return {
        label: t('subscription.currentPlan'),
        variant: 'outline' as const,
        disabled: true,
        icon: <CheckCircle2 size={16} color={theme.colors.success} />
      };
    }

    if (currentPlanInfo.type === 'monthly' && packageType === 'yearly') {
      return {
        label: t('subscription.upgradeToYearly'),
        variant: 'primary' as const,
        disabled: false,
        icon: <TrendingUp size={16} color="#FFFFFF" />
      };
    }

    if (currentPlanInfo.type === 'yearly' && packageType === 'monthly') {
      return {
        label: t('subscription.manageInAppStore'),
        variant: 'outline' as const,
        disabled: false, // This button will trigger the alert, so it shouldn't be disabled
        icon: <ExternalLink size={16} color={theme.colors.primary} />
      };
    }

    return {
      label: t('subscription.selectPlan'),
      variant: 'primary' as const,
      disabled: false,
      icon: null
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
      <View style={[styles.planCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.primary }]}>
        <LinearGradient
          colors={['#FFD700', '#FFA500']}
          style={styles.premiumBadge}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        >
          <Crown size={16} color="#FFFFFF" />
          <Text style={styles.premiumBadgeText}>{t('subscription.premium')}</Text>
        </LinearGradient>

        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.text }]}>
              {selectedPackage.product.priceString}
            </Text>
            <Text style={[styles.priceUnit, { color: theme.colors.textLight }]}>
              /{isYearly ? t('subscription.year') : t('subscription.month')}
            </Text>
          </View>

          {isYearly && savingsPercentage > 0 && (
            <Text style={[styles.priceSubtext, { color: theme.colors.success }]}>
              {t('subscription.savePercent', { percent: savingsPercentage })} {t('subscription.comparedToMonthly')}
            </Text>
          )}

          {!isYearly && (
            <Text style={[styles.priceSubtext, { color: theme.colors.textLight }]}>
              {t('subscription.billedMonthly')}
            </Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
            {t('subscription.whatsIncluded')}
          </Text>
          {premiumFeatures.map((feature, index) => {
            const IconComponent = IconMap[feature.icon];
            return (
              <View key={index} style={styles.featureRow}>
                {IconComponent ? <IconComponent size={18} color="#FFD700" /> : <View style={{ width: 18 }} />}
                <Text style={[styles.featureText, { color: theme.colors.text }]}>{feature.text}</Text>
              </View>
            );
          })}
        </View>

        <Button
          label={isLoading ? t('subscription.processing') : buttonState.label}
          onPress={() => handlePurchase(selectedPackage)}
          variant={buttonState.variant}
          style={styles.planButton}
          disabled={buttonState.disabled || isLoading}
          loading={isLoading}
          icon={buttonState.icon}
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentSubscriptionStatus()}
        {renderCurrentFreePlanInfo()}

        <View style={styles.heroSection}>
          <Crown color="#FFD700" size={32} />
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
            {t('subscription.premiumHeroTitle')}
          </Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textLight }]}>
            {t('subscription.premiumHeroSubtitle')}
          </Text>
        </View>

        {renderPlanToggle()}
        {renderSelectedPlan()}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/profile')} style={styles.backButton}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('subscription.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}

// Stillerin tamamı burada
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16
  },
  backButton: { padding: 8 },
  title: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24 },
  content: { flex: 1 },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 24
  },
  messageText: { fontFamily: 'Montserrat-Medium', fontSize: 16 },

  statusContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginLeft: 8,
  },
  statusSubtext: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    marginLeft: 26,
  },

  freePlanContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  freePlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  freePlanTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    marginLeft: 8,
  },
  freePlanFeatures: {
    gap: 6,
  },
  freePlanFeatureText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
    lineHeight: 18,
  },

  heroSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    paddingTop: 32
  },
  heroTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8
  },
  heroSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22
  },

  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 4,
    borderRadius: 12,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: 48,
  },
  toggleText: {
    fontFamily: 'Montserrat-Bold', // SemiBold'dan Bold'a değiştirildi
    fontSize: 14,
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveText: {
    fontSize: 10,
    fontFamily: 'Montserrat-Bold',
    color: '#FFFFFF',
  },

  planCard: {
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  premiumBadgeText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 6,
  },

  priceSection: { marginBottom: 24 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4
  },
  price: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 36
  },
  priceUnit: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    marginLeft: 4
  },
  priceSubtext: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },

  featuresContainer: { marginBottom: 24 },
  featuresTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  featureText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginLeft: 12,
    flex: 1
  },
  planButton: { marginTop: 8 },
});