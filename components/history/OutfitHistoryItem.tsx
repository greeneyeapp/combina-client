import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useClothingStore } from '@/store/clothingStore';
import { useOutfitStore } from '@/store/outfitStore';
import { formatDate } from '@/utils/dateUtils';
import { Outfit } from '@/store/outfitStore';
import { Trash2 } from 'lucide-react-native';

interface OutfitHistoryItemProps {
  outfit: Outfit;
}

const OutfitHistoryItem: React.FC<OutfitHistoryItemProps> = ({ outfit }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { clothing } = useClothingStore();
  const { removeOutfit } = useOutfitStore();

  // Get clothing items for this outfit
  const outfitItems = outfit.items
    .map(id => clothing.find(item => item.id === id))
    .filter(Boolean);

  return (
    <View 
      style={[
        styles.container,
        { backgroundColor: theme.colors.card }
      ]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.date, { color: theme.colors.text }]}>
            {formatDate(outfit.date)}
          </Text>
          <View style={styles.occasionContainer}>
            <Text style={[styles.occasion, { color: theme.colors.textLight }]}>
              {t(`occasions.${outfit.occasion}`)}
            </Text>
            <Text style={[styles.weather, { color: theme.colors.textLight }]}>
              • {t(`weather.${outfit.weather}`)}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => removeOutfit(outfit.id)}
        >
          <Trash2 color={theme.colors.error} size={20} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.itemsContainer}>
        {outfitItems.map(item => (
          <View 
            key={item.id} 
            style={[
              styles.itemBox,
              { backgroundColor: theme.colors.background }
            ]}
          >
            <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
            <Text 
              style={[styles.itemName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  date: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  occasionContainer: {
    flexDirection: 'row',
  },
  occasion: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  weather: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  deleteButton: {
    padding: 4,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemBox: {
    width: '30%',
    marginRight: '5%',
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 80,
    resizeMode: 'cover',
  },
  itemName: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    padding: 4,
  },
});

export default OutfitHistoryItem;