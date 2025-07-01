// components/suggestions/OutfitLoadingAnimation.tsx (Güncellenmiş - Yeni image sistemi)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
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

  // Gösterilecek rastgele clothing item'ları seç
  const randomClothingItems = React.useMemo(() => {
    if (clothing.length === 0) return [];
    
    const shuffled = [...clothing].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(6, clothing.length)); // Max 6 item
  }, [clothing, isVisible]); // isVisible değiştiğinde yeniden karıştır

  // Gösterilecek image URI'sini belirle (thumbnail öncelikli)
  const getDisplayImageUri = (item: any): string => {
    if (!item) return '';
    
    // Öncelik sırası: thumbnail -> original -> legacy
    if (item.thumbnailImageUri) return item.thumbnailImageUri;
    if (item.originalImageUri) return item.originalImageUri;
    if (item.imageUri) return item.imageUri; // Legacy support
    
    return '';
  };

  useEffect(() => {
    if (!isVisible || randomClothingItems.length === 0) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      return;
    }

    // Fade in animasyonu
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Item'ları sırayla göster
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % randomClothingItems.length);
    }, 800);

    return () => clearInterval(interval);
  }, [isVisible, randomClothingItems.length]);

  useEffect(() => {
    if (!isVisible) {
      // Fade out animasyonu
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex(0);
        onComplete?.();
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const renderClothingItem = () => {
    if (randomClothingItems.length === 0) {
      // Fallback: Gardırop boşsa icon göster
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
    <View style={[styles.overlay, { backgroundColor: theme.colors.background + 'F0' }]}>
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
    width: 120,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  itemImage: {
    width: '100%',
    height: 120,
  },
  itemPlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemPlaceholderText: {
    fontSize: 32,
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
    width: 120,
    height: 180,
    borderRadius: 12,
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