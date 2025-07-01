// kodlar/components/suggestions/OutfitLoadingAnimation.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Shirt } from 'lucide-react-native';

interface OutfitLoadingAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
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

  const randomClothingItems = React.useMemo(() => {
    const availableItems = clothing.filter(item => !item.isImageMissing);
    if (availableItems.length === 0) return [];

    const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(6, availableItems.length));
  }, [clothing, isVisible]);

  const getDisplayImageUri = (item: any): string => {
    if (!item) return '';

    if (item.thumbnailImageUri) return item.thumbnailImageUri;
    if (item.originalImageUri) return item.originalImageUri;
    if (item.imageUri) return item.imageUri;

    return '';
  };

  useEffect(() => {
    if (isVisible) {
        // Giriş animasyonu
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, { // Girişte daha dinamik bir yaylanma efekti
                toValue: 1,
                speed: 14,
                bounciness: 6,
                useNativeDriver: true,
            }),
        ]).start();

        if(randomClothingItems.length > 0) {
            const interval = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % randomClothingItems.length);
            }, 800);
            return () => clearInterval(interval);
        }
    } else {
        // *** YENİ ÇIKIŞ ANİMASYONU BURADA ***
        // isVisible false olduğunda animasyonu tetikle
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400, // Süre 200ms'den 400ms'ye çıkarıldı
                easing: Easing.inOut(Easing.ease), // Daha yumuşak bir geçiş için easing eklendi
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 400, // Süre 200ms'den 400ms'ye çıkarıldı
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Animasyon bittiğinde onComplete callback'ini çağır
            setCurrentIndex(0);
            onComplete?.();
        });
    }
  }, [isVisible, randomClothingItems.length]);

  if (!isVisible) return null;

  const renderClothingItem = () => {
    if (randomClothingItems.length === 0) {
      return (
        <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.card }]}>
          <Shirt color={theme.colors.primary} size={48} />
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
            {t('wardrobe.emptyTitle')}
          </Text>
        </View>
      );
    }

    const currentItem = randomClothingItems[currentIndex];
    const imageUri = getDisplayImageUri(currentItem);

    return (
      <View style={[styles.itemContainer, { backgroundColor: theme.colors.card }]}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.itemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.itemPlaceholder, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.itemPlaceholderText, { color: theme.colors.textLight }]}>
              {currentItem.name?.charAt(0) || '?'}
            </Text>
          </View>
        )}

        <View style={styles.itemInfo}>
          <Text
            style={[styles.itemName, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {currentItem.name}
          </Text>
          <Text style={[styles.itemCategory, { color: theme.colors.textLight }]}>
            {t(`categories.${currentItem.category}`)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.background + 'E6' }]}>
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('suggestions.generatingOutfit')}
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.textLight }]}>
            {t('suggestions.analyzingWardrobe')}
          </Text>

          <Animated.View style={styles.itemDisplay}>
            {renderClothingItem()}
          </Animated.View>

          <View style={styles.dotsContainer}>
            {randomClothingItems.length > 0 && randomClothingItems.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentIndex
                      ? theme.colors.primary
                      : theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>

          <Text style={[styles.progressText, { color: theme.colors.textLight }]}>
            {randomClothingItems.length > 0
              ? t('suggestions.findingPerfectMatch')
              : t('suggestions.preparingOutfit')
            }
          </Text>
        </View>
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
  },
  content: {
    alignItems: 'center',
    maxWidth: 280,
  },
  title: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    marginBottom: 32,
  },
  itemDisplay: {
    marginBottom: 24,
  },
  itemContainer: {
    width: 150,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  itemImage: {
    width: '100%',
    height: 150,
  },
  itemPlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemPlaceholderText: {
    fontSize: 36,
    fontFamily: 'Montserrat-Bold',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  placeholderContainer: {
    width: 150,
    height: 210,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});