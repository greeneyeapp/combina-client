// components/wardrobe/ClothingItem.tsx (Güncellenmiş - Thumbnail sistemi)
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { Edit2 } from 'lucide-react-native';
import { ClothingItem as TClothingItem } from '@/store/clothingStore';

interface ClothingItemProps {
  item: TClothingItem;
  onPress: () => void;
  onEdit: () => void;
}

export default function ClothingItem({ item, onPress, onEdit }: ClothingItemProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [imageError, setImageError] = useState(false);
  const [hasLoggedError, setHasLoggedError] = useState(false);

  // Gösterilecek image URI'sini belirle
  const getDisplayImageUri = (): string => {
    // Öncelik sırası:
    // 1. Thumbnail (liste görünümü için optimize edilmiş)
    // 2. Original image (galeri referansı)
    // 3. Eski sistem imageUri (backward compatibility)
    
    if (item.thumbnailImageUri && !imageError) {
      return item.thumbnailImageUri;
    }
    
    if (item.originalImageUri) {
      return item.originalImageUri;
    }
    
    // Backward compatibility için eski imageUri
    if (item.imageUri) {
      return item.imageUri;
    }
    
    return '';
  };

  // Debug için image tipini belirle
  const getImageTypeLabel = (): string => {
    if (item.thumbnailImageUri && !imageError) return 'T';
    if (item.originalImageUri) return 'O';
    if (item.imageUri) return 'L';
    return 'X';
  };

  const getImageTypeBadgeColor = (): string => {
    const type = getImageTypeLabel();
    switch (type) {
      case 'T': return '#4CAF50'; // Yeşil - Thumbnail
      case 'O': return '#FF9800'; // Turuncu - Original
      case 'L': return '#2196F3'; // Mavi - Legacy
      default: return '#F44336'; // Kırmızı - Error
    }
  };

  const handleImageError = () => {
    if (!hasLoggedError) {
      console.warn(`Image load failed for item: ${item.name} (${item.id})`);
      setHasLoggedError(true);
    }
    setImageError(true);
  };

  const handleImageLoad = () => {
    // Image başarıyla yüklendiyse error state'ini temizle
    if (imageError) {
      setImageError(false);
    }
  };

  const displayUri = getDisplayImageUri();

  const handleEditPress = (e: any) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.colors.card }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={styles.image}
            resizeMode="cover"
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
              {t('wardrobe.noImage')}
            </Text>
          </View>
        )}
        
        {/* Edit button */}
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleEditPress}
          activeOpacity={0.8}
        >
          <Edit2 color={theme.colors.white} size={14} />
        </TouchableOpacity>
        
        {/* Image type indicator (debug için, production'da kaldırılabilir) */}
        {__DEV__ && displayUri && (
          <View style={[styles.debugBadge, { backgroundColor: getImageTypeBadgeColor() }]}>
            <Text style={styles.debugText}>{getImageTypeLabel()}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.itemName, { color: theme.colors.text }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.name}
        </Text>
        
        <View style={styles.categoryContainer}>
          <Text style={[styles.categoryText, { color: theme.colors.textLight }]}>
            {t(`categories.${item.category}`)}
          </Text>
        </View>
        
        <View style={styles.colorContainer}>
          <View 
            style={[
              styles.colorCircle, 
              { 
                backgroundColor: item.color,
                borderColor: theme.colors.border 
              }
            ]} 
          />
          <Text style={[styles.colorText, { color: theme.colors.textLight }]}>
            {t(`colors.${item.color}`)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
  placeholderText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  editButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  debugBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Montserrat-Bold',
  },
  infoContainer: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 6,
    lineHeight: 18,
  },
  categoryContainer: {
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
    borderWidth: 1,
  },
  colorText: {
    fontSize: 11,
    fontFamily: 'Montserrat-Regular',
  },
});