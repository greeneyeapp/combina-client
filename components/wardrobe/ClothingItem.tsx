// kodlar/components/wardrobe/ClothingItem.tsx - iPad için büyütülmüş ve orantılı tasarım

import React, { useState, useEffect, memo } from 'react';
// YENİ: Dimensions modülü eklendi
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { Edit2, ImageOff } from 'lucide-react-native';
import { ClothingItem as TClothingItem } from '@/store/clothingStore';
import { getImageUri } from '@/utils/fileSystemImageManager';
import { ALL_COLORS } from '@/utils/constants';
import ColorPatternDisplay from '@/components/common/ColorPatternDisplay';

// YENİ: iPad tespiti
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface ClothingItemProps {
  item: TClothingItem;
  onPress: () => void;
  onEdit: () => void;
}

const ClothingItem = memo(({ item, onPress, onEdit }: ClothingItemProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [item.thumbnailImagePath]);

  const thumbnailUri = item.thumbnailImagePath ? getImageUri(item.thumbnailImagePath, true) : '';
  const handleEditPress = (e: any) => {
    e.stopPropagation();
    onEdit();
  };
  const itemColors = item.colors && item.colors.length > 0 ? item.colors : [item.color];

  const renderColorIndicators = () => {
    const displayColors = itemColors.slice(0, 3);
    const colorIndicatorSize = isTablet ? 18 : 14;

    if (displayColors.length === 1) {
      const colorData = ALL_COLORS.find(c => c.name === displayColors[0]);
      if (!colorData) return null;
      return (
        <View style={styles.singleColorContainer}>
          <ColorPatternDisplay
            color={colorData}
            size={colorIndicatorSize}
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
                  size={colorIndicatorSize}
                  theme={theme}
                  style={{
                    marginLeft: index > 0 ? -4 : 0, // Üst üste binmeyi artırdık
                    zIndex: displayColors.length - index,
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
          <ImageOff color={theme.colors.textLight} size={isTablet ? 48 : 32} />
        </View>
      );
    }
    return (
      <Image
        source={{ uri: thumbnailUri }}
        style={styles.image}
        resizeMode="cover"
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
          <Edit2 color={theme.colors.white} size={isTablet ? 18 : 14} />
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

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
const styles = StyleSheet.create({
  container: {
    borderRadius: isTablet ? 20 : 12, // Daha yuvarlak
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    top: isTablet ? 12 : 6,
    right: isTablet ? 12 : 6,
    width: isTablet ? 36 : 28, // Büyüdü
    height: isTablet ? 36 : 28,
    borderRadius: isTablet ? 18 : 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  infoContainer: {
    padding: isTablet ? 16 : 12, // İç boşluk arttı
    gap: isTablet ? 8 : 6,
    minHeight: isTablet ? 100 : 70, // Yükseklik arttı
  },
  itemName: {
    fontSize: isTablet ? 16 : 13, // Büyüdü
    fontFamily: 'Montserrat-SemiBold',
    lineHeight: isTablet ? 22 : 16,
  },
  categoryText: {
    fontSize: isTablet ? 13 : 11, // Büyüdü
    fontFamily: 'Montserrat-Regular',
  },
  singleColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minHeight: 20,
  },
  colorText: {
    fontSize: isTablet ? 14 : 11, // Büyüdü
    fontFamily: 'Montserrat-Regular',
    flex: 1,
    lineHeight: 16,
  },
  multiColorContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 20,
  },
  colorCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moreColorsIndicator: {
    width: isTablet ? 18 : 14, // Büyüdü
    height: isTablet ? 18 : 14,
    borderRadius: isTablet ? 9 : 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
  },
  moreColorsText: {
    fontSize: 10,
    fontFamily: 'Montserrat-Bold',
    color: '#FFFFFF',
  },
});

export default ClothingItem;