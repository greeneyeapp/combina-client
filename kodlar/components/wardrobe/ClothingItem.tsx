import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ClothingItem as ClothingItemType } from '@/store/clothingStore';

interface ClothingItemProps {
  item: ClothingItemType;
  onPress: () => void;
}

const ClothingItem: React.FC<ClothingItemProps> = ({ item, onPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUri }} style={styles.image} />
      </View>
      <View style={styles.infoContainer}>
        <Text 
          style={[styles.name, { color: theme.colors.text }]} 
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text style={[styles.category, { color: theme.colors.textLight }]}>
          {t(`categories.${item.category}`)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  imageContainer: {
    width: '100%',
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    marginBottom: 4,
  },
  category: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
  },
});

export default ClothingItem;