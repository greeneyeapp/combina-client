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
  multiSelect = true, // Varsayılan olarak true yapıldı
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
    <View style={customStyles.container}>
      <View style={customStyles.styleGrid}>
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
      </View>
      
      {multiSelect && selectedStyles.length > 0 && (
        <Text style={[customStyles.selectionInfo, { color: theme.colors.textLight }]}>
          {t('wardrobe.selectedCount', { count: selectedStyles.length })} {/* Bu çeviri eklenmeli */}
        </Text>
      )}
    </View>
  );
};

const customStyles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: '30%',
    alignItems: 'center',
  },
  styleText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
    textAlign: 'center',
  },
  selectionInfo: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default StylePicker;