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
  Shield
} from 'lucide-react-native';
import Button from '@/components/common/Button';
import Purchases, { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import Toast from 'react-native-toast-message';

interface PlanMetadata {
  wardrobe_limit: number | string;
  daily_suggestions: number;
  features: {
    no_ads: boolean;
    advanced_tips: boolean;
    pinterest_inspiration: boolean;
    priority_support: boolean;
  };
}

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isYearly, setIsYearly] = useState(false);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      if (Platform.OS !== 'ios') {
        setLoading(false);
        Toast.show({
          type: 'info',
          text1: t('subscription.notAvailable'),
          text2: t('subscription.iosOnly'),
          position: 'top',
        });
        return;
      }

      setLoading(true);
      const offerings = await Purchases.getOfferings();
      setOffering(offerings.current);
    } catch (error) {
      console.error('Failed to load offerings:', error);
      Toast.show({
        type: 'error',
        text1: t('subscription.loadError'),
        position: 'top',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packageToPurchase: PurchasesPackage) => {
    if (Platform.OS !== 'ios') {
      Toast.show({
        type: 'info',
        text1: t('subscription.purchaseNotAvailable'),
        text2: t('subscription.iosOnly'),
        position: 'top',
      });
      return;
    }

    try {
      setPurchasing(packageToPurchase.identifier);
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      if (customerInfo.entitlements.active.standard_access || 
          customerInfo.entitlements.active.premium_access) {
        Toast.show({
          type: 'success',
          text1: t('subscription.purchaseSuccessTitle'),
          text2: t('subscription.purchaseSuccessMessage'),
          position: 'top',
        });
        router.back();
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Toast.show({
          type: 'error',
          text1: t('subscription.purchaseFailTitle'),
          text2: error.message || t('common.tryAgain'),
          position: 'top',
        });
      }
    } finally {
      setPurchasing(null);
    }
  };

  const getPackagesByType = () => {
    if (!offering) return { monthly: [], yearly: [] };
    
    const monthly = offering.availablePackages.filter(pkg => 
      pkg.identifier.includes('monthly')
    );
    const yearly = offering.availablePackages.filter(pkg => 
      pkg.identifier.includes('annual')
    );
    
    return { monthly, yearly };
  };

  const getPlanType = (packageId: string): 'standard' | 'premium' => {
    return packageId.includes('premium') ? 'premium' : 'standard';
  };

  const getPlanMetadata = (planType: 'standard' | 'premium'): PlanMetadata => {
    const metadata = offering?.metadata;
    const fallbackData = {
      standard: {
        wardrobe_limit: 100,
        daily_suggestions: 10,
        features: { no_ads: true, advanced_tips: true, pinterest_inspiration: true, priority_support: false }
      },
      premium: {
        wardrobe_limit: 'unlimited',
        daily_suggestions: 50,
        features: { no_ads: true, advanced_tips: true, pinterest_inspiration: true, priority_support: true }
      }
    };
    return (metadata?.plans as Record<string, PlanMetadata>)?.[planType] || fallbackData[planType];
  };

  const getPlanIcon = (planType: 'standard' | 'premium') => {
    switch (planType) {
      case 'standard': return <Star color={theme.colors.primary} size={24} />;
      case 'premium': return <Crown color="#FFD700" size={24} />;
    }
  };

  const getPlanColor = (planType: 'standard' | 'premium') => {
    switch (planType) {
      case 'standard': return theme.colors.primary;
      case 'premium': return '#FFD700';
    }
  };

  const getPlanBackground = (planType: 'standard' | 'premium') => {
    switch (planType) {
      case 'standard': return theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#EBF4FF';
      case 'premium': return theme.mode === 'dark' ? 'rgba(255, 215, 0, 0.1)' : '#FFFBEA';
    }
  };

  const renderPackageCard = (pkg: PurchasesPackage, isPopular: boolean = false) => {
    const planType = getPlanType(pkg.identifier);
    const planMetadata = getPlanMetadata(planType);
    const planColor = getPlanColor(planType);
    const planBackground = getPlanBackground(planType);
    const isUnlimited = planMetadata.wardrobe_limit === 'unlimited';
    
    return (
      <View 
        key={pkg.identifier}
        style={[ styles.planCard, { backgroundColor: planBackground, borderColor: isPopular ? planColor : theme.colors.border, borderWidth: isPopular ? 2 : 1 }]}
      >
        {isPopular && (
          <View style={[styles.popularBadge, { backgroundColor: planColor }]}>
            <Text style={[styles.popularText, { color: theme.mode === 'dark' ? '#000' : '#fff' }]}>
              {t('subscription.mostPopular')}
            </Text>
          </View>
        )}
        
        <View style={styles.planHeader}>
          {getPlanIcon(planType)}
          <Text style={[styles.planName, { color: planColor }]}>
            {t(`subscription.plans.${planType}`)}
          </Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: theme.colors.text }]}>{pkg.product.priceString}</Text>
          <Text style={[styles.priceUnit, { color: theme.colors.textLight }]}>
            /{t(pkg.identifier.includes('annual') ? 'subscription.year' : 'subscription.month')}
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          <View style={styles.featureRow}>
            <Shirt color={planColor} size={16} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              {isUnlimited ? t('subscription.features.unlimitedItems') : t('subscription.features.wardrobeItems', { count: planMetadata.wardrobe_limit as number })}
            </Text>
          </View>
          
          <View style={styles.featureRow}>
            <TrendingUp color={planColor} size={16} />
            <Text style={[styles.featureText, { color: theme.colors.text }]}>
              {t('subscription.features.dailySuggestions', { count: planMetadata.daily_suggestions })}
            </Text>
          </View>

          {planMetadata.features.no_ads && (
            <View style={styles.featureRow}>
              <Shield color={planColor} size={16} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>{t('subscription.features.noAds')}</Text>
            </View>
          )}

          {planMetadata.features.advanced_tips && (
            <View style={styles.featureRow}>
              <Sparkles color={planColor} size={16} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>{t('subscription.features.advancedTips')}</Text>
            </View>
          )}

          {planMetadata.features.pinterest_inspiration && (
            <View style={styles.featureRow}>
              <Check color={planColor} size={16} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>{t('subscription.features.pinterestInspiration')}</Text>
            </View>
          )}

          {planMetadata.features.priority_support && (
            <View style={styles.featureRow}>
              <Check color={planColor} size={16} />
              <Text style={[styles.featureText, { color: theme.colors.text }]}>{t('subscription.features.prioritySupport')}</Text>
            </View>
          )}
        </View>

        <Button
          label={purchasing === pkg.identifier ? t('subscription.processing') : t('subscription.upgrade')}
          onPress={() => handlePurchase(pkg)}
          variant={isPopular ? 'primary' : 'outline'}
          style={styles.planButton}
          disabled={purchasing !== null}
          loading={purchasing === pkg.identifier}
        />
      </View>
    );
  };

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('subscription.title')}</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <View style={styles.notAvailableContainer}>
          <Sparkles color={theme.colors.primary} size={48} />
          <Text style={[styles.notAvailableTitle, { color: theme.colors.text }]}>{t('subscription.comingSoon')}</Text>
          <Text style={[styles.notAvailableText, { color: theme.colors.textLight }]}>{t('subscription.androidComingSoon')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('subscription.title')}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>{t('subscription.loadingPlans')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { monthly, yearly } = getPackagesByType();
  const packagesToShow = isYearly ? yearly : monthly;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={theme.colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t('subscription.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <Sparkles color={theme.colors.primary} size={32} />
          <Text style={[styles.heroTitle, { color: theme.colors.text }]}>{t('subscription.heroTitle')}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.colors.textLight }]}>{t('subscription.heroSubtitle')}</Text>
        </View>

        <View style={styles.billingToggle}>
          <Text style={[styles.billingText, { color: isYearly ? theme.colors.textLight : theme.colors.text }]}>{t('subscription.monthly')}</Text>
          <Switch
            value={isYearly}
            onValueChange={setIsYearly}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.mode === 'dark' ? '#fff' : '#fff'}
          />
          <Text style={[styles.billingText, { color: isYearly ? theme.colors.text : theme.colors.textLight }]}>{t('subscription.yearly')}</Text>
          {isYearly && (
            <View style={[styles.discountBadge, { backgroundColor: theme.colors.primary }]}>
              <Text style={[styles.discountText, { color: theme.mode === 'dark' ? '#000' : '#fff' }]}>
                {t('subscription.savePercent', { percent: 17 })}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.plansContainer}>
          {packagesToShow.map((pkg, index) => renderPackageCard(pkg, index === 0))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    backButton: { padding: 8 },
    title: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24 },
    content: { flex: 1 },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontFamily: 'Montserrat-Medium',
      fontSize: 16,
    },
    notAvailableContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      gap: 16,
    },
    notAvailableTitle: {
      fontFamily: 'PlayfairDisplay-Bold',
      fontSize: 24,
      textAlign: 'center',
    },
    notAvailableText: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
    },
    heroSection: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
    },
    heroTitle: {
      fontFamily: 'PlayfairDisplay-Bold',
      fontSize: 28,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
    },
    billingToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
      gap: 16,
    },
    billingText: {
      fontFamily: 'Montserrat-Medium',
      fontSize: 16,
    },
    discountBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginLeft: 8,
    },
    discountText: {
      fontFamily: 'Montserrat-Bold',
      fontSize: 12,
    },
    plansContainer: {
      paddingHorizontal: 16,
      gap: 16,
      marginBottom: 32,
    },
    planCard: {
      padding: 20,
      borderRadius: 16,
      position: 'relative',
    },
    popularBadge: {
      position: 'absolute',
      top: -8,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 16,
    },
    popularText: {
      fontFamily: 'Montserrat-Bold',
      fontSize: 12,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      marginTop: 8,
    },
    planName: {
      fontFamily: 'Montserrat-Bold',
      fontSize: 20,
      marginLeft: 12,
    },
    priceSection: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 20,
    },
    price: {
      fontFamily: 'PlayfairDisplay-Bold',
      fontSize: 32,
    },
    priceUnit: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 16,
      marginLeft: 4,
    },
    featuresContainer: {
      marginBottom: 24,
      gap: 12,
    },
    featureRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    featureText: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 14,
      marginLeft: 12,
      flex: 1,
    },
    planButton: {
      marginTop: 8,
    },
});