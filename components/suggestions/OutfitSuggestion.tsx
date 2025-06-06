import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ClothingItem } from '@/store/clothingStore';

interface OutfitSuggestionProps {
  outfit: {
    items: ClothingItem[];
    description: string;
  };
}

const OutfitSuggestion: React.FC<OutfitSuggestionProps> = ({ outfit }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Group items by category
  const categorizedItems: Record<string, ClothingItem[]> = {};
  outfit.items.forEach(item => {
    if (!categorizedItems[item.category]) {
      categorizedItems[item.category] = [];
    }
    categorizedItems[item.category].push(item);
  });

  // Order categories for display
  const categoryOrder = ['top', 'dress', 'bottom', 'outerwear', 'shoes', 'accessory'];
  
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.description, { color: theme.colors.text }]}>
        {outfit.description}
      </Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.itemsScrollView}
      >
        {outfit.items.map(item => (
          <View 
            key={item.id} 
            style={styles.itemContainer}
          >
            <View style={[styles.imageContainer, { backgroundColor: theme.colors.background }]}>
              <Image source={{ uri: item.imageUri }} style={styles.image} />
            </View>
            <Text 
              style={[styles.itemName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text style={[styles.itemCategory, { color: theme.colors.textLight }]}>
              {t(`categories.${item.category}`)}
            </Text>
          </View>
        ))}
      </ScrollView>
      
      <View style={styles.breakdown}>
        <Text style={[styles.breakdownTitle, { color: theme.colors.text }]}>
          {t('suggestions.outfitBreakdown')}
        </Text>
        
        {categoryOrder.map(category => {
          if (!categorizedItems[category]) return null;
          
          return (
            <View key={category} style={styles.categoryRow}>
              <Text style={[styles.categoryLabel, { color: theme.colors.textLight }]}>
                {t(`categories.${category}`)}:
              </Text>
              <Text style={[styles.categoryItems, { color: theme.colors.text }]}>
                {categorizedItems[category]
                  .map(item => item.name)
                  .join(', ')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    marginBottom: 16,
  },
  itemsScrollView: {
    paddingVertical: 8,
  },
  itemContainer: {
    width: 120,
    marginRight: 16,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemName: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    marginBottom: 4,
  },
  itemCategory: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
  },
  breakdown: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  breakdownTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    width: 100,
  },
  categoryItems: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    flex: 1,
  },
});

export default OutfitSuggestion;