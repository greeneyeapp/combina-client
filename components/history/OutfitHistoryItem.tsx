// components/history/OutfitHistoryItem.tsx (Güncellenmiş - Yeni image sistemi)
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Outfit } from '@/store/outfitStore';
import { router } from 'expo-router';

interface OutfitHistoryItemProps {
  outfit: Outfit;
}

export default function OutfitHistoryItem({ outfit }: OutfitHistoryItemProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();

  // Outfit'teki item ID'lerinden gerçek clothing item'ları bul
  const clothingItems = outfit.items
    .map(itemId => clothing.find(item => item.id === itemId))
    .filter(Boolean); // undefined/null olanları filtrele

  // Gösterilecek image URI'sini belirle (thumbnail öncelikli)
  const getDisplayImageUri = (item: any): string => {
    if (!item) return '';
    
    // Öncelik sırası: thumbnail -> original -> legacy
    if (item.thumbnailImageUri) return item.thumbnailImageUri;
    if (item.originalImageUri) return item.originalImageUri;
    if (item.imageUri) return item.imageUri; // Legacy support
    
    return '';
  };

  const handleItemPress = (itemId: string) => {
    router.push(`/wardrobe/${itemId}`);
  };

  const renderClothingItem = (item: any, index: number) => {
    const displayUri = getDisplayImageUri(item);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.clothingItem, { backgroundColor: theme.colors.card }]}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.7}
      >
        {displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={styles.clothingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
              {item.name?.charAt(0) || '?'}
            </Text>
          </View>
        )}
        
        <View style={styles.itemInfo}>
          <Text 
            style={[styles.itemName, { color: theme.colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.name}
          </Text>
          <Text style={[styles.itemCategory, { color: theme.colors.textLight }]}>
            {t(`categories.${item.category}`)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMissingItem = (itemId: string, index: number) => {
    return (
      <View
        key={`missing-${itemId}-${index}`}
        style={[styles.clothingItem, styles.missingItem, { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border 
        }]}
      >
        <View style={[styles.placeholderImage, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
            ?
          </Text>
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: theme.colors.textLight }]}>
            {t('wardrobe.itemNotFound')}
          </Text>
          <Text style={[styles.itemCategory, { color: theme.colors.textLight }]}>
            {t('wardrobe.removedItem')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.outfitGrid}>
        {outfit.items.map((itemId, index) => {
          const item = clothing.find(c => c.id === itemId);
          
          if (item) {
            return renderClothingItem(item, index);
          } else {
            // Item silinmiş, placeholder göster
            return renderMissingItem(itemId, index);
          }
        })}
      </View>
      
      {/* Outfit metadata */}
      <View style={styles.metadataContainer}>
        <Text style={[styles.metadataText, { color: theme.colors.textLight }]}>
          {clothingItems.length} / {outfit.items.length} {t('wardrobe.itemsAvailable')}
        </Text>
        
        {clothingItems.length !== outfit.items.length && (
          <Text style={[styles.warningText, { color: theme.colors.warning }]}>
            {t('history.someItemsRemoved')}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  outfitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clothingItem: {
    width: 70,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  missingItem: {
    borderWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  clothingImage: {
    width: '100%',
    height: 70,
  },
  placeholderImage: {
    width: '100%',
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
  },
  itemInfo: {
    padding: 6,
  },
  itemName: {
    fontSize: 10,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 8,
    fontFamily: 'Montserrat-Regular',
  },
  metadataContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  metadataText: {
    fontSize: 11,
    fontFamily: 'Montserrat-Regular',
  },
  warningText: {
    fontSize: 10,
    fontFamily: 'Montserrat-Medium',
    marginTop: 2,
  },
});