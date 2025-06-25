// components/suggestions/OutfitLoadingAnimation.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Modal,
  Easing,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useClothingStore, ClothingItem } from '@/store/clothingStore';
import { Sparkles, Shuffle } from 'lucide-react-native';

interface OutfitLoadingAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const { width, height } = Dimensions.get('window');
const ITEM_SIZE = 120;
const ANIMATION_DURATION = 800;

export default function OutfitLoadingAnimation({ isVisible, onComplete }: OutfitLoadingAnimationProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { clothing } = useClothingStore();
  
  const [currentItems, setCurrentItems] = useState<ClothingItem[]>([]);
  const [shuffleCount, setShuffleCount] = useState(0);
  const [usedItemIds, setUsedItemIds] = useState<Set<string>>(new Set());
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shuffleAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  // Get random items from wardrobe (tekrarları engelle)
  const getRandomItems = (count: number = 4): ClothingItem[] => {
    if (clothing.length === 0) return [];
    
    // Eğer kullanılabilir eşya sayısı istenen sayıdan azsa, used set'i sıfırla
    const availableItems = clothing.filter(item => !usedItemIds.has(item.id));
    if (availableItems.length < count && usedItemIds.size > 0) {
      setUsedItemIds(new Set());
      return getRandomItems(count);
    }
    
    // Kullanılmamış eşyalardan rastgele seç
    const shuffled = [...availableItems].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, availableItems.length));
    
    // Seçilen eşyaları kullanılmış listesine ekle
    setUsedItemIds(prev => {
      const newSet = new Set(prev);
      selected.forEach(item => newSet.add(item.id));
      return newSet;
    });
    
    return selected;
  };

  // Shuffle items animation
  const shuffleItems = () => {
    Animated.sequence([
      Animated.timing(shuffleAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(shuffleAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    setCurrentItems(getRandomItems(4));
    setShuffleCount(prev => prev + 1);
  };

  // Start animations when visible
  useEffect(() => {
    if (isVisible) {
      // Reset state
      setUsedItemIds(new Set());
      setCurrentItems(getRandomItems(4));
      setShuffleCount(0);
      
      // Initial entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous rotation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      rotateAnimation.start();

      // Sparkle animation
      const sparkleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      sparkleAnimation.start();

      // Shuffle items periodically
      const shuffleInterval = setInterval(shuffleItems, ANIMATION_DURATION);

      return () => {
        clearInterval(shuffleInterval);
        rotateAnimation.stop();
        sparkleAnimation.stop();
      };
    } else {
      // Reset animations when hidden
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.8);
      rotateAnim.setValue(0);
      shuffleAnim.setValue(0);
      sparkleAnim.setValue(0);
      setUsedItemIds(new Set());
    }
  }, [isVisible]);

  // Exit animation when closing
  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete?.();
    });
  };

  useEffect(() => {
    if (!isVisible) {
      handleClose();
    }
  }, [isVisible]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const shuffleTransform = shuffleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkleScale = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1.2, 0.8],
  });

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0, 0, 0, 0.85)' }]}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Main loading text */}
          <View style={styles.headerContainer}>
            <Animated.View
              style={[
                styles.sparkleIcon,
                {
                  opacity: sparkleOpacity,
                  transform: [{ scale: sparkleScale }],
                },
              ]}
            >
              <Sparkles color={theme.colors.primary} size={32} />
            </Animated.View>
            <Text style={[styles.loadingTitle, { color: theme.colors.white }]}>
              {t('suggestions.generatingOutfit')}
            </Text>
            <Text style={[styles.loadingSubtitle, { color: theme.colors.textLight }]}>
              {t('suggestions.analyzingWardrobe')}
            </Text>
          </View>

          {/* Clothing items carousel */}
          <Animated.View
            style={[
              styles.itemsContainer,
              {
                transform: [
                  { rotate: rotation },
                  { translateY: shuffleTransform },
                ],
              },
            ]}
          >
            {currentItems.map((item, index) => {
              const angle = (index * 90) * (Math.PI / 180); // 90 degrees between items
              const radius = 80;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <Animated.View
                  key={`${item.id}-${shuffleCount}`}
                  style={[
                    styles.clothingItem,
                    {
                      transform: [
                        { translateX: x },
                        { translateY: y },
                        { scale: shuffleAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [1, 0.8, 1],
                        }) },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={{ uri: item.imageUri }}
                    style={styles.clothingImage}
                    resizeMode="cover"
                  />
                  <View style={[styles.itemOverlay, { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={[styles.itemName, { color: theme.colors.primary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                </Animated.View>
              );
            })}
          </Animated.View>

          {/* Shuffle indicator */}
          <Animated.View
            style={[
              styles.shuffleContainer,
              {
                opacity: shuffleAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.6, 1, 0.6],
                }),
              },
            ]}
          >
            <Shuffle color={theme.colors.textLight} size={16} />
            <Text style={[styles.shuffleText, { color: theme.colors.textLight }]}>
              {t('suggestions.findingPerfectMatch')}
            </Text>
          </Animated.View>

          {/* Progress dots */}
          <View style={styles.progressContainer}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.progressDot,
                  {
                    backgroundColor: theme.colors.primary,
                    opacity: sparkleAnim.interpolate({
                      inputRange: [0, 0.33, 0.66, 1],
                      outputRange: index === 0 ? [1, 0.3, 0.3, 1] :
                                   index === 1 ? [0.3, 1, 0.3, 0.3] :
                                   [0.3, 0.3, 1, 0.3],
                    }),
                  },
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    padding: 32,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  sparkleIcon: {
    marginBottom: 16,
  },
  loadingTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    textAlign: 'center',
  },
  itemsContainer: {
    width: ITEM_SIZE * 2,
    height: ITEM_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  clothingItem: {
    position: 'absolute',
    width: ITEM_SIZE * 0.6,
    height: ITEM_SIZE * 0.6,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  clothingImage: {
    width: '100%',
    height: '70%',
  },
  itemOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  itemName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    textAlign: 'center',
  },
  shuffleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  shuffleText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});