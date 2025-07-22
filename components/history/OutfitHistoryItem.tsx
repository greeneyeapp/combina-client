// components/history/OutfitHistoryItem.tsx - Tablet için daha da büyük görsellerle son hali

import React, { useState, useMemo, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Outfit } from '@/store/outfitStore';
import { router } from 'expo-router';
import { getImageUri } from '@/utils/fileSystemImageManager';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface OutfitHistoryItemProps {
  outfit: Outfit;
}

const ClothingThumbnail = memo(({ itemId }: { itemId: string }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  const [imageError, setImageError] = useState(false);
  const item = useMemo(() => clothing.find(c => c.id === itemId), [clothing, itemId]);
  const imageUri = useMemo(() => item?.thumbnailImagePath ? getImageUri(item.thumbnailImagePath, true) : '', [item]);
  const handlePress = () => item && router.push(`/wardrobe/${item.id}`);

  if (!item) {
    return (
      <View style={[styles.clothingItem, styles.missingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.placeholderImage, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>?</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.colors.textLight }]} numberOfLines={2}>{t('wardrobe.itemNotFound')}</Text>
        </View>
      </View>
    );
  }
  const hasImage = imageUri && !imageError;
  return (
    <TouchableOpacity style={[styles.clothingItem, { backgroundColor: theme.colors.card }]} onPress={handlePress} activeOpacity={0.7}>
      {hasImage ? (
        <Image source={{ uri: imageUri }} style={styles.clothingImage} resizeMode="cover" onError={() => setImageError(true)} />
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>{item.name?.charAt(0) || '?'}</Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );
});

const OutfitHistoryItem = ({ outfit }: OutfitHistoryItemProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  const availableItemsCount = useMemo(() => {
    const validIds = new Set(clothing.map(c => c.id));
    return outfit.items.filter(id => validIds.has(id)).length;
  }, [outfit.items, clothing]);

  return (
    <View style={styles.container}>
      <View style={styles.outfitGrid}>
        {outfit.items.map(itemId => (
          <ClothingThumbnail key={itemId} itemId={itemId} />
        ))}
      </View>
      <View style={styles.metadataContainer}>
        <Text style={[styles.metadataText, { color: theme.colors.textLight }]}>
          {availableItemsCount} / {outfit.items.length} {t('wardrobe.itemsAvailable')}
        </Text>
        {availableItemsCount !== outfit.items.length && (
          <Text style={[styles.warningText, { color: theme.colors.warning }]}>{t('history.someItemsRemoved')}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  outfitGrid: { 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      gap: isTablet ? 16 : 8, // Boşluk artırıldı
      justifyContent: 'center',
    },
  clothingItem: {
    width: isTablet ? 110 : 70, // DEĞİŞİKLİK: Genişlik belirgin şekilde artırıldı
    borderRadius: 16, // Daha yuvarlak
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  missingItem: { borderWidth: 1, borderStyle: 'dashed', opacity: 0.6 },
  clothingImage: { width: '100%', height: isTablet ? 110 : 70 }, // DEĞİŞİKLİK: Yükseklik artırıldı
  placeholderImage: {
    width: '100%',
    height: isTablet ? 110 : 70, // DEĞİŞİKLİK: Yükseklik artırıldı
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: isTablet ? 32 : 20, fontFamily: 'Montserrat-Bold' },
  itemInfo: { 
    paddingVertical: 8, 
    paddingHorizontal: 6,
    minHeight: isTablet ? 48 : 38, // Yüksekliği artırdık
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemName: { 
    fontSize: isTablet ? 13 : 10, // Font boyutu artırıldı
    fontFamily: 'Montserrat-SemiBold', 
    textAlign: 'center' 
  },
  metadataContainer: { marginTop: 16, alignItems: 'center' },
  metadataText: { fontSize: isTablet ? 14 : 11, fontFamily: 'Montserrat-Regular' },
  warningText: { fontSize: isTablet ? 13 : 10, fontFamily: 'Montserrat-Medium', marginTop: 4 },
});

export default memo(OutfitHistoryItem);