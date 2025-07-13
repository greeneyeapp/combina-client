// components/outfit/OutfitHistoryItem.tsx - File system based image loading

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Outfit } from '@/store/outfitStore';
import { router } from 'expo-router';
import { getImageUri, checkImageExists } from '@/utils/fileSystemImageManager';

interface OutfitHistoryItemProps {
  outfit: Outfit;
}

interface ItemWithUri {
  item: any;
  displayUri: string;
  isLoading: boolean;
}

export default function OutfitHistoryItem({ outfit }: OutfitHistoryItemProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  
  const [itemsWithUris, setItemsWithUris] = useState<ItemWithUri[]>([]);

  const clothingItems = outfit.items
    .map(itemId => clothing.find(item => item.id === itemId))
    .filter(Boolean);

  useEffect(() => {
    const loadDisplayUris = async () => {
      if (clothingItems.length === 0) return;

      const initialItems: ItemWithUri[] = clothingItems.map(item => ({
        item,
        displayUri: '',
        isLoading: true
      }));

      setItemsWithUris(initialItems);

      const asyncPromises = initialItems.map(async (itemWithUri, index) => {
        try {
          if (!itemWithUri.item.originalImagePath) {
            return { index, uri: '' };
          }

          // Check if original image exists
          const exists = await checkImageExists(itemWithUri.item.originalImagePath, false);
          
          if (exists) {
            const uri = getImageUri(itemWithUri.item.originalImagePath, false);
            return { index, uri };
          } else {
            return { index, uri: '' };
          }
        } catch (error) {
          console.error('Error loading file system image for history item:', error);
          return { index, uri: '' };
        }
      });

      const results = await Promise.all(asyncPromises);
      
      setItemsWithUris(prev => {
        const updated = [...prev];
        results.forEach(result => {
          if (result) {
            updated[result.index] = {
              ...updated[result.index],
              displayUri: result.uri,
              isLoading: false
            };
          }
        });
        return updated;
      });
    };

    loadDisplayUris();
  }, [clothingItems.length, outfit.id]);

  const handleItemPress = (itemId: string) => {
    router.push(`/wardrobe/${itemId}`);
  };

  const renderClothingItem = (itemWithUri: ItemWithUri, index: number) => {
    const { item, displayUri, isLoading } = itemWithUri;
    
    if (!item) return null;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.clothingItem, { backgroundColor: theme.colors.card }]}
        onPress={() => handleItemPress(item.id)}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <View style={[styles.placeholderImage, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.loadingText, { color: theme.colors.textLight }]}>
              ⏳
            </Text>
          </View>
        ) : displayUri ? (
          <Image
            source={{ uri: displayUri }}
            style={styles.clothingImage}
            resizeMode="cover"
            onError={() => {
              console.warn('File system image load error in history for item:', item.id);
              setItemsWithUris(prev => {
                const updated = [...prev];
                const itemIndex = updated.findIndex(u => u.item?.id === item.id);
                if (itemIndex >= 0) {
                  updated[itemIndex] = { ...updated[itemIndex], displayUri: '', isLoading: false };
                }
                return updated;
              });
            }}
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
          const itemWithUri = itemsWithUris.find(i => i.item?.id === itemId);
          
          if (itemWithUri) {
            return renderClothingItem(itemWithUri, index);
          } else {
            return renderMissingItem(itemId, index);
          }
        })}
      </View>
      
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
  loadingText: { fontSize: 14, fontFamily: 'Montserrat-Regular' },
  itemInfo: { padding: 6 },
  itemName: { fontSize: 10, fontFamily: 'Montserrat-SemiBold', marginBottom: 2 },
  itemCategory: { fontSize: 8, fontFamily: 'Montserrat-Regular' },
  metadataContainer: { marginTop: 8, alignItems: 'center' },
  metadataText: { fontSize: 11, fontFamily: 'Montserrat-Regular' },
  warningText: { fontSize: 10, fontFamily: 'Montserrat-Medium', marginTop: 2 },
});