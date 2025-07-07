// components/suggestions/OutfitLoadingAnimation.tsx - İyileştirilmiş pembe temalı

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Shirt, Sparkles, Heart } from 'lucide-react-native';
import { getDisplayImageUri } from '@/utils/imageDisplayHelper';
import { LinearGradient } from 'expo-linear-gradient';

interface OutfitLoadingAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

interface ItemWithUri {
  item: any;
  displayUri: string;
  isLoading: boolean;
}

export default function OutfitLoadingAnimation({
  isVisible,
  onComplete
}: OutfitLoadingAnimationProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));
  const [itemsWithUris, setItemsWithUris] = useState<ItemWithUri[]>([]);

  // Pembe temalı loading messages
  const loadingMessages = [
    t('suggestions.analyzingWardrobe', 'Analyzing your wardrobe...'),
    t('suggestions.findingPerfectMatch', 'Finding the perfect match...'),
    t('suggestions.mixingColors', 'Mixing colors harmoniously...'),
    t('suggestions.checkingWeather', 'Checking weather conditions...'),
    t('suggestions.creatingMagic', 'Creating fashion magic...'),
  ];

  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const randomClothingItems = React.useMemo(() => {
    const availableItems = clothing.filter(item => !item.isImageMissing);
    if (availableItems.length === 0) return [];

    const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(6, availableItems.length));
  }, [clothing, isVisible]);

  useEffect(() => {
    const loadDisplayUris = async () => {
      if (randomClothingItems.length === 0) return;

      const initialItems: ItemWithUri[] = randomClothingItems.map(item => ({
        item,
        displayUri: '',
        isLoading: true
      }));

      setItemsWithUris(initialItems);

      const asyncPromises = initialItems.map(async (itemWithUri, index) => {
        try {
          const uri = await getDisplayImageUri(itemWithUri.item);
          return { index, uri };
        } catch (error) {
          console.error('Error loading URI for loading animation:', error);
          return { index, uri: '' };
        }
      });

      const results = await Promise.all(asyncPromises);
      
      setItemsWithUris(prev => {
        const updated = [...prev];
        results.forEach(result => {
          if (result) {
            updated[result.index] = {
              ...updated[result.index],
              displayUri: result.uri,
              isLoading: false
            };
          }
        });
        return updated;
      });
    };

    if (isVisible && randomClothingItems.length > 0) {
      loadDisplayUris();
    }
  }, [randomClothingItems.length, isVisible]);

  useEffect(() => {
    if (isVisible) {
        // Giriş animasyonları
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                speed: 12,
                bounciness: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Sürekli animasyonlar
        const rotateAnimation = Animated.loop(
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );

        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1000,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );

        rotateAnimation.start();
        pulseAnimation.start();

        // Item ve mesaj döngüleri
        if(itemsWithUris.length > 0) {
            const itemInterval = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % itemsWithUris.length);
            }, 1200);

            const messageInterval = setInterval(() => {
                setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length);
            }, 2000);

            return () => {
              clearInterval(itemInterval);
              clearInterval(messageInterval);
              rotateAnimation.stop();
              pulseAnimation.stop();
            };
        }
    } else {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 300,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start(() => {
            setCurrentIndex(0);
            setCurrentMessageIndex(0);
            onComplete?.();
        });
    }
  }, [isVisible, itemsWithUris.length, loadingMessages.length]);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!isVisible) return null;

  const renderClothingItem = () => {
    if (itemsWithUris.length === 0) {
      return (
        <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.card }]}>
          <Shirt color={theme.colors.primary} size={48} />
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
            {t('wardrobe.emptyTitle')}
          </Text>
        </View>
      );
    }

    const currentItemWithUri = itemsWithUris[currentIndex];
    if (!currentItemWithUri) {
      return (
        <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.card }]}>
          <Shirt color={theme.colors.primary} size={48} />
        </View>
      );
    }

    const { item, displayUri, isLoading } = currentItemWithUri;

    return (
      <Animated.View 
        style={[
          styles.itemContainer, 
          { 
            backgroundColor: theme.colors.card,
            transform: [{ scale: pulseAnim }]
          }
        ]}
      >
        {isLoading ? (
          <View style={[styles.itemPlaceholder, { backgroundColor: theme.colors.background }]}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Sparkles color={theme.colors.primary} size={32} />
            </Animated.View>
          </View>
        ) : displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={styles.itemImage}
            resizeMode="cover"
            onError={() => {
              console.warn('Image load error in loading animation for item:', item.id);
              setItemsWithUris(prev => {
                const updated = [...prev];
                const itemIndex = updated.findIndex(u => u.item?.id === item.id);
                if (itemIndex >= 0) {
                  updated[itemIndex] = { ...updated[itemIndex], displayUri: '', isLoading: false };
                }
                return updated;
              });
            }}
          />
        ) : (
          <View style={[styles.itemPlaceholder, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.itemPlaceholderText, { color: theme.colors.textLight }]}>
              {item.name?.charAt(0) || '?'}
            </Text>
          </View>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.itemOverlay}
        >
          <Text
            style={[styles.itemName, { color: '#FFFFFF' }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.primaryLight, theme.colors.background]}
          style={styles.content}
        >
          {/* Ana başlık */}
          <View style={styles.titleContainer}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Sparkles size={32} color={theme.colors.primary} />
            </Animated.View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('suggestions.generatingOutfit')}
            </Text>
          </View>

          {/* Dinamik mesaj */}
          <Animated.View key={currentMessageIndex} style={styles.messageContainer}>
            <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
              {loadingMessages[currentMessageIndex]}
            </Text>
          </Animated.View>

          {/* Kıyafet gösterimi */}
          <Animated.View style={styles.itemDisplay}>
            {renderClothingItem()}
          </Animated.View>

          {/* Progress dots */}
          <View style={styles.dotsContainer}>
            {itemsWithUris.length > 0 && itemsWithUris.map((_, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentIndex
                      ? theme.colors.primary
                      : theme.colors.border,
                    transform: [{ 
                      scale: index === currentIndex ? pulseAnim : 1 
                    }]
                  },
                ]}
              />
            ))}
          </View>

          {/* Footer ikonu */}
          <View style={styles.footerIcon}>
            <Heart color={theme.colors.primary} size={24} fill={theme.colors.primary} />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: { 
    alignItems: 'center', 
    padding: 32,
    maxWidth: 320,
  },
  content: { 
    alignItems: 'center', 
    width: '100%',
    padding: 32,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { 
    fontSize: 24, 
    fontFamily: 'PlayfairDisplay-Bold', 
    textAlign: 'center', 
    marginTop: 12,
  },
  messageContainer: {
    marginBottom: 32,
    minHeight: 24,
  },
  subtitle: { 
    fontSize: 16, 
    fontFamily: 'Montserrat-Medium', 
    textAlign: 'center',
    fontStyle: 'italic',
  },
  itemDisplay: { 
    marginBottom: 24 
  },
  itemContainer: {
    width: 160,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4, },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  itemImage: { 
    width: '100%', 
    height: '100%' 
  },
  itemPlaceholder: { 
    width: '100%', 
    height: '100%', 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  itemPlaceholderText: { 
    fontSize: 48, 
    fontFamily: 'Montserrat-Bold',
  },
  itemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  itemName: { 
    fontSize: 14, 
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  placeholderContainer: {
    width: 160,
    height: 160,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4, },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  placeholderText: { 
    fontSize: 12, 
    fontFamily: 'Montserrat-Medium', 
    textAlign: 'center', 
    marginTop: 8,
  },
  dotsContainer: { 
    flexDirection: 'row', 
    marginBottom: 16, 
    gap: 12 
  },
  dot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5 
  },
  footerIcon: {
    marginTop: 8,
  },
});