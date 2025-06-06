import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface CategoryPickerProps {
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  selectedCategories?: string[];
  onSelectCategories?: (categories: string[]) => void;
  multiSelect?: boolean;
}

const categories = [
  'top',
  'bottom',
  'outerwear',
  'dress',
  'shoes',
  'accessory',
];

const CategoryPicker: React.FC<CategoryPickerProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedCategories = [],
  onSelectCategories,
  multiSelect = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleSelect = (category: string) => {
    if (multiSelect && onSelectCategories) {
      if (selectedCategories.includes(category)) {
        onSelectCategories(selectedCategories.filter(c => c !== category));
      } else {
        onSelectCategories([...selectedCategories, category]);
      }
    } else if (onSelectCategory) {
      onSelectCategory(category);
    }
  };

  const isSelected = (category: string) => {
    if (multiSelect) {
      return selectedCategories.includes(category);
    }
    return selectedCategory === category;
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map(category => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryItem,
            {
              backgroundColor: isSelected(category)
                ? theme.colors.primary
                : theme.colors.card,
              borderColor: isSelected(category)
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
          onPress={() => handleSelect(category)}
        >
          <Text
            style={[
              styles.categoryText,
              {
                color: isSelected(category)
                  ? theme.colors.white
                  : theme.colors.text,
              },
            ]}
          >
            {t(`categories.${category}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
});

export default CategoryPicker;