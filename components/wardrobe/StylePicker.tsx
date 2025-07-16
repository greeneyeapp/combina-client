import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ALL_STYLES } from '@/utils/constants';

interface StylePickerProps {
  selectedStyle?: string;
  onSelectStyle?: (style: string) => void;
  selectedStyles?: string[];
  onSelectStyles?: (styles: string[]) => void;
  multiSelect?: boolean;
}

const StylePicker: React.FC<StylePickerProps> = ({
  selectedStyle,
  onSelectStyle,
  selectedStyles = [],
  onSelectStyles,
  multiSelect = true,
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
    return multiSelect ? selectedStyles.includes(style) : selectedStyle === style;
  };

  return (
    <View style={styles.container}>
      <View style={styles.styleGrid}>
        {ALL_STYLES.map(style => (
          <TouchableOpacity
            key={style}
            style={[
              styles.styleItem,
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
                styles.styleText,
                {
                  color: isSelected(style)
                    ? theme.colors.white
                    : theme.colors.text,
                },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
            >
              {t(`styles.${style}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {multiSelect && selectedStyles.length > 0 && (
        <Text style={[styles.selectionInfo, { color: theme.colors.textLight }]}>
           {t('wardrobe.selectedCount', { count: selectedStyles.length })}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  styleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleItem: {
    flexBasis: '31%', 
    flexGrow: 1,
    minHeight: 50, 
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
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