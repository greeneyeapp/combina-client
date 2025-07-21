// components/suggestions/OutfitLoadingAnimation.tsx - İyileştirmelerle güncellenmiş nihai versiyon

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Easing, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import {
  Sparkles, Heart, Shirt, Palette, Wand2, Crown, Star, Zap, Sun, Gem, Gift, Scissors
} from 'lucide-react-native';
import { getImageUri, checkImageExists } from '@/utils/fileSystemImageManager';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

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
  const [sparkleAnims] = useState(() => Array.from({ length: 4 }, () => new Animated.Value(0)));

  // İYİLEŞTİRME: Arka plan ikonlarının sayısını ve boyutunu artırdık
  const [backgroundIcons] = useState(() => {
    const icons = [Sparkles, Heart, Crown, Star, Zap, Sun, Palette, Gem, Gift, Scissors];
    return Array.from({ length: 15 }, (_, index) => ({
      id: index,
      icon: icons[Math.floor(Math.random() * icons.length)],
      x: Math.random() * width,
      y: Math.random() * height,
      scale: Math.random() * 0.5 + 0.4, // Biraz daha belirgin ikonlar
      duration: Math.random() * 2000 + 3000,
      delay: Math.random() * 4000,
      opacity: new Animated.Value(0),
    }));
  });

  const [itemsWithUris, setItemsWithUris] = useState<ItemWithUri[]>([]);
  const loadingMessages = [
    { text: t('suggestions.analyzingWardrobe', 'Gardırobunuz analiz ediliyor...'), icon: Palette },
    { text: t('suggestions.findingPerfectMatch', 'Mükemmel eşleşme bulunuyor...'), icon: Heart },
    { text: t('suggestions.creatingMagic', 'Moda sihri yaratılıyor...'), icon: Wand2 },
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const randomClothingItems = React.useMemo(() => {
    const availableItems = clothing.filter(item => item.originalImagePath);
    if (availableItems.length === 0) return [];
    const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(6, availableItems.length));
  }, [clothing, isVisible]);

  useEffect(() => {
    const loadDisplayUris = async () => {
      if (randomClothingItems.length === 0) return;
      const initialItems: ItemWithUri[] = randomClothingItems.map(item => ({ item, displayUri: '', isLoading: true }));
      setItemsWithUris(initialItems);
      const asyncPromises = initialItems.map(async (itemWithUri, index) => {
        try {
          if (!itemWithUri.item.originalImagePath) return { index, uri: '' };
          const exists = await checkImageExists(itemWithUri.item.originalImagePath, false);
          if (exists) return { index, uri: getImageUri(itemWithUri.item.originalImagePath, false) };
          return { index, uri: '' };
        } catch (error) {
          console.error('Error loading image for animation:', error);
          return { index, uri: '' };
        }
      });
      const results = await Promise.all(asyncPromises);
      setItemsWithUris(prev => {
        const updated = [...prev];
        results.forEach(result => {
          if (result) updated[result.index] = { ...updated[result.index], displayUri: result.uri, isLoading: false };
        });
        return updated;
      });
    };
    if (isVisible && randomClothingItems.length > 0) loadDisplayUris();
  }, [randomClothingItems.length, isVisible]);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }),
      ]).start();

      const rotateAnimation = Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }));
      const pulseAnimation = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]));
      const sparkleAnimations = sparkleAnims.map((anim, index) => Animated.loop(Animated.sequence([
        Animated.delay(index * 300),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])));
      // İYİLEŞTİRME: Arka plan ikon animasyonları
      const backgroundAnimations = backgroundIcons.map(({ opacity, duration, delay }) => Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.2, duration: duration / 2, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: duration / 2, useNativeDriver: true }),
      ])));

      rotateAnimation.start();
      pulseAnimation.start();
      sparkleAnimations.forEach(anim => anim.start());
      backgroundAnimations.forEach(anim => anim.start());

      if (itemsWithUris.length > 0) {
        const itemInterval = setInterval(() => setCurrentIndex(prev => (prev + 1) % itemsWithUris.length), 1500);
        const messageInterval = setInterval(() => setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length), 2500);
        return () => {
          clearInterval(itemInterval);
          clearInterval(messageInterval);
          rotateAnimation.stop();
          pulseAnimation.stop();
          sparkleAnimations.forEach(anim => anim.stop());
          backgroundAnimations.forEach(anim => anim.stop());
        };
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 400, useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex(0);
        setCurrentMessageIndex(0);
        onComplete?.();
      });
    }
  }, [isVisible, itemsWithUris.length]);

  if (!isVisible) return null;

  const rotateInterpolate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const currentMessage = loadingMessages[currentMessageIndex];
  const MessageIcon = currentMessage?.icon || Sparkles;

  const renderClothingItem = () => {
    if (itemsWithUris.length === 0) {
      return (
        <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.card }]}>
          <Shirt color={theme.colors.primary} size={56} />
        </View>
      );
    }
    const currentItemWithUri = itemsWithUris[currentIndex];
    if (!currentItemWithUri) return null;
    const { item, displayUri, isLoading } = currentItemWithUri;
    return (
      <Animated.View style={[styles.itemContainer, { backgroundColor: theme.colors.card, transform: [{ scale: pulseAnim }], shadowColor: theme.colors.text }]}>
        {isLoading ? (
          <View style={[styles.itemPlaceholder, { backgroundColor: theme.colors.background }]}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}><Sparkles color={theme.colors.primary} size={40} /></Animated.View>
          </View>
        ) : displayUri ? (
          <Image source={{ uri: displayUri }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={[styles.itemPlaceholder, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.itemPlaceholderText, { color: theme.colors.textLight }]}>{item.name?.charAt(0) || '?'}</Text>
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.itemOverlay}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        </LinearGradient>
        {sparkleAnims.map((anim, index) => (
          <Animated.View key={index} style={[ styles.sparkle, { opacity: anim, transform: [{ scale: anim }], top: index % 2 === 0 ? '10%' : '80%', left: index < 2 ? '10%' : '80%' } ]}>
            <Sparkles color={theme.colors.accent} size={16} />
          </Animated.View>
        ))}
      </Animated.View>
    );
  };

  return (
    <View style={styles.fullScreenOverlay}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={20} tint={theme.mode} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]} />
      )}

      {/* İYİLEŞTİRME: Arka planda uçuşan ikonlar */}
      {backgroundIcons.map(({ id, icon: Icon, x, y, scale, opacity }) => (
        <Animated.View key={id} style={[styles.backgroundIcon, { left: x, top: y, transform: [{ scale }], opacity }]}>
          <Icon size={40} color={theme.colors.primary} />
        </Animated.View>
      ))}

      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <LinearGradient
          colors={theme.mode === 'dark' ? ['#2c3e50', '#1a252f'] : ['#ffffff', '#f0f4f7']}
          style={styles.contentCard}
        >
          <View style={styles.titleContainer}>
            <Star size={28} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('suggestions.generatingOutfit', 'Mükemmel Kombininiz Yaratılıyor')}
            </Text>
          </View>

          <View style={styles.messageContainer}>
              <MessageIcon size={18} color={theme.colors.primary} />
              <Text style={[styles.subtitle, { color: theme.colors.text }]}>
                {currentMessage?.text || '...'}
              </Text>
          </View>

          {renderClothingItem()}
          
          <View style={styles.dotsContainer}>
            {itemsWithUris.length > 0 && itemsWithUris.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === currentIndex ? theme.colors.primary : theme.colors.border },
                ]}
              />
            ))}
          </View>
          
          <Text style={[styles.footerText, { color: theme.colors.textLight }]}>
            {t('suggestions.almostReady', 'Neredeyse hazır...')}
          </Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  backgroundIcon: {
    position: 'absolute',
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },
  contentCard: {
    padding: 24,
    borderRadius: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay-Bold',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 30,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  itemContainer: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
    marginBottom: 24,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemPlaceholderText: {
    fontSize: 50,
    fontFamily: 'Montserrat-Bold',
  },
  itemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  // İYİLEŞTİRME: Metin okunabilirliği için gölge eklendi
  itemName: {
    fontSize: 13,
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  placeholderContainer: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sparkle: {
    position: 'absolute',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footerText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 13,
  },
});