// components/suggestions/OutfitLoadingAnimation.tsx - Opacity Fix ile Tam Kod
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Easing } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Shirt } from 'lucide-react-native';
import { getDisplayImageUri } from '@/utils/imageDisplayHelper';

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
  const [itemsWithUris, setItemsWithUris] = useState<ItemWithUri[]>([]);

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
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                speed: 14,
                bounciness: 6,
                useNativeDriver: true,
            }),
        ]).start();

        if(itemsWithUris.length > 0) {
            const interval = setInterval(() => {
                setCurrentIndex(prev => (prev + 1) % itemsWithUris.length);
            }, 800);
            return () => clearInterval(interval);
        }
    } else {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 0.8,
                duration: 400,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start(() => {
            setCurrentIndex(0);
            onComplete?.();
        });
    }
  }, [isVisible, itemsWithUris.length]);

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
      <View style={[styles.itemContainer, { backgroundColor: theme.colors.card }]}>
        {isLoading ? (
          <View style={[styles.itemPlaceholder, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.loadingText, { color: theme.colors.textLight }]}>
              ⏳
            </Text>
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

        <View style={[styles.itemInfo, { backgroundColor: theme.colors.card }]}>
          <Text
            style={[styles.itemName, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          <Text style={[styles.itemCategory, { color: theme.colors.textLight }]}>
            {t(`categories.${item.category}`)}
          </Text>
        </View>
      </View>
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
        <View style={[styles.content, { backgroundColor: theme.colors.card }]}>
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
            {itemsWithUris.length > 0 && itemsWithUris.map((_, index) => (
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
            {itemsWithUris.length > 0
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
    // ✅ SOLID BACKGROUND - Artık saydam değil
  },
  container: { 
    alignItems: 'center', 
    padding: 32,
  },
  content: { 
    alignItems: 'center', 
    maxWidth: 280,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
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
    marginBottom: 24 
  },
  itemContainer: {
    width: 150,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  itemImage: { 
    width: '100%', 
    height: 150 
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
  loadingText: { 
    fontSize: 24, 
    fontFamily: 'Montserrat-Regular',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
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
    gap: 8 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4 
  },
  progressText: { 
    fontSize: 14, 
    fontFamily: 'Montserrat-Regular', 
    textAlign: 'center', 
    fontStyle: 'italic',
  },
});