// components/wardrobe/ClothingItem.tsx - File system based lazy loading

import React, { useState, useEffect, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { Edit2, ImageOff } from 'lucide-react-native';
import { ClothingItem as TClothingItem } from '@/store/clothingStore';
import { getImageUri, checkImageExists } from '@/utils/fileSystemImageManager';
import { ALL_COLORS } from '@/utils/constants';

interface ClothingItemProps {
  item: TClothingItem;
  onPress: () => void;
  onEdit: () => void;
}

const ClothingItem = memo(({ item, onPress, onEdit }: ClothingItemProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [thumbnailUri, setThumbnailUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadThumbnail = async () => {
      if (!item.thumbnailImagePath) {
        setIsLoading(false);
        setImageError(true);
        return;
      }

      setIsLoading(true);
      setImageError(false);
      
      try {
        // Check if thumbnail exists
        const exists = await checkImageExists(item.thumbnailImagePath, true);
        
        if (isMounted) {
          if (exists) {
            const uri = getImageUri(item.thumbnailImagePath, true);
            setThumbnailUri(uri);
          } else {
            setImageError(true);
          }
        }
      } catch (error) {
        console.error('Error loading thumbnail for item:', item.id, error);
        if (isMounted) {
          setImageError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadThumbnail();
    
    return () => {
      isMounted = false;
    };
  }, [item.thumbnailImagePath, item.id]);

  const handleEditPress = (e: any) => {
    e.stopPropagation();
    onEdit();
  };

  const itemColors = item.colors && item.colors.length > 0 ? item.colors : [item.color];
  const colorNames = itemColors.map(color => t(`colors.${color}`)).join(', ');

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
          <Text style={[styles.colorText, { color: theme.colors.textLight }]}>
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
          <Text 
            style={[styles.colorText, { color: theme.colors.textLight }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {colorNames}
          </Text>
        </View>
      );
    }
  };

  const renderImage = () => {
    if (isLoading) {
      return (
        <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
        </View>
      );
    }

    if (imageError || !thumbnailUri) {
      return (
        <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background }]}>
          <ImageOff color={theme.colors.textLight} size={32}/>
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
            {item.name?.charAt(0) || '?'}
          </Text>
        </View>
      );
    }

    return (
      <Image
        source={{ uri: thumbnailUri }}
        style={styles.image}
        resizeMode="cover"
        onError={(error) => {
          console.warn('Thumbnail load error for item:', item.id, error.nativeEvent.error);
          setImageError(true);
        }}
        onLoad={() => {
          // Thumbnail loaded successfully
        }}
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
        
        <View style={styles.categoryContainer}>
          <Text style={[styles.categoryText, { color: theme.colors.textLight }]}>
            {t(`categories.${item.category}`)}
          </Text>
        </View>
        
        {renderColorIndicators()}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2, },
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
    gap: 8
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
    paddingHorizontal: 4,
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
    elevation: 3,
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
    marginBottom: 8, 
  },
  categoryText: { 
    fontSize: 12, 
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
    gap: 4,
  },
  colorCirclesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiColorCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  moreColorsIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -4,
  },
  moreColorsText: {
    fontSize: 6,
    fontFamily: 'Montserrat-Bold',
    color: '#FFFFFF',
  },
});

export default ClothingItem;