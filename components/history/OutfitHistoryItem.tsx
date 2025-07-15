// kodlar/components/history/OutfitHistoryItem.tsx - Performans için tamamen yeniden yazıldı

import React, { useState, useMemo, memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Outfit } from '@/store/outfitStore';
import { router } from 'expo-router';
import { getImageUri } from '@/utils/fileSystemImageManager';

interface OutfitHistoryItemProps {
  outfit: Outfit;
}

// Her bir küçük resmi (thumbnail) render etmek için oluşturulmuş,
// kendi kendini yöneten ve performansı optimize edilmiş component.
const ClothingThumbnail = memo(({ itemId }: { itemId: string }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  const [imageError, setImageError] = useState(false);

  // useMemo, bu component'in gereksiz yere item aramasını engeller.
  const item = useMemo(() => clothing.find(c => c.id === itemId), [clothing, itemId]);

  // Resim URI'si senkron olarak oluşturulur, async işlem yok.
  const imageUri = useMemo(() => item?.thumbnailImagePath ? getImageUri(item.thumbnailImagePath, true) : '', [item]);

  const handlePress = () => item && router.push(`/wardrobe/${item.id}`);

  // Eğer kıyafet silinmişse veya bulunamıyorsa, bir placeholder göster.
  if (!item) {
    return (
      <View style={[styles.clothingItem, styles.missingItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.placeholderImage, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>?</Text>
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.colors.textLight }]} numberOfLines={2}>
            {t('wardrobe.itemNotFound')}
          </Text>
        </View>
      </View>
    );
  }

  const hasImage = imageUri && !imageError;

  return (
    <TouchableOpacity
      style={[styles.clothingItem, { backgroundColor: theme.colors.card }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {hasImage ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.clothingImage}
          resizeMode="cover"
          // Resim yüklenemezse (dosya silinmiş vb.), hata state'ini set et.
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.placeholderImage, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
            {item.name?.charAt(0) || '?'}
          </Text>
        </View>
      )}
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

// Ana component artık çok daha basit ve performanslı.
const OutfitHistoryItem = ({ outfit }: OutfitHistoryItemProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();

  // Bu hesaplama hala burada yapılabilir çünkü sadece bir kez çalışır.
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
          <Text style={[styles.warningText, { color: theme.colors.warning }]}>
            {t('history.someItemsRemoved')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 8 },
  outfitGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  clothingItem: {
    width: 70,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1, },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  missingItem: { borderWidth: 1, borderStyle: 'dashed', opacity: 0.6 },
  clothingImage: { width: '100%', height: 70 },
  placeholderImage: {
    width: '100%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 20, fontFamily: 'Montserrat-Bold' },
  itemInfo: { 
    paddingVertical: 6, 
    paddingHorizontal: 4,
    minHeight: 38, // Sabit yükseklik
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemName: { 
    fontSize: 10, 
    fontFamily: 'Montserrat-SemiBold', 
    textAlign: 'center' 
  },
  metadataContainer: { marginTop: 12, alignItems: 'center' },
  metadataText: { fontSize: 11, fontFamily: 'Montserrat-Regular' },
  warningText: { fontSize: 10, fontFamily: 'Montserrat-Medium', marginTop: 2 },
});

export default memo(OutfitHistoryItem);