// components/suggestions/OutfitSuggestion.tsx - iPad için büyütülmüş ve orantılı tasarım

import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Heart, Shirt, Sparkles, Star, Crown } from 'lucide-react-native';
import { OutfitSuggestionResponse } from '@/services/aiService';
import { LinearGradient } from 'expo-linear-gradient';
import { getImageUri, checkImageExists } from '@/utils/fileSystemImageManager';

const { width } = Dimensions.get('window');
// YENİ: iPad tespiti
const isTablet = width >= 768;

interface OutfitSuggestionProps {
  outfit: OutfitSuggestionResponse;
  onLike: () => void;
  liked: boolean;
}

interface ItemWithUri {
  item: any;
  suggestionName: string;
  displayUri: string;
  isLoading: boolean;
}

export default function OutfitSuggestion({ outfit, onLike, liked }: OutfitSuggestionProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  const [itemsWithUris, setItemsWithUris] = useState<ItemWithUri[]>([]);

  const fadeAnim = useMemo(() => new Animated.Value(0), [outfit]);
  const slideAnim = useMemo(() => new Animated.Value(30), [outfit]);
  const heartAnim = useMemo(() => new Animated.Value(1), []);
  const sparkleAnim = useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 12, bounciness: 6, useNativeDriver: true }),
    ]).start();

    const sparkleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sparkleAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(sparkleAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    sparkleAnimation.start();
    return () => sparkleAnimation.stop();
  }, [outfit]);

  const clothingItems = useMemo(() => outfit.items.map(suggestionItem => {
    const clothingItem = clothing.find(item => item.id === suggestionItem.id);
    return clothingItem ? { ...clothingItem, suggestionName: suggestionItem.name } : null;
  }), [outfit, clothing]);

  const mainItems = useMemo(() => clothingItems.filter(item => item && ['top', 'bottom', 'one-piece', 'outerwear'].includes(item.category)).slice(0, 2), [clothingItems]);
  const accessoryItems = useMemo(() => clothingItems.filter(item => item && !mainItems.includes(item)), [clothingItems, mainItems]);

  useEffect(() => {
    const loadDisplayUris = async () => {
      const allItems = [...mainItems, ...accessoryItems].filter(Boolean);
      const initialItems: ItemWithUri[] = allItems.map(item => ({
        item, suggestionName: item.suggestionName, displayUri: '', isLoading: true
      }));
      setItemsWithUris(initialItems);
      const asyncPromises = initialItems.map(async (itemWithUri, index) => {
        try {
          if (!itemWithUri.item.originalImagePath) return { index, uri: '' };
          const exists = await checkImageExists(itemWithUri.item.originalImagePath, false);
          if (exists) {
            const uri = getImageUri(itemWithUri.item.originalImagePath, false);
            return { index, uri };
          }
          return { index, uri: '' };
        } catch (error) {
          console.error('Error loading image for suggestion item:', error);
          return { index, uri: '' };
        }
      });
      const results = await Promise.all(asyncPromises);
      setItemsWithUris(prev => {
        const updated = [...prev];
        results.forEach(result => {
          if (result) {
            updated[result.index] = { ...updated[result.index], displayUri: result.uri, isLoading: false };
          }
        });
        return updated;
      });
    };
    if (clothingItems.length > 0) {
      loadDisplayUris();
    }
  }, [clothingItems.length, outfit.items]);

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.3, duration: 150, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    onLike();
  };

  const renderClothingItem = (isMain: boolean, itemId: string) => {
    const itemWithUri = itemsWithUris.find(i => i.item?.id === itemId);
    if (!itemWithUri) return null;
    const { item, displayUri, isLoading } = itemWithUri;
    const itemStyle = isMain ? styles.mainItemContainer : styles.accessoryItemContainer;
    const imageStyle = isMain ? styles.mainItemImage : styles.accessoryItemImage;
    return (
      <View style={itemStyle}>
        <View style={[imageStyle, { backgroundColor: theme.colors.card, shadowColor: theme.mode === 'dark' ? '#000' : theme.colors.text }]}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Animated.View style={{ transform: [{ rotate: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
                <Sparkles size={isMain ? (isTablet ? 48 : 32) : (isTablet ? 32 : 20)} color={theme.colors.primary} />
              </Animated.View>
            </View>
          ) : displayUri ? (
            <>
              <Image source={{ uri: displayUri }} style={[imageStyle, styles.itemImage]}
                onError={() => {
                  setItemsWithUris(prev => {
                    const updated = [...prev];
                    const itemIndex = updated.findIndex(u => u.item?.id === item.id);
                    if (itemIndex >= 0) updated[itemIndex] = { ...updated[itemIndex], displayUri: '', isLoading: false };
                    return updated;
                  });
                }}
              />
              <LinearGradient colors={['transparent', theme.mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)']} style={styles.itemImageOverlay} />
            </>
          ) : (
            <View style={styles.placeholderContainer}>
              <Shirt color={theme.colors.textLight} size={isMain ? (isTablet ? 60 : 40) : (isTablet ? 40 : 24)} />
            </View>
          )}
        </View>
        <View style={[styles.itemInfo, { backgroundColor: theme.colors.card }]}>
          <Text style={[ isMain ? styles.mainItemName : styles.accessoryItemName, { color: theme.colors.text, textShadowColor: theme.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1, }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.itemCategory, { color: theme.colors.textLight }]}>
            {t(`categories.${item.category}`)}
          </Text>
        </View>
      </View>
    );
  };

  const mainItemsWithUris = itemsWithUris.filter(i => mainItems.some(m => m?.id === i.item?.id));
  const accessoryItemsWithUris = itemsWithUris.filter(i => accessoryItems.some(a => a?.id === i.item?.id));

  const cardGradientColors = theme.mode === 'dark' ? [theme.colors.card, theme.colors.background] : [theme.colors.background, theme.colors.card];
  const tipGradientColors = theme.mode === 'dark' ? ['rgba(242, 182, 193, 0.15)', 'rgba(242, 182, 193, 0.05)'] : ['rgba(242, 182, 193, 0.3)', 'rgba(242, 182, 193, 0.1)'];

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginVertical: 20 }}>
      <LinearGradient colors={cardGradientColors} style={[styles.container, { shadowColor: theme.mode === 'dark' ? '#000' : theme.colors.text, borderColor: theme.mode === 'dark' ? theme.colors.border : 'transparent', borderWidth: theme.mode === 'dark' ? 1 : 0, }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.header}>
          <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <View style={styles.headerContent}>
              <Animated.View style={{ transform: [{ rotate: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'], }) }] }}>
                <Star size={isTablet ? 30 : 24} color={theme.colors.white} fill={theme.colors.white} />
              </Animated.View>
              <Text style={[styles.title, { color: theme.colors.white }]}>{t('suggestions.suggestedOutfit')}</Text>
              <Crown size={isTablet ? 26 : 20} color={theme.colors.white} />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.outfitGrid}>
            {mainItemsWithUris.map(itemWithUri => (
              <View key={itemWithUri.item.id} style={styles.mainItemWrapper}>
                {renderClothingItem(true, itemWithUri.item.id)}
              </View>
            ))}
          </View>

          {accessoryItemsWithUris.length > 0 && (
            <View style={styles.accessorySection}>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.accessoryGrid}>
                {accessoryItemsWithUris.map(itemWithUri => (
                  <View key={itemWithUri.item.id} style={styles.accessoryItemWrapper}>
                    {renderClothingItem(false, itemWithUri.item.id)}
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        
        <LinearGradient colors={tipGradientColors} style={styles.tipContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={[styles.description, { color: theme.colors.text, textShadowColor: theme.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1, }]}>{outfit.description}</Text>
          {outfit.suggestion_tip && (
            <View style={styles.tipSection}>
              <View style={styles.tipHeader}>
                <Sparkles size={isTablet ? 20 : 16} color={theme.colors.primary} />
                <Text style={[styles.tipLabel, { color: theme.colors.primary }]}>{t('suggestions.stylingTip')}</Text>
              </View>
              <Text style={[styles.suggestionTip, { color: theme.colors.text, textShadowColor: theme.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1, }]}>{outfit.suggestion_tip}</Text>
            </View>
          )}
        </LinearGradient>
        
        <Animated.View style={{ transform: [{ scale: heartAnim }] }}>
          <TouchableOpacity style={[ styles.likeButton, { backgroundColor: liked ? theme.colors.primary : theme.mode === 'dark' ? theme.colors.card : theme.colors.background, borderColor: theme.colors.primary, shadowColor: liked ? theme.colors.primary : theme.colors.text, shadowOpacity: liked ? 0.4 : 0.1, shadowRadius: liked ? 8 : 4, elevation: liked ? 8 : 4, }]} onPress={handleLikePress} activeOpacity={0.8}>
            <Heart color={liked ? theme.colors.white : theme.colors.primary} size={isTablet ? 36 : 28} fill={liked ? theme.colors.white : 'transparent'} />
            {liked && (<Animated.View style={[ styles.likedIndicator, { opacity: sparkleAnim, transform: [{ scale: sparkleAnim }] }]}>
                <Sparkles size={12} color={theme.colors.white} />
            </Animated.View>)}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[ styles.decorativeSparkle, styles.sparkleTopLeft, { opacity: sparkleAnim, transform: [{ scale: sparkleAnim }] }]}>
          <Sparkles size={12} color={theme.colors.accent} />
        </Animated.View>
        
        <Animated.View style={[ styles.decorativeSparkle, styles.sparkleBottomRight, { opacity: sparkleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0], }), transform: [{ scale: sparkleAnim }] }]}>
          <Sparkles size={10} color={theme.colors.primary} />
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
const styles = StyleSheet.create({
  container: {
    borderRadius: isTablet ? 40 : 28, // Daha yuvarlak
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
    marginHorizontal: 4,
  },
  header: {
    marginBottom: isTablet ? 32 : 20, // Boşluk arttı
  },
  headerGradient: {
    paddingVertical: isTablet ? 24 : 16, // İç boşluk arttı
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16, // Boşluk arttı
  },
  title: {
    fontSize: isTablet ? 26 : 18, // Büyüdü
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  contentContainer: {
    paddingHorizontal: isTablet ? 32 : 20, // İç boşluk arttı
  },
  outfitGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: isTablet ? 32 : 20, // Boşluk arttı
    marginBottom: 16,
  },
  mainItemWrapper: {
    flex: 1,
    maxWidth: isTablet ? 300 : (width - 80) / 2, // Maksimum genişlik
  },
  mainItemContainer: {
    alignItems: 'center',
  },
  mainItemImage: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: isTablet ? 30 : 20, // Daha yuvarlak
    marginBottom: 12,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  itemImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  itemImageOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
  },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  placeholderContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  itemInfo: {
    paddingHorizontal: 16, // Boşluk arttı
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainItemName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: isTablet ? 18 : 14, // Büyüdü
    textAlign: 'center',
    marginBottom: 4,
  },
  itemCategory: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 14 : 11, // Büyüdü
    textAlign: 'center',
  },
  accessorySection: {
    marginTop: 16,
  },
  divider: {
    height: 1, marginVertical: 24, marginHorizontal: 20,
  },
  accessoryGrid: {
    flexDirection: 'row', justifyContent: 'center',
    gap: isTablet ? 20 : 12, flexWrap: 'wrap',
  },
  accessoryItemWrapper: {
    alignItems: 'center',
    width: isTablet ? 120 : 80, // Büyüdü
  },
  accessoryItemContainer: {
    alignItems: 'center',
    width: isTablet ? 120 : 80, // Büyüdü
  },
  accessoryItemImage: {
    width: isTablet ? 120 : 80, // Büyüdü
    height: isTablet ? 120 : 80,
    borderRadius: 24, // Daha yuvarlak
    marginBottom: 8,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  accessoryItemName: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 14 : 11, // Büyüdü
    textAlign: 'center',
    marginBottom: 2,
  },
  tipContainer: {
    borderRadius: 24, // Daha yuvarlak
    padding: isTablet ? 32 : 20,
    margin: isTablet ? 32 : 20,
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 18 : 15, // Büyüdü
    lineHeight: isTablet ? 28 : 24, // Satır aralığı arttı
    textAlign: 'center',
    marginBottom: 16,
  },
  tipSection: {
    marginTop: 12,
  },
  tipHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginBottom: 8,
  },
  tipLabel: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: isTablet ? 14 : 12, // Büyüdü
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionTip: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: isTablet ? 16 : 14, // Büyüdü
    lineHeight: isTablet ? 26 : 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  likeButton: {
    alignSelf: 'center',
    width: isTablet ? 72 : 56, // Büyüdü
    height: isTablet ? 72 : 56,
    borderRadius: isTablet ? 36 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    marginTop: 16,
    marginBottom: 24,
  },
  likedIndicator: {
    position: 'absolute', top: -8, right: -8,
  },
  decorativeSparkle: {
    position: 'absolute',
  },
  sparkleTopLeft: {
    top: 120, left: 20,
  },
  sparkleBottomRight: {
    bottom: 40, right: 80,
  },
});