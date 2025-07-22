// app/(tabs)/suggestions/index.tsx - iPad için ortalanmış ve orantılı tasarım

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Linking, ScrollView, LayoutChangeEvent, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { useOutfitStore, Outfit } from '@/store/outfitStore';
import { useWeatherStore } from '@/store/weatherStore';
import { useAuth } from '@/context/AuthContext';
import { useUserPlanStore } from '@/store/userPlanStore';
import { Cloud, Sun, RefreshCw, ExternalLink, Sparkles, Lightbulb, Heart, Film, Wand2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import HeaderBar from '@/components/common/HeaderBar';
import Button from '@/components/common/Button';
import OccasionPicker from '@/components/suggestions/OccasionPicker';
import OutfitSuggestion from '@/components/suggestions/OutfitSuggestion';
import OutfitLoadingAnimation from '@/components/suggestions/OutfitLoadingAnimation';
import WardrobeChecklist from '@/components/common/WardrobeChecklist';
import { getWeatherCondition } from '@/utils/weatherUtils';
import { router } from 'expo-router';
import { getOutfitSuggestion, OutfitSuggestionResponse } from '@/services/aiService';
import { getUserProfile, grantExtraSuggestion } from '@/services/userService';
import { GENDERED_CATEGORY_HIERARCHY } from '@/utils/constants';
import Toast from 'react-native-toast-message';
import useAlertStore from '@/store/alertStore';
import { useWardrobeLimit } from '@/hooks/useWardrobeLimit';
import { CustomBannerAd } from '@/components/ads/BannerAd';
import { useRewardedAd } from '@/hooks/useRewardedAd';
import { useRevenueCat } from '@/context/RevenueCatContext';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface PinterestLink {
  title: string;
  url: string;
}

export default function SuggestionsScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  const { outfits, addOutfit } = useOutfitStore();
  const { weather, loading: weatherLoading, fetchWeather, error: weatherError } = useWeatherStore();
  const { user } = useAuth();
  const { userPlan } = useUserPlanStore();
  const { limitInfo, isLoading: isLimitLoading } = useWardrobeLimit();
  const { show: showAlert } = useAlertStore();
  const scrollViewRef = useRef<ScrollView>(null);
  const [suggestion, setSuggestion] = useState<OutfitSuggestionResponse | null>(null);
  const [suggestionLayoutY, setSuggestionLayoutY] = useState<number>(0);
  const [selectedOccasion, setSelectedOccasion] = useState('daily-errands');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinterestLinks, setPinterestLinks] = useState<PinterestLink[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const { currentPlan, isLoading: isRevenueCatLoading } = useRevenueCat();
  const rewardedAd = useRewardedAd();
  const [isRetryingAfterAd, setIsRetryingAfterAd] = useState(false);
  const availableClothing = useMemo(() => clothing.filter(item => !item.isImageMissing), [clothing]);
  const isAlreadyLiked = useMemo(() => !!suggestion && outfits.some(o => o.items.length === suggestion.items.length && o.items.every(id => suggestion.items.map(i => i.id).includes(id))), [suggestion, outfits]);
  const getShowAdIcon = () => {
    if (currentPlan === 'premium') return false;
    if (userPlan && userPlan.usage) {
      const { daily_limit, current_usage, rewarded_count = 0 } = userPlan.usage;
      const totalAvailable = daily_limit + rewarded_count;
      return current_usage >= totalAvailable;
    }
    return false;
  };

  useEffect(() => {
    if (!weather && !weatherLoading) fetchWeather();
  }, []);

  useEffect(() => {
    setIsLiked(false);
    setPinterestLinks(suggestion?.pinterest_links || []);
  }, [suggestion]);

  useEffect(() => {
    if (suggestion && suggestionLayoutY > 0) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: suggestionLayoutY, animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [suggestionLayoutY, suggestion]);

  useEffect(() => {
    const handleReward = async () => {
      if (rewardedAd.isEarned && !isRetryingAfterAd) {
        Toast.show({
          type: 'success', text1: t('suggestions.rewardedAd.rewardGranted'),
          text2: t('suggestions.rewardedAd.extraSuggestionInfo'), position: 'top'
        });
        setIsRetryingAfterAd(true);
        await grantExtraSuggestion();
        await handleGenerateSuggestion(true);
        setIsRetryingAfterAd(false);
      }
    };
    handleReward();
  }, [rewardedAd.isEarned, isRetryingAfterAd]);

  const wardrobeStatus = useMemo(() => {
    const required: Record<string, number> = { top: 2, bottom: 2, outerwear: 2, shoes: 2 };
    const gender = userPlan?.gender || 'female';
    const hierarchy = gender === 'male' ? GENDERED_CATEGORY_HIERARCHY.male : GENDERED_CATEGORY_HIERARCHY.female;
    const counts: Record<string, number> = {};
    Object.keys(required).forEach(key => counts[key] = 0);
    availableClothing.forEach(item => {
      for (const [mainCat, subcats] of Object.entries(hierarchy)) {
        if ((subcats as string[]).includes(item.category)) {
          if (counts[mainCat] !== undefined) counts[mainCat]++;
          break;
        }
      }
    });
    const missing = Object.entries(required)
      .filter(([mainCat, minCount]) => (counts[mainCat] || 0) < minCount)
      .map(([mainCat, minCount]) => ({ category: t(`categories.${mainCat}`), needed: minCount - (counts[mainCat] || 0) }));
    return { hasEnough: missing.length === 0, missing, counts };
  }, [availableClothing, t, userPlan?.gender]);

  const handleLike = () => {
    if (!suggestion) return;
    if (isAlreadyLiked) {
      Toast.show({ type: 'info', text1: t('suggestions.alreadyLiked'), position: 'top', visibilityTime: 2000, topOffset: 50 });
      return;
    }
    const weatherCondition = getWeatherCondition(weather as any);
    const newOutfit: Outfit = {
      id: Date.now().toString(), items: suggestion.items.map(i => i.id),
      occasion: selectedOccasion, weather: weatherCondition, date: new Date().toISOString(),
      description: suggestion.description, suggestion_tip: suggestion.suggestion_tip || '',
    };
    addOutfit(newOutfit);
    setIsLiked(true);
    Toast.show({ type: 'success', text1: t('suggestions.likeSuccess'), text2: t('suggestions.likeInfo'), position: 'top', visibilityTime: 2500, topOffset: 50 });
  };

  const handleGenerateSuggestion = async (bypassLimitCheck = false) => {
    if (isLimitLoading || !limitInfo) return;
    if (!wardrobeStatus.hasEnough || !weather) return;
    if (limitInfo.isLimitReached) {
      showAlert({
        title: t('suggestions.wardrobeLimitReachedTitle'),
        message: t('suggestions.wardrobeLimitReachedMessage', { plan: t(`profile.plans.${limitInfo.plan}`), limit: limitInfo.limit }),
        buttons: [{ text: t('common.cancel'), variant: 'outline', onPress: () => { } }, { text: t('profile.upgrade'), onPress: () => router.push('/subscription' as any), variant: 'primary' }]
      });
      return;
    }
    if (currentPlan !== 'premium' && !bypassLimitCheck && userPlan?.usage) {
      const { daily_limit, current_usage, rewarded_count = 0 } = userPlan.usage;
      const totalAvailable = daily_limit + rewarded_count;
      if (current_usage >= totalAvailable) {
        showAlert({
          title: t('suggestions.rewardedAd.title'), message: t('suggestions.rewardedAd.message'),
          buttons: [
            { text: t('common.cancel'), onPress: () => { }, variant: 'outline' },
            { text: t('suggestions.rewardedAd.watchAdButton'), onPress: () => { if (rewardedAd.isLoaded) { rewardedAd.show(); } else { Toast.show({ type: 'info', text1: t('suggestions.rewardedAd.adLoading') }); } }, variant: 'primary' }
          ],
        });
        return;
      }
    }
    setSuggestionLayoutY(0); setGenerating(true); setShowLoadingAnimation(true);
    setError(null); setSuggestion(null);
    try {
      const weatherCondition = getWeatherCondition(weather as any);
      const last5 = outfits.slice(0, 5);
      const result = await getOutfitSuggestion(i18n.language, userPlan?.gender as 'female' | 'male' | undefined, limitInfo.plan, availableClothing, last5, weatherCondition, selectedOccasion);
      if (result) {
        setSuggestion(result); await getUserProfile(true);
      } else {
        setError(t('suggestions.genericError'));
      }
    } catch (err) {
      console.error("Critical error in suggestion screen:", err);
      setError(t('suggestions.genericError'));
    } finally {
      setGenerating(false);
      setTimeout(() => { setShowLoadingAnimation(false); }, 500);
    }
  };

  const handlePinterestLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) { await Linking.openURL(url); } else { router.push({ pathname: '/webview' as any, params: { url } }); }
    } catch (error) {
      console.error('Error opening Pinterest link:', error);
      Toast.show({ type: 'error', text1: t('suggestions.linkError') || 'Could not open link', position: 'top', visibilityTime: 2000, topOffset: 50 });
    }
  };

  const getWeatherIcon = () => {
    if (!weather) return null;
    const cond = getWeatherCondition(weather);
    return ['sunny', 'hot', 'warm'].includes(cond) ? <Sun color={theme.colors.accent} size={isTablet ? 24 : 20} /> : <Cloud color={theme.colors.accent} size={isTablet ? 24 : 20} />;
  };

  const renderUsageInfo = () => {
    if (isRevenueCatLoading || !userPlan || !userPlan.usage) {
      return (
        <View style={[styles.usageContainer, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }
    const isUnlimited = currentPlan === 'premium';
    return (
      <LinearGradient colors={[theme.colors.primaryLight, theme.colors.card]} style={styles.usageContainer}>
        <View style={styles.usageHeader}>
          <Text style={[styles.usageTitle, { color: theme.colors.text }]}>{isUnlimited ? t('suggestions.unlimitedAccess') : t('suggestions.dailyUsage')}</Text>
          {!isUnlimited && (<TouchableOpacity onPress={() => router.push('/subscription' as any)}><Text style={[styles.upgradeLink, { color: theme.colors.primary }]}>{t('profile.upgrade')} ✨</Text></TouchableOpacity>)}
        </View>
        {isUnlimited ? (
          <View style={styles.unlimitedContainer}>
            <Text style={[styles.unlimitedText, { color: theme.colors.primary }]}>{t('suggestions.unlimitedSuggestionsText')}</Text>
            <View style={styles.unlimitedIndicator}><Text style={[styles.infinitySymbol, { color: theme.colors.primary }]}>∞</Text></View>
          </View>
        ) : (
          (() => {
            const { daily_limit, current_usage, rewarded_count = 0 } = userPlan.usage;
            const numericDailyLimit = typeof daily_limit === 'number' ? daily_limit : 2;
            const totalAvailable = numericDailyLimit + rewarded_count;
            const usedAmount = current_usage;
            const percentage = totalAvailable > 0 ? (usedAmount / totalAvailable) * 100 : 0;
            return (
              <>
                <Text style={[styles.usageText, { color: theme.colors.text }]}>
                  {t('suggestions.usageLimitInfo', { used: usedAmount, total: totalAvailable })}
                  {rewarded_count > 0 && ` (+${rewarded_count} ${t('suggestions.rewarded', 'rewarded')})`}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
                  <View style={[styles.progressFill, { backgroundColor: percentage > 80 ? theme.colors.warning : theme.colors.primary, width: `${Math.min(100, percentage)}%` }]} />
                </View>
              </>
            );
          })()
        )}
      </LinearGradient>
    );
  };

  const renderEmptyState = () => {
    if (suggestion) return null;
    return (
      <View style={[styles.emptyStateContainer, { backgroundColor: theme.colors.primaryLight }]} onLayout={(event: LayoutChangeEvent) => {
        if (event.nativeEvent.layout.y > 0 && suggestionLayoutY === 0) setSuggestionLayoutY(event.nativeEvent.layout.y);
      }}>
        <LinearGradient colors={[theme.colors.primaryLight, 'transparent']} style={styles.emptyStateGradient}>
          <View style={styles.emptyStateIconContainer}><Sparkles color={theme.colors.primary} size={isTablet ? 64 : 48} /></View>
          <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>{t('suggestions.readyToSuggest')}</Text>
          <Text style={[styles.emptyStateMessage, { color: theme.colors.text }]}>{t('suggestions.emptyStateMessage')}</Text>
          <View style={styles.emptyStateFeatures}>
            <View style={styles.featureItem}><Lightbulb color={theme.colors.primary} size={isTablet ? 24 : 20} /><Text style={[styles.featureText, { color: theme.colors.text }]}>{t('suggestions.featureAI')}</Text></View>
            <View style={styles.featureItem}><Sun color={theme.colors.accent} size={isTablet ? 24 : 20} /><Text style={[styles.featureText, { color: theme.colors.text }]}>{t('suggestions.featureWeather')}</Text></View>
            <View style={styles.featureItem}><Heart color={theme.colors.primary} size={isTablet ? 24 : 20} /><Text style={[styles.featureText, { color: theme.colors.text }]}>{t('suggestions.featurePersonal')}</Text></View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderContent = () => {
    if (!wardrobeStatus.hasEnough) {
      return (<WardrobeChecklist counts={wardrobeStatus.counts} onButtonPress={() => { try { router.push('/wardrobe/add' as any); } catch (error) { console.error('Router error:', error); } }} />);
    }
    return (
      <>
        {renderUsageInfo()}
        <View style={styles.weatherSection}>
          {weatherLoading ? <ActivityIndicator color={theme.colors.primary} /> : weather ? (
            <View style={styles.weatherInfo}>
              {getWeatherIcon()}
              <Text style={[styles.weatherText, { color: theme.colors.text }]}>{weather.location}, {weather.temperature}°C - {t(`weather.${getWeatherCondition(weather)}`)}</Text>
              <TouchableOpacity style={styles.refreshButton} onPress={fetchWeather}><RefreshCw color={theme.colors.textLight} size={16} /></TouchableOpacity>
            </View>
          ) : (<TouchableOpacity style={styles.weatherError} onPress={fetchWeather}><Text style={[styles.weatherErrorText, { color: theme.colors.error }]}>{weatherError === 'Location permission denied' ? t('permissions.locationRequiredTitle') : t('suggestions.weatherError')}</Text><RefreshCw color={theme.colors.error} size={16} /></TouchableOpacity>)}
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('suggestions.selectOccasion')}</Text>
        <OccasionPicker selectedOccasion={selectedOccasion} onSelectOccasion={setSelectedOccasion} />
        <Button label={generating ? t('suggestions.generating') : t('suggestions.generateOutfit')} onPress={() => handleGenerateSuggestion()} variant="primary" loading={generating} style={styles.generateButton} disabled={generating || !wardrobeStatus.hasEnough || !weather || !selectedOccasion || isLimitLoading} icon={getShowAdIcon() ? <Film color={theme.colors.white} size={18} /> : <Wand2 color={theme.colors.white} size={18} />} />
        {!!error && (<View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}><Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text></View>)}
        {renderEmptyState()}
        <View onLayout={(event: LayoutChangeEvent) => { if (event.nativeEvent.layout.y > 0 && suggestionLayoutY === 0 && suggestion) setSuggestionLayoutY(event.nativeEvent.layout.y); }}>
          {suggestion && (<OutfitSuggestion outfit={suggestion} onLike={handleLike} liked={isAlreadyLiked} />)}
          {pinterestLinks.length > 0 && (
            <View style={styles.inspirationSection}>
              <Text style={[styles.inspirationTitle, { color: theme.colors.text }]}>{t('suggestions.inspirationTitle')}</Text>
              {pinterestLinks.map((item, index) => (
                <TouchableOpacity key={`pinterest-${index}`} style={[styles.pinterestCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, shadowColor: theme.colors.text }]} onPress={() => handlePinterestLinkPress(item.url)} activeOpacity={0.7}>
                  <View style={styles.pinterestContent}><ExternalLink color={theme.colors.primary} size={20} /><Text style={[styles.pinterestTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.title}</Text></View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
        <View style={styles.adContainer}><CustomBannerAd /></View>
      </>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('suggestions.title')} />
      <OutfitLoadingAnimation isVisible={showLoadingAnimation} onComplete={() => setShowLoadingAnimation(false)} />
      <ScrollView ref={scrollViewRef} style={styles.scrollContainer} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.contentWrapper}>
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  contentContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    flexGrow: 1, // YENİ: Dikeyde büyümeyi sağlar
  },
  contentWrapper: {
    width: '100%',
    maxWidth: isTablet ? 700 : undefined, // DEĞİŞİKLİK: Genişliği biraz azalttık
    paddingHorizontal: 16,
    flex: 1, // YENİ: Alanı doldurmasını sağlar
  },
  usageContainer: {
    marginBottom: 24, // Boşluk arttı
    padding: isTablet ? 24 : 16,
    borderRadius: 20,
    minHeight: 90,
  },
  unlimitedContainer: { alignItems: 'center', gap: 8 },
  unlimitedText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: isTablet ? 18 : 14,
    textAlign: 'center',
  },
  unlimitedIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  infinitySymbol: {
    fontFamily: 'Montserrat-Bold',
    fontSize: isTablet ? 32 : 24,
  },
  usageHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12, // Boşluk arttı
  },
  usageTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: isTablet ? 20 : 14, // Büyüdü
  },
  upgradeLink: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 16 : 12, // Büyüdü
  },
  usageText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 16 : 12, // Büyüdü
    marginBottom: 12,
  },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  weatherSection: { alignItems: 'center', marginBottom: 16 },
  weatherInfo: { flexDirection: 'row', alignItems: 'center' },
  weatherText: { fontFamily: 'Montserrat-Medium', fontSize: isTablet ? 20 : 16, marginLeft: 12 },
  refreshButton: { padding: 8, marginLeft: 8 },
  weatherError: { flexDirection: 'row', alignItems: 'center' },
  weatherErrorText: { fontFamily: 'Montserrat-Medium', fontSize: isTablet ? 18 : 14, marginRight: 8 },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: isTablet ? 22 : 16, // Büyüdü
    marginBottom: 16,
    marginTop: 24,
  },
  generateButton: { marginTop: 32, marginBottom: 24, paddingVertical: isTablet ? 20 : 12 }, // Büyüdü
  adContainer: { alignItems: 'center', marginVertical: 16 },
  errorContainer: { padding: 16, borderRadius: 12, marginBottom: 16 },
  errorText: { fontFamily: 'Montserrat-Medium', fontSize: isTablet ? 16 : 14 },
  emptyStateContainer: {
    borderRadius: 20, marginTop: 32, marginBottom: 16, overflow: 'hidden',
    flex: 1, alignSelf: 'stretch', justifyContent: 'center',
  },
  emptyStateGradient: { padding: isTablet ? 48 : 32, alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyStateIconContainer: { marginBottom: 24 },
  emptyStateTitle: {
    fontSize: isTablet ? 32 : 20, // Büyüdü
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center', marginBottom: 16,
  },
  emptyStateMessage: {
    fontSize: isTablet ? 18 : 14, // Büyüdü
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center', lineHeight: isTablet ? 28 : 20,
    marginBottom: 32, paddingHorizontal: 16,
  },
  emptyStateFeatures: { gap: 16, alignSelf: 'stretch' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  featureText: { fontSize: isTablet ? 18 : 14, fontFamily: 'Montserrat-Medium' }, // Büyüdü
  inspirationSection: { marginTop: 24, marginBottom: 16 },
  inspirationTitle: { fontFamily: 'Montserrat-Bold', fontSize: 18, textAlign: 'center', marginBottom: 16 },
  pinterestCard: { borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 16, elevation: 2, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  pinterestContent: { flexDirection: 'row', alignItems: 'center' },
  pinterestTitle: { fontFamily: 'Montserrat-Medium', fontSize: 14, marginLeft: 12, flex: 1 },
});