// kodlar/app/(tabs)/profile/subscription.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft, Crown, Star, CheckCircle2, Sparkles, Shirt, TrendingUp, ShieldX, Heart, Zap
} from 'lucide-react-native';
import Button from '@/components/common/Button';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import Toast from 'react-native-toast-message';
import useAlertStore from '@/store/alertStore';
import { purchasePackage } from '@/services/purchaseService';
import { useRevenueCat } from '@/hooks/useRevenueCat';

// --- Hiyerarşi, artık RevenueCat ID'lerine dayanıyor ---
const planHierarchy = {
  standard_monthly: 1,
  standard_annual: 2,
  premium_monthly: 3,
  premium_annual: 4,
};

// --- DÜZELTME: Bu fonksiyon artık HER ZAMAN pkg.identifier kullanıyor ---
const getPackageIdentifier = (pkg: PurchasesPackage): keyof typeof planHierarchy | null => {
    const id = pkg.identifier.toLowerCase();
    if (id.includes('premium_annual')) return 'premium_annual';
    if (id.includes('premium_monthly')) return 'premium_monthly';
    if (id.includes('standard_annual')) return 'standard_annual';
    if (id.includes('standard_monthly')) return 'standard_monthly';
    return null;
}

const getPlanType = (pkgIdentifier: string): 'standard' | 'premium' => {
    return pkgIdentifier.includes('premium') ? 'premium' : 'standard';
};

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { show: showAlert } = useAlertStore();

  const { customerInfo, isLoading: isRevenueCatLoading, currentPlan } = useRevenueCat();
  const currentUserProductIdentifier = customerInfo?.entitlements.active.standard_access?.productIdentifier || customerInfo?.entitlements.active.premium_access?.productIdentifier || null;

  const [isYearly, setIsYearly] = useState(false);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

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

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    setPurchasingId(packageToPurchase.identifier);
    const result = await purchasePackage(packageToPurchase);
    if (result.success) {
      Toast.show({ type: 'success', text1: t('subscription.purchaseSuccessTitle') });
      router.back();
    } else if (result.error !== 'Purchase was cancelled by user') {
      showAlert({ title: t('subscription.purchaseFailTitle'), message: result.error || t('subscription.unexpectedError'), buttons: [{ text: t('common.ok') }] });
    }
    setPurchasingId(null);
  };

  const renderPackageCard = (pkg: PurchasesPackage) => {
    const cardPackageId = getPackageIdentifier(pkg);
    if (!cardPackageId) return null;

    const cardPlanType = getPlanType(cardPackageId);
    const planColor = cardPlanType === 'premium' ? '#FFD700' : theme.colors.primary;
    const planBackground = cardPlanType === 'premium' ? 'rgba(255, 215, 0, 0.1)' : theme.colors.primaryLight;
    const isLoading = purchasingId === pkg.identifier;
    
    const isSamePlanType = currentPlan === cardPlanType;
    const userHasYearly = !!currentUserProductIdentifier && (currentUserProductIdentifier.includes('annual') || currentUserProductIdentifier.includes('yearly'));
    const cardIsYearly = cardPackageId.includes('annual');
    const isCurrent = isSamePlanType && (userHasYearly === cardIsYearly);
    
    const isMostPopular = cardPackageId === 'premium_monthly' && !isYearly;
    let buttonLabel = t('subscription.selectPlan', 'Select Plan');
    let buttonVariant: 'primary' | 'outline' = 'outline';
    let buttonDisabled = isLoading;
    let buttonIcon = null;

    if (isCurrent) {
      buttonLabel = t('subscription.currentPlan');
      buttonDisabled = true;
      buttonIcon = <CheckCircle2 size={16} color={theme.colors.success} />;
    } else {
      if(isMostPopular) {
          buttonVariant = 'primary';
      }
    }

    const features = {
        standard: [
            { icon: <Shirt size={16} color={planColor} />, text: t('subscription.features.wardrobeItems', { count: 100 }) },
            { icon: <TrendingUp size={16} color={planColor} />, text: t('subscription.features.dailySuggestions', { count: 10 }) },
            { icon: <ShieldX size={16} color={planColor} />, text: t('subscription.features.noAds') },
        ],
        premium: [
            { icon: <Shirt size={16} color={planColor} />, text: t('subscription.features.unlimitedItems') },
            { icon: <TrendingUp size={16} color={planColor} />, text: t('subscription.features.dailySuggestions', { count: 50 }) },
            { icon: <Sparkles size={16} color={planColor} />, text: t('subscription.features.advancedTips') },
            { icon: <Heart size={16} color={planColor} />, text: t('subscription.features.pinterestInspiration') },
        ]
    };

    return (
      <View key={pkg.identifier} style={[
        styles.planCard,
        {
          backgroundColor: planBackground,
          borderColor: isCurrent ? planColor : (isMostPopular ? planColor : theme.colors.border),
          borderWidth: isCurrent || isMostPopular ? 2 : 1
        }
      ]}>
        {isMostPopular && <View style={[styles.popularBadge, { backgroundColor: planColor }]}><Text style={styles.popularText}>{t('subscription.mostPopular')}</Text></View>}
        <View style={styles.planHeader}>
          {cardPlanType === 'premium' ? <Crown color={planColor} size={24} /> : <Star color={planColor} size={24} />}
          <Text style={[styles.planName, { color: planColor }]}>{t(`profile.plans.${cardPlanType}`)}</Text>
        </View>
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: theme.colors.text }]}>{pkg.product.priceString}</Text>
          <Text style={[styles.priceUnit, { color: theme.colors.textLight }]}>/{t(pkg.identifier.includes('annual') ? 'subscription.year' : 'subscription.month')}</Text>
        </View>

        <View style={styles.featuresContainer}>
            {features[cardPlanType].map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                    {feature.icon}
                    <Text style={[styles.featureText, { color: theme.colors.text }]}>{feature.text}</Text>
                </View>
            ))}
        </View>

        <Button
          label={isLoading ? t('subscription.processing') : buttonLabel}
          onPress={() => handlePurchase(pkg)}
          variant={buttonVariant}
          style={styles.planButton}
          disabled={buttonDisabled}
          loading={isLoading}
          icon={buttonIcon}
        />
      </View>
    );
  };
  
  // --- YENİ FONKSİYON: MEVCUT FREE PLANI GÖSTEREN KUTU ---
  const renderCurrentFreePlanInfo = () => {
    // Eğer mevcut plan free değilse, bu kutuyu hiç gösterme.
    if (currentPlan !== 'free') {
      return null;
    }

    // Çeviri dosyasından özellikleri bir dizi olarak alıyoruz.
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

    const packages = isYearly
      ? offerings.availablePackages.filter(p => p.identifier.toLowerCase().includes('annual'))
      : offerings.availablePackages.filter(p => p.identifier.toLowerCase().includes('monthly'));

    packages.sort((a, b) => {
        const levelA = planHierarchy[getPackageIdentifier(a) as keyof typeof planHierarchy] || 0;
        const levelB = planHierarchy[getPackageIdentifier(b) as keyof typeof planHierarchy] || 0;
        return levelA - levelB;
    });

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* --- YENİ BİLGİLENDİRME KUTUSU BURADA GÖSTERİLİYOR --- */}
          {renderCurrentFreePlanInfo()}
          
          <View style={styles.heroSection}>
              <Sparkles color={theme.colors.primary} size={32} />
              <Text style={[styles.heroTitle, { color: theme.colors.text }]}>{t('subscription.heroTitle')}</Text>
              <Text style={[styles.heroSubtitle, { color: theme.colors.textLight }]}>{t('subscription.heroSubtitle')}</Text>
          </View>
          <View style={styles.billingToggle}>
              <Text style={[styles.billingText, { color: !isYearly ? theme.colors.text : theme.colors.textLight }]}>{t('subscription.monthly')}</Text>
              <Switch value={isYearly} onValueChange={setIsYearly} trackColor={{ false: theme.colors.border, true: theme.colors.primary }} thumbColor={theme.colors.white} />
              <Text style={[styles.billingText, { color: isYearly ? theme.colors.text : theme.colors.textLight }]}>{t('subscription.yearly')}</Text>
              {isYearly && <View style={[styles.discountBadge, { backgroundColor: theme.colors.success }]}><Text style={styles.discountText}>{t('subscription.savePercent', { percent: 17 })}</Text></View>}
          </View>
          <View style={styles.plansContainer}>
              {packages.length > 0 ? packages.map(pkg => renderPackageCard(pkg)) : (
                  <Text style={[styles.messageText, { color: theme.colors.textLight, textAlign: 'center' }]}>{t('subscription.noPlansAvailable')}</Text>
              )}
          </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
    backButton: { padding: 8 },
    title: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24 },
    content: { flex: 1 },
    centeredContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
    messageText: { fontFamily: 'Montserrat-Medium', fontSize: 16 },

    // --- YENİ STİLLER ---
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

    heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24, paddingTop: 32 },
    heroTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, textAlign: 'center', marginTop: 16, marginBottom: 8 },
    heroSubtitle: { fontFamily: 'Montserrat-Regular', fontSize: 16, textAlign: 'center', lineHeight: 22 },
    billingToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 12 },
    billingText: { fontFamily: 'Montserrat-Bold', fontSize: 16 },
    discountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 4 },
    discountText: { fontFamily: 'Montserrat-Bold', fontSize: 12, color: 'white' },
    plansContainer: { paddingHorizontal: 16, gap: 20, marginBottom: 48 },
    planCard: { padding: 24, borderRadius: 20, position: 'relative', overflow: 'hidden' },
    popularBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    popularText: { fontFamily: 'Montserrat-Bold', fontSize: 12, color: '#fff' },
    planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    planName: { fontFamily: 'Montserrat-Bold', fontSize: 22, marginLeft: 12, textTransform: 'capitalize' },
    priceSection: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 24 },
    price: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 40 },
    priceUnit: { fontFamily: 'Montserrat-Regular', fontSize: 16, marginLeft: 6, marginBottom: 4 },
    featuresContainer: { marginBottom: 24, gap: 14 },
    featureRow: { flexDirection: 'row', alignItems: 'center' },
    featureText: { fontFamily: 'Montserrat-Medium', fontSize: 14, marginLeft: 12, flex: 1 },
    planButton: { marginTop: 8 },
});