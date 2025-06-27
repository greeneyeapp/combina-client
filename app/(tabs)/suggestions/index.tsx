import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
  LayoutChangeEvent
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { useOutfitStore, Outfit } from '@/store/outfitStore';
import { useWeatherStore } from '@/store/weatherStore';
import { useAuth } from '@/context/AuthContext';
import { useUserPlanStore } from '@/store/userPlanStore';
import { Cloud, Sun, RefreshCw, ExternalLink } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import OccasionPicker from '@/components/suggestions/OccasionPicker';
import OutfitSuggestion from '@/components/suggestions/OutfitSuggestion';
import OutfitLoadingAnimation from '@/components/suggestions/OutfitLoadingAnimation';
import { getWeatherCondition } from '@/utils/weatherUtils';
import { router } from 'expo-router';
import { getOutfitSuggestion, OutfitSuggestionResponse } from '@/services/aiService';
import { canGetSuggestion, getUserProfile } from '@/services/userService';
import { GENDERED_CATEGORY_HIERARCHY } from '@/utils/constants';
import Toast from 'react-native-toast-message';
import useAlertStore from '@/store/alertStore';
import { useWardrobeLimit } from '@/hooks/useWardrobeLimit';

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

  const [selectedOccasion, setSelectedOccasion] = useState('errands-run');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinterestLinks, setPinterestLinks] = useState<PinterestLink[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);

  const isAlreadyLiked = useMemo(
    () =>
      !!suggestion &&
      outfits.some(
        o =>
          o.items.length === suggestion.items.length &&
          o.items.every(id => suggestion.items.map(i => i.id).includes(id))
      ),
    [suggestion, outfits]
  );

  useEffect(() => {
    if (!weather && !weatherLoading) fetchWeather();
  }, []);

  useEffect(() => {
    setIsLiked(false);
  }, [suggestion]);

  // Bu useEffect, API'den pinterest_links gelmese bile uygulamanın
  // çökmemesini sağlar ve güvenli bir şekilde boş bir dizi atar.
  useEffect(() => {
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

  const wardrobeStatus = useMemo(() => {
    const required: Record<string, number> = {
      top: 2,
      bottom: 2,
      outerwear: 2,
      footwear: 2,
    };
    
    const gender = userPlan?.gender === 'male' ? 'male' : 'female';
    const hierarchy = GENDERED_CATEGORY_HIERARCHY[gender];

    const counts: Record<string, number> = {};
    clothing.forEach(item => {
      for (const [mainCat, subcats] of Object.entries(hierarchy)) {
        if ((subcats as string[]).includes(item.category)) {
          counts[mainCat] = (counts[mainCat] || 0) + 1;
          break;
        }
      }
    });

    const missing = Object.entries(required)
      .filter(([mainCat, minCount]) => (counts[mainCat] || 0) < minCount)
      .map(([mainCat, minCount]) => ({
        category: t(`categories.${mainCat}`),
        needed: minCount - (counts[mainCat] || 0),
      }));

    return {
      hasEnough: missing.length === 0,
      missing,
    };
  }, [clothing, t, userPlan?.gender]);

  const handleLike = () => {
    if (!suggestion) return;

    if (isAlreadyLiked) {
      Toast.show({ type: 'info', text1: t('suggestions.alreadyLiked'), position: 'top', visibilityTime: 2000, topOffset: 50 });
      return;
    }

    const weatherCondition = getWeatherCondition(weather as any);
    const newOutfit: Outfit = {
      id: Date.now().toString(),
      items: suggestion.items.map(i => i.id),
      occasion: selectedOccasion,
      weather: weatherCondition,
      date: new Date().toISOString(),
      description: suggestion.description,
      suggestion_tip: suggestion.suggestion_tip!,
    };
    addOutfit(newOutfit);
    setIsLiked(true);

    Toast.show({ type: 'success', text1: t('suggestions.likeSuccess'), text2: t('suggestions.likeInfo'), position: 'top', visibilityTime: 2500, topOffset: 50 });
  };

  const handleGenerateSuggestion = async () => {
    // limitInfo henüz yüklenmediyse butona basılmasını engelle
    if (isLimitLoading || !limitInfo) return;
    
    if (!wardrobeStatus.hasEnough || !weather) return;

    if (limitInfo.isLimitReached) {
      showAlert({
        title: t('suggestions.wardrobeLimitReachedTitle'),
        message: t('suggestions.wardrobeLimitReachedMessage', {
          plan: t(`profile.plans.${limitInfo.plan}`),
          limit: limitInfo.limit,
        }),
        buttons: [
          { text: t('common.cancel'), variant: 'outline', onPress: ()=>{} },
          {
            text: t('profile.upgrade'),
            onPress: () => router.push('/profile/subscription' as any),
            variant: 'primary'
          }
        ]
      });
      return;
    }

    setSuggestionLayoutY(0);

    try {
      const usageCheck = await canGetSuggestion();
      if (!usageCheck.canSuggest) {
        showAlert({
          title: t('suggestions.limitExceededTitle'),
          message: usageCheck.reason || t('suggestions.limitExceededMessage'),
          buttons: [
            { text: t('common.cancel'), onPress: () => { }, variant: 'outline' },
            { text: t('profile.upgrade'), onPress: () => router.push('/profile/subscription' as any), variant: 'primary' }
          ]
        });
        return;
      }
    } catch (error) { console.error('Usage check failed:', error); }

    setGenerating(true);
    setShowLoadingAnimation(true);
    setError(null);
    setSuggestion(null);
    setPinterestLinks([]);

    try {
      const weatherCondition = getWeatherCondition(weather as any);
      const last5 = outfits.slice(0, 5);

      // --- DEĞİŞİKLİK: API çağrısına plan bilgisini ekle ---
      const result = await getOutfitSuggestion(
        i18n.language,
        userPlan?.gender as 'female' | 'male' | undefined,
        limitInfo.plan, // Güvenilir kaynaktan plan bilgisini gönderiyoruz
        clothing,
        last5,
        weatherCondition,
        selectedOccasion
      );

      if (result) {
        setSuggestion(result);
        await getUserProfile(true);
      } else {
        setError(t('suggestions.genericError'));
      }
    } catch (err) {
      console.error(err);
      setError(t('suggestions.genericError'));
    } finally {
      setGenerating(false);
      setTimeout(() => {
        setShowLoadingAnimation(false);
      }, 500);
    }
  };

  const handlePinterestLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        router.push({ pathname: '/webview' as any, params: { url } });
      }
    } catch (error) {
      console.error('Error opening Pinterest link:', error);
      Toast.show({ type: 'error', text1: t('suggestions.linkError') || 'Could not open link', position: 'top', visibilityTime: 2000, topOffset: 50 });
    }
  };

  const getWeatherIcon = () => {
    if (!weather) return null;
    const cond = getWeatherCondition(weather);
    return ['sunny', 'hot', 'warm'].includes(cond)
      ? <Sun color={theme.colors.accent} size={20} />
      : <Cloud color={theme.colors.accent} size={20} />;
  };

  const renderUsageInfo = () => {
    if (!userPlan || !userPlan.usage) {
      return (
        <View style={[styles.usageContainer, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator color={theme.colors.primary} />
        </View>
      );
    }
    
    const usage = userPlan.usage;
    const usagePercentage = usage.percentage_used;
    const isNearLimit = usagePercentage > 80;

    return (
      <View style={[styles.usageContainer, { backgroundColor: theme.colors.card }]}>
        <View style={styles.usageHeader}>
          <Text style={[styles.usageTitle, { color: theme.colors.text }]}>
            {t('suggestions.dailyUsage')}
          </Text>
          {userPlan.plan !== 'premium' && (
            <TouchableOpacity onPress={() => router.push('/profile/subscription' as any)}>
              <Text style={[styles.upgradeLink, { color: theme.colors.primary }]}>{t('profile.upgrade')} ✨</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.usageText, { color: theme.colors.textLight }]}>
          {t('suggestions.usageLimitInfo', { used: usage.current_usage, total: usage.daily_limit })}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: isNearLimit ? theme.colors.warning : theme.colors.primary, width: `${Math.min(100, usagePercentage)}%` }]} />
        </View>
      </View>
    );
  };

  if (!wardrobeStatus.hasEnough) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title={t('suggestions.title')} />
        <View style={styles.centered}>
          <EmptyState
            icon="shirt"
            title={t('suggestions.notEnoughItemsTitle')}
            message={t('suggestions.notEnoughItemsMessage')}
            buttonText={t('suggestions.addMoreItems')}
            onButtonPress={() => {
              try { router.push('/wardrobe/add' as any); }
              catch (error) { console.error('Router navigation error:', error); }
            }}
          >
            <View style={[styles.missingItemsContainer, { borderColor: theme.colors.border }]}>
              <Text style={[styles.missingItemsTitle, { color: theme.colors.textLight }]}>{t('suggestions.youNeed')}</Text>
              {wardrobeStatus.missing.map(item => (
                <Text key={item.category} style={[styles.missingItemText, { color: theme.colors.text }]}>
                  • {t('suggestions.moreItems', { count: item.needed, category: item.category })}
                </Text>
              ))}
            </View>
          </EmptyState>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('suggestions.title')} />
      <OutfitLoadingAnimation isVisible={showLoadingAnimation} onComplete={() => setShowLoadingAnimation(false)} />
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderUsageInfo()}
        <View style={styles.weatherSection}>
          {weatherLoading ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : weather ? (
            <View style={styles.weatherInfo}>
              {getWeatherIcon()}
              <Text style={[styles.weatherText, { color: theme.colors.text }]}>
                {weather.location}, {weather.temperature}°C - {t(`weather.${getWeatherCondition(weather)}`)}
              </Text>
              <TouchableOpacity style={styles.refreshButton} onPress={fetchWeather}>
                <RefreshCw color={theme.colors.textLight} size={16} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.weatherError} onPress={fetchWeather}>
              <Text style={[styles.weatherErrorText, { color: theme.colors.error }]}>
                {weatherError === 'Location permission denied' ? t('permissions.locationRequiredTitle') : t('suggestions.weatherError')}
              </Text>
              <RefreshCw color={theme.colors.error} size={16} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('suggestions.selectOccasion')}</Text>
        <OccasionPicker selectedOccasion={selectedOccasion} onSelectOccasion={setSelectedOccasion} />
        <Button
          label={generating ? t('suggestions.generating') : t('suggestions.generateOutfit')}
          onPress={handleGenerateSuggestion}
          variant="primary"
          loading={generating}
          style={styles.generateButton}
          disabled={generating || !wardrobeStatus.hasEnough || !weather || !selectedOccasion || isLimitLoading}
        />
        {!!error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        )}
        <View onLayout={(event: LayoutChangeEvent) => {
          if (event.nativeEvent.layout.y > 0 && suggestionLayoutY === 0) {
            setSuggestionLayoutY(event.nativeEvent.layout.y);
          }
        }}>
          {suggestion && (
            <OutfitSuggestion
              outfit={suggestion}
              onLike={handleLike}
              liked={isAlreadyLiked}
            />
          )}
          {pinterestLinks.length > 0 && (
            <View style={styles.inspirationSection}>
              <Text style={[styles.inspirationTitle, { color: theme.colors.text }]}>
                {t('suggestions.inspirationTitle') || 'Style Inspiration'}
              </Text>
              {pinterestLinks.map((item, index) => (
                <TouchableOpacity
                  key={`pinterest-${index}`}
                  style={[styles.pinterestCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, shadowColor: theme.colors.text }]}
                  onPress={() => handlePinterestLinkPress(item.url)}
                  activeOpacity={0.7}
                >
                  <View style={styles.pinterestContent}>
                    <ExternalLink color={theme.colors.primary} size={20} />
                    <Text style={[styles.pinterestTitle, { color: theme.colors.text }]} numberOfLines={2}>{item.title}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  usageContainer: {
    marginHorizontal: 0,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    minHeight: 90,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  usageTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  upgradeLink: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
  },
  usageText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  weatherSection: { alignItems: 'center' },
  weatherInfo: { flexDirection: 'row', alignItems: 'center' },
  weatherText: { fontFamily: 'Montserrat-Medium', fontSize: 16, marginLeft: 8 },
  refreshButton: { padding: 8, marginLeft: 8 },
  weatherError: { flexDirection: 'row', alignItems: 'center' },
  weatherErrorText: { fontFamily: 'Montserrat-Medium', fontSize: 14, marginRight: 8 },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginBottom: 0,
    marginTop: 24,
  },
  generateButton: { marginTop: 16, marginBottom: 16 },
  errorContainer: { padding: 16, borderRadius: 8, marginBottom: 16 },
  errorText: { fontFamily: 'Montserrat-Medium', fontSize: 14 },
  inspirationSection: { marginTop: 24, marginBottom: 16 },
  inspirationTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  pinterestCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  pinterestContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pinterestTitle: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginLeft: 12,
    flex: 1
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  missingItemsContainer: { marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1, alignSelf: 'stretch' },
  missingItemsTitle: { fontFamily: 'Montserrat-Bold', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  missingItemText: { fontFamily: 'Montserrat-Regular', fontSize: 14, lineHeight: 20 }
});
