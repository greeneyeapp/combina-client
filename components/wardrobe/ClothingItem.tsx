// components/wardrobe/ClothingItem.tsx - Görsel optimizasyonu

import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { Edit2, ImageOff } from 'lucide-react-native';
import { ClothingItem as TClothingItem } from '@/store/clothingStore';
import { getImageUri } from '@/utils/fileSystemImageManager';
import { ALL_COLORS } from '@/utils/constants';
import ColorPatternDisplay from '@/components/common/ColorPatternDisplay';

interface ClothingItemProps {
  item: TClothingItem;
  onPress: () => void;
  onEdit: () => void;
}

const ClothingItem = memo(({ item, onPress, onEdit }: ClothingItemProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [imageError, setImageError] = useState(false);
  const [imageAspectRatio, setImageAspectRatio] = useState<number>(1);

  useEffect(() => {
    setImageError(false);
  }, [item.thumbnailImagePath]);

  const thumbnailUri = item.thumbnailImagePath ? getImageUri(item.thumbnailImagePath, true) : '';

  const handleEditPress = (e: any) => {
    e.stopPropagation();
    onEdit();
  };

  const itemColors = item.colors && item.colors.length > 0 ? item.colors : [item.color];

  // Resim yüklendiğinde aspect ratio'yu hesapla
  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    if (width && height) {
      setImageAspectRatio(width / height);
    }
  };

  const renderColorIndicators = () => {
    const displayColors = itemColors.slice(0, 3);

    if (displayColors.length === 1) {
      const colorData = ALL_COLORS.find(c => c.name === displayColors[0]);
      if (!colorData) return null;

      return (
        <View style={styles.singleColorContainer}>
          <ColorPatternDisplay
            color={colorData}
            size={14}
            theme={theme}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.colorText, { color: theme.colors.textLight }]} numberOfLines={2}>
            {t(`colors.${displayColors[0]}`)}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.multiColorContainer}>
          <View style={styles.colorCirclesRow}>
            {displayColors.map((colorName, index) => {
              const colorData = ALL_COLORS.find(c => c.name === colorName);
              if (!colorData) return null;

              return (
                <ColorPatternDisplay
                  key={colorName}
                  color={colorData}
                  size={14}
                  theme={theme}
                  style={{
                    marginLeft: index > 0 ? -2 : 0,
                    zIndex: displayColors.length - index
                  }}
                />
              );
            })}
            {itemColors.length > 3 && (
              <View style={[styles.moreColorsIndicator, { backgroundColor: theme.colors.textLight }]}>
                <Text style={styles.moreColorsText}>+</Text>
              </View>
            )}
          </View>
        </View>
      );
    }
  };

  const renderImage = () => {
    if (imageError || !thumbnailUri) {
      return (
        <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background }]}>
          <ImageOff color={theme.colors.textLight} size={32} />
        </View>
      );
    }

    // SEÇENEK 1: Dinamik yükseklik
    /* 
    const maxAspectRatio = 1.5;
    const minAspectRatio = 0.7; 
    const clampedAspectRatio = Math.max(minAspectRatio, Math.min(maxAspectRatio, imageAspectRatio));
    return (
      <Image
        source={{ uri: thumbnailUri }}
        style={[styles.image, { aspectRatio: clampedAspectRatio }]}
        resizeMode="contain"
        onLoad={handleImageLoad}
        onError={() => setImageError(true)}
      />
    );
    */

    // SEÇENEK 2: Kare format ama doğru orantıda
    return (
      <Image
        source={{ uri: thumbnailUri }}
        style={styles.image}
        resizeMode="contain" // Görüntüyü kırpmadan sığdır
        onLoad={handleImageLoad}
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {renderImage()}
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleEditPress}
          activeOpacity={0.8}
        >
          <Edit2 color={theme.colors.white} size={14} />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text
          style={[styles.itemName, { color: theme.colors.text }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
        <Text style={[styles.categoryText, { color: theme.colors.textLight }]}>
          {t(`categories.${item.category}`)}
        </Text>
        {renderColorIndicators()}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Kare format için geri ekle
    position: 'relative',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Bu önemli - taşan kısımları gizle
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  itemName: {
    fontSize: 13,
    fontFamily: 'Montserrat-SemiBold',
    lineHeight: 16,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Montserrat-Regular',
  },
  infoContainer: {
    padding: 12,
    gap: 6,
    minHeight: 70,
  },
  singleColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 20,
  },
  colorText: {
    fontSize: 11,
    fontFamily: 'Montserrat-Regular',
    flex: 1,
    lineHeight: 13,
  },
  multiColorContainer: {
    minHeight: 20,
  },
  colorCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  moreColorsIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -2,
  },
  moreColorsText: {
    fontSize: 9,
    fontFamily: 'Montserrat-Bold',
    color: '#FFFFFF',
  },
});

export default ClothingItem;