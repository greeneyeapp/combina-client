// components/suggestions/OutfitSuggestion.tsx (Yeniden Tasarlandı - Daha Büyük Fotoğraflar)
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Heart, Shirt, Sparkles } from 'lucide-react-native';
import { OutfitSuggestionResponse } from '@/services/aiService';
import { LinearGradient } from 'expo-linear-gradient';

interface OutfitSuggestionProps {
  outfit: OutfitSuggestionResponse;
  onLike: () => void;
  liked: boolean;
}

export default function OutfitSuggestion({ outfit, onLike, liked }: OutfitSuggestionProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  // Animasyon için
  const fadeAnim = useMemo(() => new Animated.Value(0), [outfit]);
  const slideAnim = useMemo(() => new Animated.Value(20), [outfit]);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 12,
        bounciness: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [outfit]);


  const clothingItems = useMemo(() => outfit.items.map(suggestionItem => {
    const clothingItem = clothing.find(item => item.id === suggestionItem.id);
    return clothingItem ? { ...clothingItem, suggestionName: suggestionItem.name } : null;
  }), [outfit, clothing]);

  const mainItems = useMemo(() => clothingItems.filter(item => item && ['top', 'bottom', 'one-piece', 'outerwear'].includes(item.category)).slice(0, 2), [clothingItems]);
  const accessoryItems = useMemo(() => clothingItems.filter(item => item && !mainItems.includes(item)), [clothingItems, mainItems]);

  const getDisplayImageUri = (item: any): string => {
    if (!item) return '';
    if (item.originalImageUri && !imageErrors[item.id]) return item.originalImageUri;
    if (item.imageUri && !imageErrors[item.id]) return item.imageUri;
    if (item.thumbnailImageUri) return item.thumbnailImageUri;
    return '';
  };

  const handleImageError = (itemId: string) => {
    setImageErrors(prev => ({ ...prev, [itemId]: true }));
  };

  const renderClothingItem = (item: any, isMain: boolean) => {
    const displayUri = getDisplayImageUri(item);
    if (!item) return null;

    return (
      <View style={isMain ? styles.mainItemContainer : styles.accessoryItemContainer}>
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={isMain ? styles.mainItemImage : styles.accessoryItemImage}
            onError={() => handleImageError(item.id)}
          />
        ) : (
          <View style={[isMain ? styles.mainItemImage : styles.accessoryItemImage, styles.placeholderImage]}>
            <Shirt color={theme.colors.textLight} size={isMain ? 48 : 24} />
          </View>
        )}
        <Text
          style={[isMain ? styles.mainItemName : styles.accessoryItemName, { color: theme.colors.text }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </View>
    );
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <LinearGradient
        colors={[theme.colors.card, theme.colors.background]}
        style={[styles.container]}
      >
        <View style={styles.header}>
          <Sparkles color={theme.colors.primary} size={24} />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('suggestions.suggestedOutfit')}
          </Text>
        </View>

        <View style={styles.outfitGrid}>
          {mainItems.map(item => item && (
            <View key={item.id} style={styles.mainItemWrapper}>
              {renderClothingItem(item, true)}
            </View>
          ))}
        </View>

        {accessoryItems.length > 0 && (
          <View style={styles.accessoryGrid}>
            {accessoryItems.map(item => item && (
               <View key={item.id} style={styles.accessoryItemWrapper}>
                 {renderClothingItem(item, false)}
               </View>
            ))}
          </View>
        )}
        
        <View style={[styles.tipContainer, { backgroundColor: theme.colors.primaryLight }]}>
           <Text style={[styles.description, { color: theme.colors.text }]}>
             {outfit.description}
           </Text>
           {outfit.suggestion_tip && (
             <Text style={[styles.suggestionTip, { color: theme.colors.primary }]}>
                “{outfit.suggestion_tip}”
             </Text>
           )}
        </View>
        
        <TouchableOpacity
          style={[styles.likeButton, { backgroundColor: liked ? theme.colors.primary : theme.colors.surface }]}
          onPress={onLike}
          activeOpacity={0.8}
        >
          <Heart
            color={liked ? theme.colors.white : theme.colors.primary}
            size={24}
            fill={liked ? theme.colors.white : 'transparent'}
          />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay-Bold',
    flex: 1,
  },
  outfitGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  mainItemWrapper: {
    flex: 1,
  },
  mainItemContainer: {
    alignItems: 'center',
  },
  // --- DEĞİŞİKLİK BURADA: Ana fotoğrafların boyutu büyütüldü.
  mainItemImage: {
    width: '100%',
    aspectRatio: 0.75, // En-boy oranı değiştirildi (daha uzun)
    borderRadius: 16,
    marginBottom: 8,
  },
  mainItemName: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    textAlign: 'center',
  },
  accessoryGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.1)',
    paddingTop: 16,
    marginBottom: 20,
  },
  accessoryItemWrapper:{
    alignItems: 'center',
  },
  accessoryItemContainer: {
    alignItems: 'center',
    width: 80, // Genişlik artırıldı
  },
  // --- DEĞİŞİKLİK BURADA: Aksesuar fotoğraflarının boyutu büyütüldü.
  accessoryItemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginBottom: 6,
  },
  accessoryItemName: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
    textAlign: 'center',
  },
  placeholderImage: {
    backgroundColor: 'rgba(128,128,128,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  description: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  suggestionTip:{
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  likeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
});