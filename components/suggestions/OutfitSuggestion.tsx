import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { OutfitSuggestionResponse } from '@/services/aiService';
import { Heart } from 'lucide-react-native';

interface OutfitSuggestionProps {
  outfit: OutfitSuggestionResponse;
}

const OutfitSuggestion: React.FC<OutfitSuggestionProps & { onLike?: () => void, liked?: boolean }> = ({ outfit, onLike, liked }) => {
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <FlatList
        horizontal
        data={mergedItems}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.itemContainer, index > 0 && styles.itemMargin]}>
            {item.imageUri ? (
              <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
            ) : (
              <View style={[styles.itemImage, { backgroundColor: '#ccc' }]} />
            )}
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {onLike && (
        <TouchableOpacity style={styles.heartBtn} onPress={onLike}>
          <Heart color={liked ? theme.colors.accent : theme.colors.textLight} fill={liked ? theme.colors.accent : "none"} size={28} />
        </TouchableOpacity>
      )}

      <Text style={[styles.description, { color: theme.colors.text }]}>
        {renderHighlightedDescription()}
      </Text>

      {outfit.suggestion_tip && (
        <View style={[styles.tipBox, { backgroundColor: theme.colors.card, borderLeftColor: theme.colors.accent }]}>
          <Text style={[styles.tipText, { color: theme.colors.text }]}>💡 {outfit.suggestion_tip}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 16,
  },
  itemContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  itemMargin: {
    marginLeft: -20,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  heartBtn: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
  },
  description: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  highlight: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  tipBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  tipText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default OutfitSuggestion;