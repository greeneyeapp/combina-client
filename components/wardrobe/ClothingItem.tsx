import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ClothingItem as TClothingItem } from '@/store/clothingStore';
import { Edit2 } from 'lucide-react-native';

interface ClothingItemProps {
  item: TClothingItem;
  onPress: () => void;
  onEdit: (id: string) => void;
}

const ClothingItem: React.FC<ClothingItemProps> = ({ item, onPress, onEdit }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.itemContainer]}
      onPress={onPress}
    >
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Image source={{ uri: item.imageUri }} style={styles.image} />
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.category, { color: theme.colors.textLight }]}>
          {t(`categories.${item.category}`)}
        </Text>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => onEdit(item.id)}
        >
          <Edit2 color={theme.colors.white} size={16} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    padding: 0,
    height: 140,
    minWidth: 0,
  },
  card: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  image: {
    width: '100%',
    height: '70%',
    resizeMode: 'cover',
    marginBottom: 5,
  },
  name: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 5,
    marginBottom: 2,
  },
  category: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 5,
  },
  editButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ClothingItem;