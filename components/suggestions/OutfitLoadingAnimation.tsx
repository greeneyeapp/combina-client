// components/suggestions/OutfitLoadingAnimation.tsx - iPad için hareketli arkaplan ve büyütülmüş elemanlar

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Easing, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import {
  Sparkles, Heart, Shirt, Palette, Wand2, Crown,
  Star, Zap, Sun, Gift, Gem, Scissors
} from 'lucide-react-native';
import { getImageUri, checkImageExists } from '@/utils/fileSystemImageManager';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;

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
  const [sparkleAnims] = useState([
    new Animated.Value(0), new Animated.Value(0),
    new Animated.Value(0), new Animated.Value(0),
  ]);

  // YENİ: Arkaplan ikonları artık tablet ve telefon için farklı sayıda ve boyutta
  const [backgroundIcons] = useState(() => {
    const icons = [Sparkles, Heart, Crown, Star, Zap, Sun, Palette, Gem, Gift, Scissors];
    const iconCount = isTablet ? 20 : 12; // Tablette daha fazla ikon
    return Array.from({ length: iconCount }, (_, index) => ({
      id: index,
      icon: icons[Math.floor(Math.random() * icons.length)],
      x: Math.random() * (width * 0.9),
      y: Math.random() * (height * 0.8),
      scale: Math.random() * 0.5 + (isTablet ? 0.5 : 0.3), // Tablette daha büyük
      duration: Math.random() * 2000 + 3000,
      delay: Math.random() * 4000,
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
    }));
  });
  
  const [itemsWithUris, setItemsWithUris] = useState<ItemWithUri[]>([]);

  const loadingMessages = [
    { text: t('suggestions.analyzingWardrobe'), icon: Palette },
    { text: t('suggestions.findingPerfectMatch'), icon: Heart },
    { text: t('suggestions.mixingColors'), icon: Sparkles },
    { text: t('suggestions.checkingWeather'), icon: Wand2 },
    { text: t('suggestions.creatingMagic'), icon: Sparkles },
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
          if (exists) {
            const uri = getImageUri(itemWithUri.item.originalImagePath, false);
            return { index, uri };
          }
          return { index, uri: '' };
        } catch (error) {
          console.error('Error loading image for loading animation:', error);
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
    if (isVisible && randomClothingItems.length > 0) {
      loadDisplayUris();
    }
  }, [randomClothingItems.length, isVisible]);

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, speed: 12, bounciness: 8, useNativeDriver: true }),
      ]).start();

      const rotateAnimation = Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }));
      const pulseAnimation = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]));
      const sparkleAnimations = sparkleAnims.map((anim, index) => Animated.loop(Animated.sequence([
        Animated.delay(index * 300),
        Animated.timing(anim, { toValue: 1, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 800, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])));
      
      const backgroundAnimations = backgroundIcons.map((iconData) => {
        const { opacity, rotate, duration, delay } = iconData;
        const fadeAnimation = Animated.loop(Animated.sequence([
          Animated.delay(delay),
          Animated.timing(opacity, { toValue: 0.3, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]));
        const rotateAnimation = Animated.loop(Animated.timing(rotate, { toValue: 1, duration: duration * 2, easing: Easing.linear, useNativeDriver: true }));
        return { fadeAnimation, rotateAnimation };
      });

      rotateAnimation.start();
      pulseAnimation.start();
      sparkleAnimations.forEach(anim => anim.start());
      backgroundAnimations.forEach(({ fadeAnimation, rotateAnimation }) => {
        fadeAnimation.start();
        rotateAnimation.start();
      });

      if (itemsWithUris.length > 0) {
        const itemInterval = setInterval(() => setCurrentIndex(prev => (prev + 1) % itemsWithUris.length), 1500);
        const messageInterval = setInterval(() => setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length), 2500);
        return () => {
          clearInterval(itemInterval); clearInterval(messageInterval);
          rotateAnimation.stop(); pulseAnimation.stop();
          sparkleAnimations.forEach(anim => anim.stop());
          backgroundAnimations.forEach(({ fadeAnimation, rotateAnimation }) => {
            fadeAnimation.stop(); rotateAnimation.stop();
          });
        };
      }
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.8, duration: 400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]).start(() => {
        setCurrentIndex(0); setCurrentMessageIndex(0); onComplete?.();
      });
    }
  }, [isVisible, itemsWithUris.length]);

  const rotateInterpolate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  if (!isVisible) return null;
  const currentMessage = loadingMessages[currentMessageIndex];
  const MessageIcon = currentMessage?.icon || Sparkles;

  const renderClothingItem = () => {
    if (itemsWithUris.length === 0) {
      return (
        <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.card }]}>
          <Shirt color={theme.colors.primary} size={isTablet ? 80 : 56} />
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>{t('wardrobe.emptyTitle')}</Text>
        </View>
      );
    }
    const currentItemWithUri = itemsWithUris[currentIndex];
    if (!currentItemWithUri) {
      return (<View style={[styles.placeholderContainer, { backgroundColor: theme.colors.card }]}><Shirt color={theme.colors.primary} size={isTablet ? 80 : 56} /></View>);
    }
    const { item, displayUri, isLoading } = currentItemWithUri;
    return (
      <Animated.View style={[styles.itemContainer, { backgroundColor: theme.colors.card, transform: [{ scale: pulseAnim }], shadowColor: theme.mode === 'dark' ? '#000' : theme.colors.text }]}>
        {isLoading ? (
          <View style={[styles.itemPlaceholder, { backgroundColor: theme.colors.background }]}><Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}><Sparkles color={theme.colors.primary} size={40} /></Animated.View></View>
        ) : displayUri ? (
          <Image source={{ uri: displayUri }} style={styles.itemImage} resizeMode="cover"
            onError={() => {
              setItemsWithUris(prev => {
                const updated = [...prev];
                const itemIndex = updated.findIndex(u => u.item?.id === item.id);
                if (itemIndex >= 0) updated[itemIndex] = { ...updated[itemIndex], displayUri: '', isLoading: false };
                return updated;
              });
            }}
          />
        ) : (<View style={[styles.itemPlaceholder, { backgroundColor: theme.colors.background }]}><Text style={[styles.itemPlaceholderText, { color: theme.colors.textLight }]}>{item.name?.charAt(0) || '?'}</Text></View>)}
        <LinearGradient colors={['transparent', theme.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)']} style={styles.itemOverlay}>
          <Text style={[styles.itemName, { color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }]} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
        </LinearGradient>
        {sparkleAnims.map((anim, index) => (
          <Animated.View key={index} style={[styles.sparkle, { opacity: anim, transform: [{ scale: anim }], top: index % 2 === 0 ? '10%' : '80%', left: index < 2 ? '10%' : '80%' }]}>
            <Sparkles color={theme.colors.accent} size={16} />
          </Animated.View>
        ))}
      </Animated.View>
    );
  };

  const gradientColors = theme.mode === 'dark'
    ? [theme.colors.background, theme.colors.card, theme.colors.primaryLight] as const
    : [theme.colors.primaryLight, theme.colors.background, theme.colors.card] as const;

  return (
    <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
      {backgroundIcons.map((iconData) => {
        const IconComponent = iconData.icon;
        const rotateInterpolate = iconData.rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
        return (
          <Animated.View key={iconData.id} style={[styles.backgroundIcon, { left: iconData.x, top: iconData.y, opacity: iconData.opacity, transform: [{ scale: iconData.scale }, { rotate: rotateInterpolate }] }]}>
            <IconComponent size={isTablet ? 48 : 24} color={theme.mode === 'dark' ? theme.colors.primaryLight : theme.colors.primary} />
          </Animated.View>
        );
      })}
      <Animated.View style={[styles.container, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={gradientColors} style={styles.content} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.titleContainer}>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}><Sparkles size={isTablet ? 48 : 36} color={theme.colors.primary} /></Animated.View>
            <Text style={[styles.title, { color: theme.colors.text, textShadowColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }]}>{t('suggestions.generatingOutfit')}</Text>
          </View>
          <Animated.View key={currentMessageIndex} style={styles.messageContainer}>
            <View style={styles.messageContent}>
              <MessageIcon size={isTablet ? 24 : 20} color={theme.colors.primary} />
              <Text style={[styles.subtitle, { color: theme.colors.text, textShadowColor: theme.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }]}>{currentMessage?.text || loadingMessages[0].text}</Text>
            </View>
          </Animated.View>
          <View style={styles.itemDisplay}>{renderClothingItem()}</View>
          <View style={styles.dotsContainer}>
            {itemsWithUris.length > 0 && itemsWithUris.map((_, index) => (
              <Animated.View key={index} style={[styles.dot, { backgroundColor: index === currentIndex ? theme.colors.primary : theme.mode === 'dark' ? theme.colors.border : theme.colors.textLight, transform: [{ scale: index === currentIndex ? pulseAnim : 1 }], shadowColor: theme.colors.primary, shadowOpacity: index === currentIndex ? 0.5 : 0, shadowRadius: 4, elevation: index === currentIndex ? 4 : 0, }]} />
            ))}
          </View>
          <View style={styles.footerContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}><Heart color={theme.colors.primary} size={isTablet ? 36 : 28} fill={theme.mode === 'dark' ? theme.colors.primary : 'rgba(242, 182, 193, 0.3)'} /></Animated.View>
            <Text style={[styles.footerText, { color: theme.colors.textLight, textShadowColor: theme.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1, }]}>{t('suggestions.almostReady')}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', zIndex: 1000,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: isTablet ? 600 : width * 0.92, // Tablette maksimum genişlik artırıldı
    padding: isTablet ? 48 : 24,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: isTablet ? 36 : 24, // Büyüdü
    fontFamily: 'PlayfairDisplay-Bold',
    textAlign: 'center',
    marginTop: 16,
  },
  messageContainer: {
    marginBottom: 32,
    minHeight: 40,
    justifyContent: 'center',
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  subtitle: {
    fontSize: isTablet ? 20 : 15, // Büyüdü
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    flex: 1,
  },
  itemDisplay: {
    marginBottom: 24,
  },
  itemContainer: {
    width: isTablet ? 280 : 160, // Büyüdü
    height: isTablet ? 280 : 160,
    borderRadius: 40, // Daha yuvarlak
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
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
    fontSize: isTablet ? 90 : 56, // Büyüdü
    fontFamily: 'Montserrat-Bold',
  },
  itemOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16,
  },
  itemName: {
    fontSize: isTablet ? 18 : 14, // Büyüdü
    fontFamily: 'Montserrat-SemiBold',
    textAlign: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  placeholderContainer: {
    width: isTablet ? 280 : 160, // Büyüdü
    height: isTablet ? 280 : 160,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  placeholderText: {
    fontSize: isTablet ? 16 : 12, // Büyüdü
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
    marginTop: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 16,
  },
  dot: {
    width: isTablet ? 14 : 10,
    height: isTablet ? 14 : 10,
    borderRadius: isTablet ? 7 : 5,
  },
  footerContainer: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  footerText: {
    fontSize: isTablet ? 18 : 13, // Büyüdü
    fontFamily: 'Montserrat-Medium',
  },
  backgroundIcon: {
    position: 'absolute',
    zIndex: 0,
  },
});