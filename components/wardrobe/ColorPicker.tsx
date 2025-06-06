import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';

interface ColorPickerProps {
  selectedColor?: string;
  onSelectColor?: (color: string) => void;
  selectedColors?: string[];
  onSelectColors?: (colors: string[]) => void;
  multiSelect?: boolean;
}

// Genişletilmiş ve modaya uygun renk paleti
const colors = [
  // Nötr ve Temel Tonlar
  { name: 'black', hex: '#000000' },
  { name: 'white', hex: '#FFFFFF' },
  { name: 'ivory', hex: '#FFFFF0' },
  { name: 'beige', hex: '#F5F5DC' },
  { name: 'cream', hex: '#FFFDD0' },
  { name: 'charcoal', hex: '#36454F' },
  { name: 'gray', hex: '#808080' },
  { name: 'lightgray', hex: '#D3D3D3' },
  { name: 'taupe', hex: '#483C32' },
  // Kahverengi Tonları
  { name: 'brown', hex: '#8B4513' },
  { name: 'camel', hex: '#C19A6B' },
  { name: 'chocolate', hex: '#D2691E' },
  { name: 'tan', hex: '#D2B48C' },
  // Mavi Tonları
  { name: 'navy', hex: '#000080' },
  { name: 'blue', hex: '#0000FF' },
  { name: 'royalblue', hex: '#4169E1' },
  { name: 'lightblue', hex: '#ADD8E6' },
  { name: 'skyblue', hex: '#87CEEB' },
  { name: 'turquoise', hex: '#40E0D0' },
  { name: 'teal', hex: '#008080' },
  // Yeşil Tonları
  { name: 'green', hex: '#008000' },
  { name: 'olive', hex: '#808000' },
  { name: 'khaki', hex: '#C3B091' },
  { name: 'forestgreen', hex: '#228B22' },
  { name: 'mint', hex: '#98FF98' },
  { name: 'sage', hex: '#BCB88A' },
  // Kırmızı Tonları
  { name: 'red', hex: '#FF0000' },
  { name: 'burgundy', hex: '#800020' },
  { name: 'maroon', hex: '#800000' },
  { name: 'scarlet', hex: '#FF2400' },
  // Pembe ve Mor Tonları
  { name: 'purple', hex: '#800080' },
  { name: 'lavender', hex: '#E6E6FA' },
  { name: 'lilac', hex: '#C8A2C8' },
  { name: 'mauve', hex: '#E0B0FF' },
  { name: 'pink', hex: '#FFC0CB' },
  { name: 'hotpink', hex: '#FF69B4' },
  { name: 'fuchsia', hex: '#FF00FF' },
  { name: 'rose', hex: '#FF007F' },
  // Sarı ve Turuncu Tonları
  { name: 'orange', hex: '#FFA500' },
  { name: 'apricot', hex: '#FBCEB1' },
  { name: 'peach', hex: '#FFE5B4' },
  { name: 'coral', hex: '#FF7F50' },
  { name: 'yellow', hex: '#FFFF00' },
  { name: 'gold', hex: '#FFD700' },
  { name: 'mustard', hex: '#FFDB58' },
  // Metalik Tonlar
  { name: 'silver', hex: '#C0C0C0' },
  { name: 'bronze', hex: '#CD7F32' },
];


const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelectColor,
  selectedColors = [],
  onSelectColors,
  multiSelect = false,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleSelect = (colorName: string) => {
    if (multiSelect && onSelectColors) {
      const newSelection = selectedColors.includes(colorName)
        ? selectedColors.filter(c => c !== colorName)
        : [...selectedColors, colorName];
      onSelectColors(newSelection);
    } else if (onSelectColor) {
      onSelectColor(colorName);
    }
  };

  const isSelected = (colorName: string) => {
    return multiSelect
      ? selectedColors.includes(colorName)
      : selectedColor === colorName;
  };

  return (
    // Yatay kaydırma için ScrollView eklendi
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {colors.map(color => (
        <TouchableOpacity
          key={color.name}
          style={styles.colorItemContainer}
          onPress={() => handleSelect(color.name)}
        >
          <View
            style={[
              styles.colorCircle,
              {
                backgroundColor: color.hex,
                borderColor: color.name === 'white' ? theme.colors.border : 'transparent',
              },
            ]}
          >
            {/* Seçili ise içinde tik işareti göster */}
            {isSelected(color.name) && (
              <View style={styles.checkIconContainer}>
                <Check size={18} color={color.name === 'black' || color.name === 'navy' || color.name === 'charcoal' ? 'white' : 'black'} />
              </View>
            )}
          </View>
          <Text
            style={[
              styles.colorName,
              { color: isSelected(color.name) ? theme.colors.primary : theme.colors.textLight },
            ]}
            numberOfLines={1}
          >
            {t(`colors.${color.name}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  colorItemContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    width: 50, // Her bir renk için sabit genişlik
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorName: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default ColorPicker;