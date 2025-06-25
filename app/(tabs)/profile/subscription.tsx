import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { 
  ArrowLeft, 
  Crown, 
  Star, 
  Check,
  Sparkles,
  Shirt,
  TrendingUp,
  ShieldX,
  CheckCircle2,
  Heart
} from 'lucide-react-native';
import Button from '@/components/common/Button';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import Toast from 'react-native-toast-message';
import useAlertStore from '@/store/alertStore';
import { purchasePackage } from '@/services/purchaseService';
import { useRevenueCat } from '@/hooks/useRevenueCat';

// RevenueCat metadata interface
interface OfferingMetadata {
  app_config?: {
    free_daily_suggestions: number;
    free_wardrobe_limit: number;
  };
  plans?: {
    premium?: {
      daily_suggestions: number;
      features: {
        advanced_tips: boolean;
        no_ads: boolean;
        pinterest_inspiration: boolean;
        priority_support: boolean;
      };
      wardrobe_limit: string | number;
    };
    standard?: {
      daily_suggestions: number;
      features: {
        advanced_tips: boolean;
        no_ads: boolean;
        pinterest_inspiration: boolean;
        priority_support: boolean;
      };
      wardrobe_limit: number;
    };
  };
}

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { show: showAlert } = useAlertStore();

  const { currentPlan, isLoading: isRevenueCatLoading } = useRevenueCat();

  const [isYearly, setIsYearly] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [metadata, setMetadata] = useState<OfferingMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  
  const planHierarchy = {
    free: 0,
    standard: 1,
    premium: 2,
  };

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      setLoading(false);
      return;
    }
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        setOffering(offerings.current);
        
        // Metadata'yı parse et
        try {
          const metadataString = offerings.current.metadata;
          if (metadataString && typeof metadataString === 'object') {
            setMetadata(metadataString as unknown as OfferingMetadata);
          } else if (typeof metadataString === 'string') {
            setMetadata(JSON.parse(metadataString) as OfferingMetadata);
          }
        } catch (error) {
          console.error('Failed to parse offering metadata:', error);
        }
      }
    } catch (error) {
      console.error('Failed to load offerings:', error);
      showAlert({
        title: t('common.error'),
        message: t('subscription.loadError'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    setPurchasingId(packageToPurchase.identifier);
    const result = await purchasePackage(packageToPurchase);
    
    if (result.success) {
      Toast.show({
        type: 'success',
        text1: t('subscription.purchaseSuccessTitle'),
        text2: t('subscription.purchaseSuccessMessage', { plan: result.newPlan }),
        position: 'top',
        visibilityTime: 3000
      });
      router.back();
    } else if (result.error !== 'Purchase was cancelled by user') {
      showAlert({
        title: t('subscription.purchaseFailTitle'),
        message: result.error || t('subscription.unexpectedError'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    }
    
    setPurchasingId(null);
  };

  const getPlanType = (pkg: PurchasesPackage): 'standard' | 'premium' => {
    // Package identifier'ından plan tipini belirle
    const identifier = pkg.identifier.toLowerCase();
    return identifier.includes('premium') ? 'premium' : 'standard';
  };
  
  const getPlanIcon = (planType: 'standard' | 'premium') => {
    const colors = { standard: theme.colors.primary, premium: '#FFD700' };
    return planType === 'premium' 
      ? <Crown color={colors.premium} size={24} /> 
      : <Star color={colors.standard} size={24} />;
  };

  const getPlanColor = (planType: 'standard' | 'premium') => {
    return planType === 'premium' ? '#FFD700' : theme.colors.primary;
  };
  
  const getPlanBackground = (planType: 'standard' | 'premium') => {
    if (planType === 'premium') return theme.mode === 'dark' ? 'rgba(255, 215, 0, 0.1)' : '#FFFBEA';
    return theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#EBF4FF';
  };

  const getPlanFeatures = (planType: 'standard' | 'premium') => {
    if (!metadata?.plans?.[planType]) return [];

    const planData = metadata.plans[planType]!;
    const features = [];

    // Wardrobe limit
    features.push({
      icon: <Shirt size={16} color={getPlanColor(planType)} />,
      text: planData.wardrobe_limit === 'unlimited' 
        ? t('subscription.features.unlimitedItems')
        : t('subscription.features.wardrobeItems', { count: Number(planData.wardrobe_limit) })
    });

    // Daily suggestions
    features.push({
      icon: <TrendingUp size={16} color={getPlanColor(planType)} />,
      text: t('subscription.features.dailySuggestions', { count: planData.daily_suggestions })
    });

    // Plan features
    if (planData.features?.no_ads) {
      features.push({
        icon: <ShieldX size={16} color={getPlanColor(planType)} />,
        text: t('subscription.features.noAds')
      });
    }

    if (planData.features?.advanced_tips) {
      features.push({
        icon: <Sparkles size={16} color={getPlanColor(planType)} />,
        text: t('subscription.features.advancedTips')
      });
    }

    if (planData.features?.pinterest_inspiration) {
      features.push({
        icon: <Heart size={16} color={getPlanColor(planType)} />,
        text: t('subscription.features.pinterestInspiration')
      });
    }

    if (planData.features?.priority_support) {
      features.push({
        icon: <Check size={16} color={getPlanColor(planType)} />,
        text: t('subscription.features.prioritySupport')
      });
    }

    return features;
  };

  const renderLoading = () => (
    <View style={styles.centeredContainer}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.messageText, { color: theme.colors.text }]}>{t('subscription.loadingPlans')}</Text>
    </View>
  );

  const renderNotAvailable = () => (
    <View style={styles.centeredContainer}>
      <Sparkles color={theme.colors.primary} size={48} />
      <Text style={[styles.heroTitle, { color: theme.colors.text }]}>{t('subscription.comingSoon')}</Text>
      <Text style={[styles.messageText, { color: theme.colors.textLight }]}>
        {Platform.OS === 'android' ? t('subscription.androidComingSoon') : t('subscription.loadError')}
      </Text>
    </View>
  );

  const renderPackageCard = (pkg: PurchasesPackage, isPopular: boolean) => {
    const cardPlanType = getPlanType(pkg);
    const planColor = getPlanColor(cardPlanType);
    const planBackground = getPlanBackground(cardPlanType);
    const isLoading = purchasingId === pkg.identifier;

    let buttonLabel = t('subscription.upgrade');
    let isButtonDisabled = purchasingId !== null;
    let buttonVariant: 'primary' | 'outline' = isPopular ? 'primary' : 'outline';
    let buttonIcon: React.ReactNode | null = null;

    const currentUserPlanLevel = planHierarchy[currentPlan];
    const cardPlanLevel = planHierarchy[cardPlanType];

    if (currentUserPlanLevel === cardPlanLevel) {
      buttonLabel = t('subscription.currentPlan', 'Current Plan');
      isButtonDisabled = true;
      buttonVariant = 'outline';
      buttonIcon = <CheckCircle2 size={16} color={theme.colors.success} />;
    } else if (currentUserPlanLevel > cardPlanLevel) {
      buttonLabel = t('subscription.downgradeNotPossible', 'Downgrade Not Available');
      isButtonDisabled = true;
      buttonVariant = 'outline';
    } else if (isLoading) {
      buttonLabel = t('subscription.processing');
    }
    
    if (currentUserPlanLevel < cardPlanLevel && isPopular) {
      buttonVariant = 'primary';
    } else if (currentUserPlanLevel < cardPlanLevel) {
      buttonVariant = 'outline';
    }
    
    const features = getPlanFeatures(cardPlanType);

    return (
      <View key={pkg.identifier} style={[
        styles.planCard, 
        { 
          backgroundColor: planBackground, 
          borderColor: isPopular && !isButtonDisabled ? planColor : theme.colors.border, 
          borderWidth: isPopular && !isButtonDisabled ? 2 : 1 
        }
      ]}>
        {isPopular && !isButtonDisabled && (
          <View style={[styles.popularBadge, { backgroundColor: planColor }]}>
            <Text style={[styles.popularText, { color: theme.mode === 'dark' ? '#000' : '#fff' }]}>
              {t('subscription.mostPopular')}
            </Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          {getPlanIcon(cardPlanType)}
          <Text style={[styles.planName, { color: planColor }]}>
            {t(`profile.plans.${cardPlanType}`)}
          </Text>
        </View>
        
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: theme.colors.text }]}>{pkg.product.priceString}</Text>
          <Text style={[styles.priceUnit, { color: theme.colors.textLight }]}>
            /{t(isYearly ? 'subscription.year' : 'subscription.month')}
          </Text>
        </View>
        {isYearly && (
          <Text style={[styles.priceNote, { color: theme.colors.textLight }]}>
            {/* Aylık fiyat hesaplaması göster */}
            {(pkg.product.price / 12).toLocaleString('tr-TR', { 
              style: 'currency', 
              currency: pkg.product.currencyCode,
              minimumFractionDigits: 2 
            })}/ay
          </Text>
        )}
        
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              {feature.icon}
              <Text style={[styles.featureText, { color: theme.colors.text }]}>{feature.text}</Text>
            </View>
          ))}
        </View>
        
        <Button
          label={buttonLabel}
          onPress={() => handlePurchase(pkg)}
          variant={buttonVariant}
          style={styles.planButton}
          disabled={isButtonDisabled}
          loading={isLoading}
          icon={buttonIcon}
        />
      </View>
    );
  };

  const renderContent = () => {
    if (loading || isRevenueCatLoading) return renderLoading();
    if (!offering && Platform.OS === 'ios') return renderNotAvailable();
    if (Platform.OS !== 'ios') return renderNotAvailable();

    const packages = isYearly 
      ? offering!.availablePackages.filter(p => p.packageType === 'ANNUAL') 
      : offering!.availablePackages.filter(p => p.packageType === 'MONTHLY');
    
    packages.sort((a, b) => (planHierarchy[getPlanType(b)] || 0) - (planHierarchy[getPlanType(a)] || 0));

    return (
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Sparkles color={theme.colors.primary} size={32} />
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>{t('subscription.heroTitle')}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textLight }]}>{t('subscription.heroSubtitle')}</Text>
        </View>

        <View style={styles.billingToggle}>
          <Text style={[styles.billingText, { color: !isYearly ? theme.colors.text : theme.colors.textLight }]}>
            {t('subscription.monthly')}
          </Text>
          <Switch
            value={isYearly}
            onValueChange={setIsYearly}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.white}
          />
          <Text style={[styles.billingText, { color: isYearly ? theme.colors.text : theme.colors.textLight }]}>
            {t('subscription.yearly')}
          </Text>
          {isYearly && (
            <View style={[styles.discountBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={[styles.discountText, { color: theme.colors.white }]}>
                {t('subscription.savePercent', { percent: 17 })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.plansContainer}>
          {packages.length > 0 ? packages.map((pkg, index) => renderPackageCard(pkg, index === 0)) : (
            <View style={styles.centeredContainer}>
               <Text style={[styles.messageText, { color: theme.colors.textLight }]}>
                 {t('subscription.loadError')}
               </Text>
            </View>
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
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('subscription.title')}</Text>
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
  messageText: { fontFamily: 'Montserrat-Medium', fontSize: 16, textAlign: 'center' },
  heroSection: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  heroTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, textAlign: 'center', marginTop: 16, marginBottom: 8 },
  heroSubtitle: { fontFamily: 'Montserrat-Regular', fontSize: 16, textAlign: 'center', lineHeight: 22 },
  billingToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, gap: 12 },
  billingText: { fontFamily: 'Montserrat-Bold', fontSize: 16 },
  discountBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 4 },
  discountText: { fontFamily: 'Montserrat-Bold', fontSize: 12 },
  plansContainer: { paddingHorizontal: 16, gap: 20, marginBottom: 48 },
  planCard: { padding: 24, borderRadius: 20, position: 'relative', overflow: 'hidden' },
  popularBadge: { position: 'absolute', top: 16, right: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  popularText: { fontFamily: 'Montserrat-Bold', fontSize: 12 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  planName: { fontFamily: 'Montserrat-Bold', fontSize: 22, marginLeft: 12, textTransform: 'capitalize' },
  priceSection: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 24 },
  price: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 40 },
  priceUnit: { fontFamily: 'Montserrat-Regular', fontSize: 16, marginLeft: 6, marginBottom: 4 },
  priceNote: { fontFamily: 'Montserrat-Regular', fontSize: 12, textAlign: 'center', marginBottom: 16 },
  featuresContainer: { marginBottom: 24, gap: 14 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureText: { fontFamily: 'Montserrat-Medium', fontSize: 14, marginLeft: 12, flex: 1 },
  planButton: { marginTop: 8 },
});