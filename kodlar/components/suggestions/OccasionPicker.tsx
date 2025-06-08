import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface OccasionPickerProps {
  selectedOccasion: string;
  onSelectOccasion: (occasion: string) => void;
}

const occasions = [
  'casual',
  'work',
  'formal',
  'date',
  'party',
  'workout',
  'travel',
];

const OccasionPicker: React.FC<OccasionPickerProps> = ({
  selectedOccasion,
  onSelectOccasion,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {occasions.map(occasion => (
        <TouchableOpacity
          key={occasion}
          style={[
            styles.occasionItem,
            {
              backgroundColor: selectedOccasion === occasion
                ? theme.colors.primary
                : theme.colors.card,
              borderColor: selectedOccasion === occasion
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
          onPress={() => onSelectOccasion(occasion)}
        >
          <Text
            style={[
              styles.occasionText,
              {
                color: selectedOccasion === occasion
                  ? theme.colors.white
                  : theme.colors.text,
              },
            ]}
          >
            {t(`occasions.${occasion}`)}
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
  occasionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  occasionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
});

export default OccasionPicker;