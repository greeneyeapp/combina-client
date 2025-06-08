import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface StylePickerProps {
  selectedStyle?: string;
  onSelectStyle?: (style: string) => void;
  selectedStyles?: string[];
  onSelectStyles?: (styles: string[]) => void;
  multiSelect?: boolean;
}

const styles = [
  'casual',
  'formal',
  'business',
  'sportswear',
  'party',
  'beachwear',
];

const StylePicker: React.FC<StylePickerProps> = ({
  selectedStyle,
  onSelectStyle,
  selectedStyles = [],
  onSelectStyles,
  multiSelect = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleSelect = (style: string) => {
    if (multiSelect && onSelectStyles) {
      if (selectedStyles.includes(style)) {
        onSelectStyles(selectedStyles.filter(s => s !== style));
      } else {
        onSelectStyles([...selectedStyles, style]);
      }
    } else if (onSelectStyle) {
      onSelectStyle(style);
    }
  };

  const isSelected = (style: string) => {
    if (multiSelect) {
      return selectedStyles.includes(style);
    }
    return selectedStyle === style;
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={customStyles.container}
    >
      {styles.map(style => (
        <TouchableOpacity
          key={style}
          style={[
            customStyles.styleItem,
            {
              backgroundColor: isSelected(style)
                ? theme.colors.secondary
                : theme.colors.card,
              borderColor: isSelected(style)
                ? theme.colors.secondary
                : theme.colors.border,
            },
          ]}
          onPress={() => handleSelect(style)}
        >
          <Text
            style={[
              customStyles.styleText,
              {
                color: isSelected(style)
                  ? theme.colors.white
                  : theme.colors.text,
              },
            ]}
          >
            {t(`styles.${style}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const customStyles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  styleItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  styleText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
});

export default StylePicker;