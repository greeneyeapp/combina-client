// app/suggestions/index.tsx (Nihai Hali)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { useOutfitStore } from '@/store/outfitStore';
import { useWeatherStore } from '@/store/weatherStore';
import { Cloud, Sun, RefreshCw } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import EmptyState from '@/components/common/EmptyState';
import Button from '@/components/common/Button';
import OccasionPicker from '@/components/suggestions/OccasionPicker';
import OutfitSuggestion from '@/components/suggestions/OutfitSuggestion';
import { getWeatherCondition } from '@/utils/weatherUtils';
import { router, useFocusEffect } from 'expo-router';
import { getOutfitSuggestion, Outfit } from '@/services/aiService';
import { getInspirationByOccasion } from '@/services/pinterestService';

interface PinImage {
  id: string;
  pinUrl: string | null;
  imageUrl: string | null;
  aspectRatio: number;
}

export default function SuggestionsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  const { weather, loading: weatherLoading, fetchWeather } = useWeatherStore();
  const { addOutfit } = useOutfitStore();
  
  const [selectedOccasion, setSelectedOccasion] = useState('casual');
  const [generating, setGenerating] = useState(false);
  const [suggestion, setSuggestion] = useState<Outfit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [pinterestImages, setPinterestImages] = useState<PinImage[]>([]);
  const [pinterestLoading, setPinterestLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!weatherLoading && !weather) {
        fetchWeather();
      }
    }, [weather, weatherLoading])
  );

  useEffect(() => {
    const fetchPinterestSuggestions = async () => {
      if (suggestion) {
        setPinterestLoading(true);
        const results = await getInspirationByOccasion(selectedOccasion);
        setPinterestImages(results);
        setPinterestLoading(false);
      }
    };
    fetchPinterestSuggestions();
  }, [suggestion, selectedOccasion]);

  const hasEnoughClothing = () => {
    const categories = new Set(clothing.map(item => item.category));
    return categories.size >= 2 && clothing.length >= 4;
  };

  const handleGenerateSuggestion = async () => {
    if (!hasEnoughClothing() || !weather) return;
    setGenerating(true);
    setError(null);
    setSuggestion(null);
    setPinterestImages([]);
    
    try {
      const weatherCondition = getWeatherCondition(weather);
      const result = await getOutfitSuggestion(clothing, weatherCondition, selectedOccasion);
      if (result) {
        setSuggestion(result);
        addOutfit({
          id: Date.now().toString(),
          items: result.items.map(item => item.id),
          occasion: selectedOccasion,
          weather: weatherCondition,
          date: new Date().toISOString(),
        });
      } else {
        setError(t('suggestions.generationFailed'));
      }
    } catch (err) {
      console.error(err);
      setError(t('suggestions.generationError'));
    } finally {
      setGenerating(false);
    }
  };

  const getWeatherIcon = () => {
    if (!weather) return null;
    const condition = getWeatherCondition(weather);
    switch (condition) {
      case 'sunny': return <Sun color={theme.colors.accent} size={20} />;
      default: return <Cloud color={theme.colors.accent} size={20} />;
    }
  };

  const handlePinPress = (pinUrl: string | null) => {
    if (pinUrl) {
      router.push({ pathname: '/webview', params: { url: pinUrl } });
    }
  };
  
  const renderPinterestItem = ({ item }: { item: PinImage }) => {
    const numColumns = 2;
    const screenPadding = 16;
    const itemMargin = 8;
    const totalMargin = (numColumns - 1) * itemMargin;
    const cardWidth = (Dimensions.get('window').width - (screenPadding * 2) - totalMargin) / numColumns;
    
    // --- DEĞİŞİKLİK BURADA ---
    // Minimum en-boy oranını belirliyoruz (1.4, hafif dikey bir görünüm sağlar)
    const MIN_ASPECT_RATIO = 1.4; 
    // Görselin kendi oranı minimumdan düşükse, minimum oranı kullanıyoruz.
    const effectiveAspectRatio = Math.max(item.aspectRatio, MIN_ASPECT_RATIO);
    // Kartın yüksekliğini bu efektif orana göre hesaplıyoruz
    const cardHeight = cardWidth * effectiveAspectRatio;
    // --- DEĞİŞİKLİK SONU ---

    return (
        <TouchableOpacity
          style={[
              styles.cardContainer,
              { 
                  width: cardWidth, 
                  height: cardHeight,
                  backgroundColor: theme.colors.card,
                  shadowColor: theme.colors.text,
              }
          ]}
          onPress={() => handlePinPress(item.pinUrl)}
          disabled={!item.pinUrl}
        >
          <Image
            source={{ uri: item.imageUrl || undefined }}
            style={styles.image}
            resizeMode="cover"
          />
        </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <>
      <View style={styles.weatherSection}>
        {weatherLoading ? <ActivityIndicator color={theme.colors.primary} /> : weather ? (
          <View style={styles.weatherInfo}>
            {getWeatherIcon()}
            <Text style={[styles.weatherText, { color: theme.colors.text }]}>
              {weather.temperature}°C - {t(`weather.${getWeatherCondition(weather)}`)}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchWeather}>
              <RefreshCw color={theme.colors.textLight} size={16} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.weatherError} onPress={fetchWeather}>
            <Text style={[styles.weatherErrorText, { color: theme.colors.error }]}>{t('suggestions.weatherError')}</Text>
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
        disabled={generating || !hasEnoughClothing() || !weather}
      />

      {error && <View style={[styles.errorContainer, { backgroundColor: theme.colors.errorLight }]}><Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text></View>}

      {suggestion && (
        <View style={styles.resultsContainer}>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>{t('suggestions.yourOutfit')}</Text>
          <OutfitSuggestion outfit={suggestion} />
          <Text style={[styles.inspirationTitle, { color: theme.colors.text }]}>{t('suggestions.pinterestInspiration')}</Text>
        </View>
      )}

      {pinterestLoading && <ActivityIndicator style={{ marginVertical: 20 }} color={theme.colors.primary} />}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('suggestions.title')} />
      <FlatList
        data={pinterestImages}
        renderItem={renderPinterestItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!suggestion && !generating && !hasEnoughClothing() ? (
            <EmptyState
                icon="shirt"
                title={t('suggestions.notEnoughItemsTitle')}
                message={t('suggestions.notEnoughItemsMessage')}
                buttonText={t('suggestions.addMoreItems')}
                onButtonPress={() => router.push('/wardrobe/add')}
            />
        ) : null}
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
    errorText: { fontFamily: 'Montserrat-Medium', fontSize: 14, },
    resultsContainer: { marginTop: 16 },
    resultTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, marginBottom: 16 },
    inspirationTitle: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 20, marginTop: 32, marginBottom: 16, },
    columnWrapper: { justifyContent: 'space-between' },
    cardContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 16, elevation: 4, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, },
    image: { width: '100%', height: '100%' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});