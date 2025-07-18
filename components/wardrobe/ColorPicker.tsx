// components/wardrobe/ColorPicker.tsx - Modal yükseklik sorunu düzeltildi

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, TextInput, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Check, X, Search } from 'lucide-react-native';
import { ALL_COLORS } from '@/utils/constants';

// Renk parlaklığını hesaplayarak, üzerine konulacak ikonun rengini belirler (siyah/beyaz).
const getBrightness = (hex: string): number => {
  if (!hex.startsWith('#')) return 129; // Desenler için açık renkli (siyah) check ikonu
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

interface ColorPickerProps {
  selectedColor?: string;
  selectedColors?: string[];
  onSelectColor?: (color: string) => void;
  onSelectColors?: (colors: string[]) => void;
  multiSelect?: boolean;
  maxColors?: number;
  error?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  selectedColors = [],
  onSelectColor,
  onSelectColors,
  multiSelect = false,
  maxColors = 3,
  error,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentSelectedColors = multiSelect ? selectedColors : (selectedColor ? [selectedColor] : []);

  const handleSelect = (colorName: string) => {
    if (multiSelect && onSelectColors) {
      const isSelected = currentSelectedColors.includes(colorName);
      if (isSelected) {
        onSelectColors(currentSelectedColors.filter(c => c !== colorName));
      } else if (currentSelectedColors.length < maxColors) {
        onSelectColors([...currentSelectedColors, colorName]);
      }
    } else if (onSelectColor) {
      onSelectColor(colorName);
      setModalVisible(false);
      setSearchQuery('');
    }
  };

  const filteredColors = useMemo(() => {
    if (!searchQuery) return ALL_COLORS;
    return ALL_COLORS.filter(color =>
      t(`colors.${color.name}`, color.name).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, t]);

  const renderColorItemDisplay = (color: { name: string; hex: string; }) => {
    switch (color.hex) {
      case 'pattern_leopard':
        return <Image source={require('@/assets/patterns/leopard.webp')} style={styles.patternImage} />;
      case 'pattern_zebra':
        return <Image source={require('@/assets/patterns/zebra.webp')} style={styles.patternImage} />;
      case 'pattern_snakeskin':
        return <Image source={require('@/assets/patterns/snake.webp')} style={styles.patternImage} />;
      case 'pattern_striped':
        return <Image source={require('@/assets/patterns/cizgili.webp')} style={styles.patternImage} />;
      case 'pattern_plaid':
        return <Image source={require('@/assets/patterns/ekose.webp')} style={styles.patternImage} />;
      case 'pattern_floral':
        return <Image source={require('@/assets/patterns/flowers.webp')} style={styles.patternImage} />;
      case 'pattern_polka_dot':
        return <Image source={require('@/assets/patterns/puantiye.webp')} style={styles.patternImage} />;
      default:
        return <View style={{ backgroundColor: color.hex, width: '100%', height: '100%' }} />;
    }
  };

  const renderSelectedColorsDisplay = () => {
    if (currentSelectedColors.length === 0) {
      return (
        <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
          {multiSelect ? t('wardrobe.selectColorsPlaceholder') : t('wardrobe.selectColorPlaceholder')}
        </Text>
      );
    }

    const colorData = ALL_COLORS.find(c => c.name === currentSelectedColors[0]);
    if (!colorData) return null;

    return (
      <View style={styles.selectedColorView}>
        <View style={[styles.colorCircleWrapper, { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: colorData.name === 'white' ? theme.colors.border : 'transparent' }]}>
          {renderColorItemDisplay(colorData)}
        </View>
        <Text style={[styles.selectedColorText, { color: theme.colors.text }]}>
          {t(`colors.${colorData.name}`)}
        </Text>
        {currentSelectedColors.length > 1 && (
          <Text style={[styles.plusMore, { color: theme.colors.textLight }]}>
            + {currentSelectedColors.length - 1} {t('wardrobe.moreColors')}
          </Text>
        )}
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.buttonContainer, { borderColor: error ? theme.colors.error : theme.colors.border }]}
        onPress={() => setModalVisible(true)}
      >
        {renderSelectedColorsDisplay()}
      </TouchableOpacity>

      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Header - sabit yükseklik */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {multiSelect ? t('wardrobe.selectColors') : t('wardrobe.color')}
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>

            {/* Search Bar - sabit yükseklik */}
            <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
              <Search size={18} color={theme.colors.textLight} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder={t('common.searchPlaceholder')}
                placeholderTextColor={theme.colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* MultiSelect info - sabit yükseklik (varsa) */}
            {multiSelect && (
              <View style={[styles.selectedColorsHeader, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.selectedColorsHeaderText, { color: theme.colors.primary }]}>
                  {t('wardrobe.colorSelectionInfo', { selected: currentSelectedColors.length, max: maxColors })}
                </Text>
              </View>
            )}

            {/* Colors List - flex:1 olarak kalanı kaplayacak */}
            <View style={styles.flatListContainer}>
              <FlatList
                data={filteredColors}
                keyExtractor={(item) => item.name}
                numColumns={4}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={true}
                bounces={true}
                scrollEnabled={true}
                nestedScrollEnabled={true}
                renderItem={({ item: color }) => {
                  const isSelected = currentSelectedColors.includes(color.name);
                  const isDisabled = multiSelect && !isSelected && currentSelectedColors.length >= maxColors;
                  return (
                    <TouchableOpacity
                      style={[styles.colorItemContainer, isDisabled && styles.disabledColorItem]}
                      onPress={() => handleSelect(color.name)}
                      disabled={isDisabled}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.colorCircleWrapper, { borderColor: isSelected ? theme.colors.primary : 'transparent' }]}>
                        {renderColorItemDisplay(color)}
                        {isSelected && (
                          <View style={styles.checkIconContainer}>
                            <Check size={24} color={getBrightness(color.hex) > 128 ? 'black' : 'white'} />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.colorName, { color: isSelected ? theme.colors.primary : theme.colors.textLight, opacity: isDisabled ? 0.5 : 1 }]} numberOfLines={1}>
                        {t(`colors.${color.name}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
            
            {/* Footer - sabit yükseklik (varsa) */}
            {multiSelect && (
              <View style={[styles.modalFooter, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.border }]}>
                <TouchableOpacity 
                  style={[styles.doneButton, { backgroundColor: theme.colors.primary }]} 
                  onPress={() => {
                    setModalVisible(false);
                    setSearchQuery('');
                  }}
                >
                  <Text style={[styles.doneButtonText, { color: theme.colors.white }]}>
                    {t('common.save')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: { 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 12, 
    minHeight: 50, 
    justifyContent: 'center' 
  },
  selectedColorView: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  selectedColorText: { 
    fontFamily: 'Montserrat-Regular', 
    fontSize: 16, 
    marginLeft: 12 
  },
  plusMore: { 
    fontFamily: 'Montserrat-Regular', 
    fontSize: 14, 
    marginLeft: 8 
  },
  placeholderText: { 
    fontFamily: 'Montserrat-Regular', 
    fontSize: 16 
  },
  errorText: { 
    fontFamily: 'Montserrat-Regular', 
    fontSize: 12, 
    marginTop: 4 
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: {
    // Ana değişiklik: Sabit yükseklik yerine maksimum yükseklik kullan
    maxHeight: '85%',
    minHeight: '75%', 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    flex: 0, // flex: 1'den flex: 0'a değiştirildi
  },
  modalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingBottom: 16,
    // Sabit yükseklik belirtildi
    height: 60,
  },
  modalTitle: { 
    fontFamily: 'Montserrat-Bold', 
    fontSize: 18 
  },
  closeButton: {
    // Kapat butonunun tıklanabilir alanını artır
    padding: 8,
    borderRadius: 8,
  },
  selectedColorsHeader: { 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 16,
    // Sabit yükseklik
    minHeight: 40,
  },
  selectedColorsHeaderText: { 
    fontSize: 14, 
    fontFamily: 'Montserrat-SemiBold' 
  },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 10, 
    paddingHorizontal: 15, 
    marginBottom: 15, 
    minHeight: 50, // Sabit yükseklik
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 10, 
    fontFamily: 'Montserrat-Regular', 
    fontSize: 16 
  },
  flatListContainer: {
    // Ana değişiklik: flex: 1 ile kalan alanı kullan
    flex: 1,
    minHeight: 200, // Minimum yükseklik garantisi
  },
  listContainer: { 
    paddingBottom: 20,
    flexGrow: 1,
  },
  colorItemContainer: { 
    flex: 1, 
    alignItems: 'center', 
    marginVertical: 8,
    maxWidth: '25%',
  },
  disabledColorItem: { 
    opacity: 0.4 
  },
  colorCircleWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    overflow: 'hidden',
  },
  patternImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  checkIconContainer: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.2)' 
  },
  colorName: { 
    fontFamily: 'Montserrat-Medium', 
    fontSize: 12, 
    marginTop: 8, 
    textAlign: 'center' 
  },
  modalFooter: { 
    borderTopWidth: 1, 
    paddingTop: 16, 
    paddingBottom: 16, 
    paddingHorizontal: 0,
    // Sabit yükseklik
    minHeight: 70,
  },
  doneButton: { 
    paddingVertical: 14, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  doneButtonText: { 
    fontFamily: 'Montserrat-Bold', 
    fontSize: 16 
  },
});

export default ColorPicker;