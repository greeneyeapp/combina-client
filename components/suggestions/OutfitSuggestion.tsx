// Dosya: kodlar/components/suggestions/OutfitSuggestion.tsx (TAM KOD)

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { OutfitSuggestionResponse } from '@/services/aiService';
import { Heart, Sparkles } from 'lucide-react-native';

interface OutfitSuggestionProps {
  outfit: OutfitSuggestionResponse;
  onLike?: () => void;
  liked?: boolean;
}

const OutfitSuggestion: React.FC<OutfitSuggestionProps> = ({ outfit, onLike, liked }) => {
  const { theme } = useTheme();
  const { clothing } = useClothingStore();

  const mergedItems = useMemo(() => {
    return outfit.items.map(item => {
      const local = clothing.find(c => c.id === item.id);
      return {
        ...item,
        imageUri: local?.imageUri ?? null,
      };
    });
  }, [outfit.items, clothing]);

  const renderHighlightedDescription = () => {
    // Bu fonksiyon aynı kalabilir
    let elements: (string | { match: string })[] = [outfit.description];
    const sorted = [...outfit.items].sort((a, b) => b.name.length - a.name.length);

    for (const item of sorted) {
      const regex = new RegExp(item.name, 'gi');
      const next: typeof elements = [];

      for (const el of elements) {
        if (typeof el === 'string') {
          let lastIndex = 0;
          let match;
          while ((match = regex.exec(el)) !== null) {
            if (match.index > lastIndex) next.push(el.slice(lastIndex, match.index));
            next.push({ match: el.substr(match.index, match[0].length) });
            lastIndex = match.index + match[0].length;
          }
          if (lastIndex < el.length) next.push(el.slice(lastIndex));
        } else {
          next.push(el);
        }
      }
      elements = next;
    }

    return elements.map((el, idx) =>
      typeof el === 'string' ? (
        <Text key={idx}>{el}</Text>
      ) : (
        <Text key={idx} style={[styles.highlight, { color: theme.colors.accent }]}>
          {el.match}
        </Text>
      )
    );
  };

  const renderItems = () => {
    const itemCount = mergedItems.length;

    // 3 ürün için özel kolaj görünümü
    if (itemCount === 3) {
      return (
        <View style={styles.collageContainer}>
          <View style={styles.largeItem}>
            <Image source={{ uri: mergedItems[0].imageUri }} style={styles.itemImage} />
          </View>
          <View style={styles.smallItemsColumn}>
            <View style={styles.smallItem}>
              <Image source={{ uri: mergedItems[1].imageUri }} style={styles.itemImage} />
            </View>
            <View style={styles.smallItem}>
              <Image source={{ uri: mergedItems[2].imageUri }} style={styles.itemImage} />
            </View>
          </View>
        </View>
      );
    }
    
    // 1, 2, 4 veya daha fazla ürün için standart grid görünümü
    return (
      <View style={styles.gridContainer}>
        {mergedItems.map(item => (
          <View key={item.id} style={[styles.gridItem, { width: itemCount === 1 ? '100%' : '48%' }]}>
             <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.itemsContainer}>
        {renderItems()}
        {onLike && (
          <TouchableOpacity 
            style={[styles.heartBtn, { backgroundColor: theme.colors.card }]} 
            onPress={onLike}
          >
            <Heart 
              color={liked ? theme.colors.primary : theme.colors.textLight} 
              fill={liked ? theme.colors.primaryLight : "transparent"} 
              size={24} 
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.descriptionContainer}>
          <Text style={[styles.description, { color: theme.colors.text }]}>
            {renderHighlightedDescription()}
          </Text>
      </View>

      {outfit.suggestion_tip && (
        <View style={[styles.tipBox, { borderLeftColor: theme.colors.accent, backgroundColor: theme.colors.background }]}>
          <Sparkles color={theme.colors.accent} size={20} style={styles.tipIcon} />
          <Text style={[styles.tipText, { color: theme.colors.text }]}>{outfit.suggestion_tip}</Text>
        </View>
      )}
    </View>
  );
};

// --- YENİ DİNAMİK STİLLER ---
const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  itemsContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  // 3'lü kolaj stilleri
  collageContainer: {
    flexDirection: 'row',
    gap: 8,
    height: 200, // Sabit bir yükseklik verelim
  },
  largeItem: {
    flex: 2, // Geniş alan
    borderRadius: 12,
    overflow: 'hidden',
  },
  smallItemsColumn: {
    flex: 1, // Dar alan
    flexDirection: 'column',
    gap: 8,
  },
  smallItem: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  // Standart grid stilleri
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    aspectRatio: 1,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    bottom: -10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  descriptionContainer: {
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 15,
    lineHeight: 22,
  },
  highlight: {
    fontFamily: 'Montserrat-Bold',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 5,
  },
  tipIcon: {
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default OutfitSuggestion;