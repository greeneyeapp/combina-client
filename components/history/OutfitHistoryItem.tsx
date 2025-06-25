// Dosya: kodlar/components/history/OutfitHistoryItem.tsx (TAMAMEN DEĞİŞTİRİN)

import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { useClothingStore } from '@/store/clothingStore';
import { Outfit } from '@/store/outfitStore';

interface OutfitHistoryItemProps {
  outfit: Outfit;
}

const OutfitHistoryItem: React.FC<OutfitHistoryItemProps> = ({ outfit }) => {
  const { clothing } = useClothingStore();

  const outfitItems = outfit.items
    .map(id => clothing.find(item => item.id === id))
    .filter(Boolean); // null/undefined olanları filtrele

  // En fazla 5 ürün gösterelim
  const itemsToShow = outfitItems.slice(0, 5);

  return (
    <View style={styles.container}>
      {itemsToShow.map((item, index) => (
        <View 
          key={item!.id} 
          style={[
            styles.itemContainer, 
            // Her bir sonraki daireyi sola kaydır
            { marginLeft: index > 0 ? -25 : 0 } 
          ]}
        >
          {item!.imageUri ? (
            <Image source={{ uri: item!.imageUri }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, { backgroundColor: '#ccc' }]} />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemContainer: {
    width: 50,
    height: 50,
    borderRadius: 25, // Tam daire
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF', // Dairelerin etrafındaki beyaz çerçeve
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
});

export default OutfitHistoryItem;