// kodlar/components/wardrobe/ClothingItem.tsx - Tüm özellikleri içeren ve performansı optimize edilmiş son hali

import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { Edit2, ImageOff } from 'lucide-react-native';
import { ClothingItem as TClothingItem } from '@/store/clothingStore';
import { getImageUri } from '@/utils/fileSystemImageManager';
import { ALL_COLORS } from '@/utils/constants';

interface ClothingItemProps {
  item: TClothingItem;
  onPress: () => void;
  onEdit: () => void;
}

// React.memo, bu component'in sadece 'item' prop'u değiştiğinde yeniden render edilmesini sağlar.
const ClothingItem = memo(({ item, onPress, onEdit }: ClothingItemProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  // Sadece resim yükleme hatasını takip eden state.
  const [imageError, setImageError] = useState(false);

  // Component'e yeni bir item geldiğinde (liste filtrelendiğinde vb.)
  // hata durumunu sıfırlayarak resmin yeniden yüklenmesini sağlıyoruz.
  useEffect(() => {
    setImageError(false);
  }, [item.thumbnailImagePath]);

  // Resim URI'sini doğrudan oluşturuyoruz. Bu, render hızını artırır.
  const thumbnailUri = item.thumbnailImagePath ? getImageUri(item.thumbnailImagePath, true) : '';

  const handleEditPress = (e: any) => {
    e.stopPropagation(); // Arkadaki karta tıklanmasını engeller.
    onEdit();
  };

  const itemColors = item.colors && item.colors.length > 0 ? item.colors : [item.color];
  
  // Renk göstergelerini render eden fonksiyon (orijinal kodunuzdan alındı ve korundu)
  const renderColorIndicators = () => {
    const displayColors = itemColors.slice(0, 3);
    
    if (displayColors.length === 1) {
      const colorData = ALL_COLORS.find(c => c.name === displayColors[0]);
      const colorHex = colorData?.hex || '#CCCCCC';
      
      return (
        <View style={styles.singleColorContainer}>
          <View 
            style={[
              styles.colorCircle, 
              { 
                backgroundColor: colorHex,
                borderColor: displayColors[0] === 'white' ? theme.colors.border : 'transparent',
                borderWidth: displayColors[0] === 'white' ? 1 : 0 
              }
            ]} 
          />
          <Text style={[styles.colorText, { color: theme.colors.textLight }]} numberOfLines={1}>
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
              const colorHex = colorData?.hex || '#CCCCCC';
              
              return (
                <View 
                  key={colorName}
                  style={[
                    styles.multiColorCircle, 
                    { 
                      backgroundColor: colorHex,
                      borderColor: colorName === 'white' ? theme.colors.border : 'transparent',
                      borderWidth: colorName === 'white' ? 1 : 0,
                      marginLeft: index > 0 ? -4 : 0,
                      zIndex: displayColors.length - index
                    }
                  ]} 
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
          <ImageOff color={theme.colors.textLight} size={32}/>
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
    aspectRatio: 1,
    position: 'relative',
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
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  infoContainer: { 
    padding: 10,
    gap: 6, // Elemanlar arasına boşluk ekledik
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
  singleColorContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  colorCircle: { 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    marginRight: 6, 
  },
  colorText: { 
    fontSize: 11, 
    fontFamily: 'Montserrat-Regular',
    flex: 1,
  },
  multiColorContainer: {
    // Bu container artık sadece circle'ları içerecek, text'i değil.
  },
  colorCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiColorCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  moreColorsIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
  },
  moreColorsText: {
    fontSize: 8,
    fontFamily: 'Montserrat-Bold',
    color: '#FFFFFF',
  },
});

export default ClothingItem;