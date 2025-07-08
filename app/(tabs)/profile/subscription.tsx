// app/(tabs)/profile/subscription.tsx - Sadeleştirilmiş model

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft, Crown, CheckCircle2, Sparkles, Shirt, TrendingUp, ShieldX, Heart, Zap
} from 'lucide-react-native';
import Button from '@/components/common/Button';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import Toast from 'react-native-toast-message';
import useAlertStore from '@/store/alertStore';
import { purchasePackage } from '@/services/purchaseService';
import { useRevenueCat } from '@/hooks/useRevenueCat';

// Sadeleştirilmiş plan hiyerarşisi - sadece Premium paketler
const planHierarchy = {
  premium_monthly: 1,
  premium_annual: 2,
};

const getPackageIdentifier = (pkg: PurchasesPackage): keyof typeof planHierarchy | null => {
    const id = pkg.identifier.toLowerCase();
    if (id.includes('premium_annual')) return 'premium_annual';
    if (id.includes('premium_monthly')) return 'premium_monthly';
    return null;
}

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { show: showAlert } = useAlertStore();

  const { customerInfo, isLoading: isRevenueCatLoading, currentPlan } = useRevenueCat();
  const currentUserProductIdentifier = customerInfo?.entitlements.active.premium_access?.productIdentifier || null;

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
    
    // Kullanıcının zaten Premium aboneliği var mı kontrol et
    if (currentPlan === 'premium') {
      showAlert({
        title: t('subscription.alreadySubscribedTitle', 'Already Subscribed'),
        message: t('subscription.alreadySubscribedMessage', 'You already have an active Premium subscription. You can manage it through your App Store account.'),
        buttons: [{ text: t('common.ok') }]
      });
      setPurchasingId(null);
      return;
    }

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

    const isYearlyPackage = cardPackageId.includes('annual');
    const isLoading = purchasingId === pkg.identifier;
    
    const userHasYearly = !!currentUserProductIdentifier && (currentUserProductIdentifier.includes('annual') || currentUserProductIdentifier.includes('yearly'));
    const isCurrent = currentPlan === 'premium' && (userHasYearly === isYearlyPackage);
    
    const isMostPopular = isYearlyPackage; // Yıllık paketi en popüler yap
    let buttonLabel = t('subscription.selectPlan', 'Select Plan');
    let buttonVariant: 'primary' | 'outline' = 'outline';
    let buttonDisabled = isLoading;
    let buttonIcon = null;

    if (isCurrent) {
      buttonLabel = t('subscription.currentPlan');
      buttonDisabled = true;
      buttonIcon = <CheckCircle2 size={16} color={theme.colors.success} />;
    } else if (currentPlan === 'premium') {
      // Kullanıcının zaten Premium'u var ama farklı dönem
      buttonLabel = t('subscription.switchTo', 'Switch to {{period}}', { 
        period: isYearlyPackage ? 'Yearly' : 'Monthly' 
      });
      buttonVariant = 'outline';
    } else {
      if(isMostPopular) {
          buttonVariant = 'primary';
      }
    }

    // Yıllık pakette indirim yüzdesini hesapla
    let savingsPercentage = 0;
    if (isYearlyPackage && offerings) {
      const monthlyPackage = offerings.availablePackages.find(p => 
        getPackageIdentifier(p) === 'premium_monthly'
      );
      if (monthlyPackage) {
        const yearlyPrice = pkg.product.price;
        const monthlyPrice = monthlyPackage.product.price * 12;
        savingsPercentage = Math.round(((monthlyPrice - yearlyPrice) / monthlyPrice) * 100);
      }
    }

    const features = [
      { icon: <Shirt size={16} color="#FFD700" />, text: t('subscription.features.unlimitedItems') },
      { icon: <TrendingUp size={16} color="#FFD700" />, text: t('subscription.features.dailySuggestions', { count: 50 }) },
      { icon: <Sparkles size={16} color="#FFD700" />, text: t('subscription.features.advancedTips') },
      { icon: <Heart size={16} color="#FFD700" />, text: t('subscription.features.pinterestInspiration') },
      { icon: <ShieldX size={16} color="#FFD700" />, text: t('subscription.features.noAds') },
    ];

    return (
      <View key={pkg.identifier} style={[
        styles.planCard,
        {
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          borderColor: isCurrent ? '#FFD700' : (isMostPopular ? '#FFD700' : theme.colors.border),
          borderWidth: isCurrent || isMostPopular ? 2 : 1
        }
      ]}>
        {isMostPopular && (
          <View style={[styles.popularBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.popularText}>
              {savingsPercentage > 0 
                ? t('subscription.savePercent', { percent: savingsPercentage })
                : t('subscription.mostPopular')
              }
            </Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          <Crown color="#FFD700" size={24} />
          <Text style={[styles.planName, { color: '#FFD700' }]}>
            Premium {isYearlyPackage ? t('subscription.yearly') : t('subscription.monthly')}
          </Text>
        </View>
        
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: theme.colors.text }]}>{pkg.product.priceString}</Text>
          <Text style={[styles.priceUnit, { color: theme.colors.textLight }]}>
            /{t(isYearlyPackage ? 'subscription.year' : 'subscription.month')}
          </Text>
          {isYearlyPackage && savingsPercentage > 0 && (
            <Text style={[styles.savingsText, { color: theme.colors.success }]}>
              {t('subscription.savePercent', { percent: savingsPercentage })}
            </Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
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
  
  const renderCurrentFreePlanInfo = () => {
    if (currentPlan !== 'free') {
      return null;
    }

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

    // Sadece Premium paketleri filtrele
    const packages = offerings.availablePackages.filter(p => {
      const id = getPackageIdentifier(p);
      return id === 'premium_monthly' || id === 'premium_annual';
    });

    packages.sort((a, b) => {
        const levelA = planHierarchy[getPackageIdentifier(a) as keyof typeof planHierarchy] || 0;
        const levelB = planHierarchy[getPackageIdentifier(b) as keyof typeof planHierarchy] || 0;
        return levelA - levelB;
    });

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderCurrentFreePlanInfo()}
          
          <View style={styles.heroSection}>
              <Crown color="#FFD700" size={32} />
              <Text style={[styles.heroTitle, { color: theme.colors.text }]}>
                {t('subscription.premiumHeroTitle', 'Unlock Premium Features')}
              </Text>
              <Text style={[styles.heroSubtitle, { color: theme.colors.textLight }]}>
                {t('subscription.premiumHeroSubtitle', 'Get unlimited wardrobe items, advanced AI styling, and exclusive features.')}
              </Text>
          </View>
          
          <View style={styles.plansContainer}>
              {packages.length > 0 ? packages.map(pkg => renderPackageCard(pkg)) : (
                  <Text style={[styles.messageText, { color: theme.colors.textLight, textAlign: 'center' }]}>
                    {t('subscription.noPlansAvailable')}
                  </Text>
              )}
          </View>
          
          {/* Premium özelliklerini vurgulayan ekstra bölüm */}
          <View style={[styles.whyPremiumSection, { backgroundColor: theme.colors.primaryLight }]}>
            <Text style={[styles.whyPremiumTitle, { color: theme.colors.primary }]}>
              {t('subscription.whyPremiumTitle', 'Why Choose Premium?')}
            </Text>
            <Text style={[styles.whyPremiumText, { color: theme.colors.text }]}>
              {t('subscription.whyPremiumText', 'Transform your style with unlimited wardrobe space, personalized AI styling advice, and exclusive Pinterest integration for endless inspiration.')}
            </Text>
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
    
    plansContainer: { paddingHorizontal: 16, gap: 20, marginBottom: 32 },
    planCard: { padding: 24, borderRadius: 20, position: 'relative', overflow: 'hidden' },
    popularBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    popularText: { fontFamily: 'Montserrat-Bold', fontSize: 12, color: '#fff' },
    planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    planName: { fontFamily: 'Montserrat-Bold', fontSize: 22, marginLeft: 12 },
    priceSection: { marginBottom: 24 },
    price: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 40 },
    priceUnit: { fontFamily: 'Montserrat-Regular', fontSize: 16, marginTop: 4 },
    savingsText: { fontFamily: 'Montserrat-Bold', fontSize: 14, marginTop: 4 },
    featuresContainer: { marginBottom: 24, gap: 14 },
    featureRow: { flexDirection: 'row', alignItems: 'center' },
    featureText: { fontFamily: 'Montserrat-Medium', fontSize: 14, marginLeft: 12, flex: 1 },
    planButton: { marginTop: 8 },
    
    whyPremiumSection: {
      marginHorizontal: 16,
      marginBottom: 32,
      padding: 20,
      borderRadius: 16,
    },
    whyPremiumTitle: {
      fontFamily: 'Montserrat-Bold',
      fontSize: 18,
      marginBottom: 12,
      textAlign: 'center',
    },
    whyPremiumText: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
});