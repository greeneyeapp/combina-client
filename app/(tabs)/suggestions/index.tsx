// screens/SuggestionsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { useOutfitStore, Outfit } from '@/store/outfitStore';
import { useWeatherStore } from '@/store/weatherStore';
import { useAuth } from '@/context/AuthContext';
import { Cloud, Sun, RefreshCw } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import OccasionPicker from '@/components/suggestions/OccasionPicker';
import OutfitSuggestion from '@/components/suggestions/OutfitSuggestion';
import { getWeatherCondition } from '@/utils/weatherUtils';
import { router } from 'expo-router';
import { getOutfitSuggestion, OutfitSuggestionResponse } from '@/services/aiService';
import { getInspirationByOccasion } from '@/services/pinterestService';
import { CATEGORY_HIERARCHY } from '@/utils/constants';
import Toast from 'react-native-toast-message';

interface PinImage {
  id: string;
  pinUrl: string | null;
  imageUrl: string | null;
  aspectRatio: number;
}

export default function SuggestionsScreen() {

  const mockPinterestImages: PinImage[] = [
    {
      id: '1',
      pinUrl: 'https://unsplash.com/photos/WLxQvbMyfas',
      imageUrl: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?w=600',
      aspectRatio: 1.4,
    },
    {
      id: '2',
      pinUrl: 'https://unsplash.com/photos/vC8wj_Kphak',
      imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600',
      aspectRatio: 1.6,
    },
    {
      id: '3',
      pinUrl: 'https://unsplash.com/photos/vC8wj_Kphak',
      imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600',
      aspectRatio: 1.5,
    },
    {
      id: '4',
      pinUrl: 'https://unsplash.com/photos/6anudmpILw4',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
      aspectRatio: 1.2,
    },
  ];


  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  const { outfits, addOutfit } = useOutfitStore();
  const { weather, loading: weatherLoading, fetchWeather, error: weatherError } = useWeatherStore();
  const { user } = useAuth();

  const [selectedOccasion, setSelectedOccasion] = useState('casual');
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<OutfitSuggestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pinterestImages, setPinterestImages] = useState<PinImage[]>([]);
  const [pinterestLoading, setPinterestLoading] = useState(false);

  const [isLiked, setIsLiked] = useState(false);

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

  useEffect(() => {
    if (!suggestion) return;
    setPinterestLoading(true);
    setTimeout(() => {
      setPinterestImages(mockPinterestImages);
      setPinterestLoading(false);
    }, 500);
  }, [suggestion, selectedOccasion]);

  // Only require dresses for female users
  const isFemale = (user as any)?.gender === 'female';

  const wardrobeStatus = useMemo(() => {
    const required: Record<string, number> = {
      top: 2,
      bottom: 2,
      outerwear: 2,
      shoes: 2,
    };

    const counts: Record<string, number> = {};
    clothing.forEach(item => {
      for (const [mainCat, subcats] of Object.entries(CATEGORY_HIERARCHY)) {
        if (subcats.includes(item.category)) {
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
  }, [clothing, isFemale, t]);

  const handleLike = () => {
    if (!suggestion) return;

    if (isAlreadyLiked) {
      Toast.show({
        type: 'info',
        text1: t('suggestions.alreadyLiked'),
        position: 'top',
        visibilityTime: 2000,
        topOffset: 50,
      });
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

    Toast.show({
      type: 'success',
      text1: t('suggestions.likeSuccess'),
      text2: t('suggestions.likeInfo'),
      position: 'top',
      visibilityTime: 2500,
      topOffset: 50,
    });
  };



  const handleGenerateSuggestion = async () => {
    if (!wardrobeStatus.hasEnough || !weather) return;

    setGenerating(true);
    setError(null);
    setSuggestion(null);
    setPinterestImages([]);

    try {
      const weatherCondition = getWeatherCondition(weather as any);
      const last5 = outfits.slice(0, 5);
      const result = await getOutfitSuggestion(
        i18n.language,
        clothing,
        last5,
        weatherCondition,
        selectedOccasion
      );
      if (result) {
        setSuggestion(result);

      } else {
        setError(t('suggestions.genericError'));
      }
    } catch (err) {
      console.error(err);
      setError(t('suggestions.genericError'));
    } finally {
      setGenerating(false);
    }
  };

  const getWeatherIcon = () => {
    if (!weather) return null;
    const cond = getWeatherCondition(weather);
    return ['sunny', 'hot', 'warm'].includes(cond)
      ? <Sun color={theme.colors.accent} size={20} />
      : <Cloud color={theme.colors.accent} size={20} />;
  };

  const renderPinterestItem = ({ item }: { item: PinImage }) => {
    const numCol = 2;
    const pad = 16;
    const margin = 8;
    const totalMargin = (numCol - 1) * margin;
    const width = (Dimensions.get('window').width - pad * 2 - totalMargin) / numCol;
    const ar = Math.max(item.aspectRatio || 1, 1.4);
    const height = width * ar;

    return (
      <TouchableOpacity
        style={[
          styles.cardContainer,
          { width, height, backgroundColor: theme.colors.card, shadowColor: theme.colors.text }
        ]}
        onPress={() =>
          item.pinUrl && router.push({ pathname: '/webview', params: { url: item.pinUrl } })
        }
        disabled={!item.pinUrl}
      >
        <Image source={{ uri: item.imageUrl || undefined }} style={styles.image} resizeMode="cover" />
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    if (!wardrobeStatus.hasEnough) return null;

    return (
      <>
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
                {weatherError === 'Location permission denied'
                  ? t('permissions.locationRequiredTitle')
                  : t('suggestions.weatherError')}
              </Text>
              <RefreshCw color={theme.colors.error} size={16} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {t('suggestions.selectOccasion')}
        </Text>
        <OccasionPicker
          selectedOccasion={selectedOccasion}
          onSelectOccasion={setSelectedOccasion}
        />

        <Button
          label={generating ? t('suggestions.generating') : t('suggestions.generateOutfit')}
          onPress={handleGenerateSuggestion}
          variant="primary"
          loading={generating}
          style={styles.generateButton}
          disabled={generating || !wardrobeStatus.hasEnough || !weather}
        />

        {!!error && (
          <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        )}

        {suggestion && (
          <OutfitSuggestion
            outfit={suggestion}
            onLike={handleLike}
            liked={isLiked || isAlreadyLiked}
          />
        )}
        {pinterestLoading && (
          <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />
        )}
      </>
    );
  };

  const renderEmptyState = () => {
    if (wardrobeStatus.hasEnough || generating || suggestion) return null;
    return (
      <View style={styles.centered}>
        <EmptyState
          icon="shirt"
          title={t('suggestions.notEnoughItemsTitle')}
          message={t('suggestions.notEnoughItemsMessage')}
          buttonText={t('suggestions.addMoreItems')}
          onButtonPress={() => router.push('/wardrobe/add')}
        >
          <View style={[styles.missingItemsContainer, { borderColor: theme.colors.border }]}>
            <Text style={[styles.missingItemsTitle, { color: theme.colors.textLight }]}>
              {t('suggestions.youNeed')}
            </Text>
            {wardrobeStatus.missing.map(item => (
              <Text key={item.category} style={[styles.missingItemText, { color: theme.colors.text }]}>
                • {t('suggestions.moreItems', { count: item.needed, category: item.category })}
              </Text>
            ))}
          </View>
        </EmptyState>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('suggestions.title')} />
      <FlatList
        data={pinterestImages}
        renderItem={renderPinterestItem}
        keyExtractor={item => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        style={styles.flatListContainer}
        contentContainerStyle={styles.contentContainer}
        columnWrapperStyle={styles.columnWrapper}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flatListContainer: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  weatherSection: { marginBottom: 24, alignItems: 'center' },
  weatherInfo: { flexDirection: 'row', alignItems: 'center' },
  weatherText: { fontFamily: 'Montserrat-Medium', fontSize: 16, marginLeft: 8 },
  refreshButton: { padding: 8, marginLeft: 8 },
  weatherError: { flexDirection: 'row', alignItems: 'center' },
  weatherErrorText: { fontFamily: 'Montserrat-Medium', fontSize: 14, marginRight: 8 },
  sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 16, marginBottom: 16 },
  generateButton: { marginTop: 24, marginBottom: 16 },
  errorContainer: { padding: 16, borderRadius: 8, marginBottom: 16 },
  errorText: { fontFamily: 'Montserrat-Medium', fontSize: 14 },
  columnWrapper: { justifyContent: 'space-between' },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5
  },
  image: { width: '100%', height: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  missingItemsContainer: { marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1, alignSelf: 'stretch' },
  missingItemsTitle: { fontFamily: 'Montserrat-Bold', fontSize: 14, marginBottom: 8, textAlign: 'center' },
  missingItemText: { fontFamily: 'Montserrat-Regular', fontSize: 14, lineHeight: 20 }
});
