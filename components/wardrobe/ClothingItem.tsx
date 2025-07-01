// components/wardrobe/ClothingItem.tsx

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { Edit2, ImageOff } from 'lucide-react-native'; // ImageOff ikonu eklendi
import { ClothingItem as TClothingItem } from '@/store/clothingStore';

interface ClothingItemProps {
  item: TClothingItem;
  onPress: () => void;
  onEdit: () => void;
}

export default function ClothingItem({ item, onPress, onEdit }: ClothingItemProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Gösterilecek image URI'sini belirle
  const getDisplayImageUri = (): string => {
    if (item.isImageMissing) return ''; // Resim kayıpsa URI döndürme

    if (item.thumbnailImageUri) return item.thumbnailImageUri;
    if (item.originalImageUri) return item.originalImageUri;
    if (item.imageUri) return item.imageUri; // Legacy
    
    return '';
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
          />
        ) : (
          // RESİM KAYIPSA BURASI GÖSTERİLİR
          <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background }]}>
            <ImageOff color={theme.colors.textLight} size={32}/>
            <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
              {t('wardrobe.imageNotAvailable')}
            </Text>
          </View>
        )}
        
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
  infoContainer: { padding: 12, },
  itemName: { fontSize: 14, fontFamily: 'Montserrat-SemiBold', marginBottom: 6, lineHeight: 18, },
  categoryContainer: { marginBottom: 6, },
  categoryText: { fontSize: 12, fontFamily: 'Montserrat-Regular', },
  colorContainer: { flexDirection: 'row', alignItems: 'center', },
  colorCircle: { width: 12, height: 12, borderRadius: 6, marginRight: 6, borderWidth: 1, },
  colorText: { fontSize: 11, fontFamily: 'Montserrat-Regular', },
});