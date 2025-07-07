// components/wardrobe/ColorPicker.tsx - Çoklu renk seçimi destekli

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SectionList, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Check, X, Search, Plus } from 'lucide-react-native';

interface ColorPickerProps {
  selectedColor?: string; // Tek renk seçimi için (backward compatibility)
  selectedColors?: string[]; // Çoklu renk seçimi için
  onSelectColor?: (color: string) => void; // Tek renk callback
  onSelectColors?: (colors: string[]) => void; // Çoklu renk callback
  multiSelect?: boolean; // Çoklu seçim modu
  maxColors?: number; // Maksimum seçilebilir renk sayısı
  error?: string;
}

// Renk grupları
const colorSections = [
  {
    titleKey: 'neutrals',
    data: [
      { name: 'white', hex: '#FFFFFF' }, { name: 'ivory', hex: '#FFFFF0' }, { name: 'lightgray', hex: '#D3D3D3' }, 
      { name: 'gray', hex: '#808080' }, { name: 'charcoal', hex: '#36454F' }, { name: 'black', hex: '#000000' },
    ]
  },
  {
    titleKey: 'warmTones',
    data: [
      { name: 'red', hex: '#FF0000' }, { name: 'burgundy', hex: '#800020' }, { name: 'maroon', hex: '#800000' }, 
      { name: 'scarlet', hex: '#FF2400' }, { name: 'coral', hex: '#FF7F50' }, { name: 'orange', hex: '#FFA500' }, 
      { name: 'peach', hex: '#FFE5B4' }, { name: 'rose', hex: '#FFC0CB' }, { name: 'hotpink', hex: '#FF69B4' }, 
      { name: 'fuchsia', hex: '#FF00FF' }, { name: 'yellow', hex: '#FFFF00' }, { name: 'mustard', hex: '#FFDB58' },
    ]
  },
  {
    titleKey: 'coolTones',
    data: [
      { name: 'blue', hex: '#0000FF' }, { name: 'navy', hex: '#000080' }, { name: 'royalblue', hex: '#4169E1' }, 
      { name: 'skyblue', hex: '#87CEEB' }, { name: 'turquoise', hex: '#40E0D0' }, { name: 'teal', hex: '#008080' },
      { name: 'green', hex: '#008000' }, { name: 'forestgreen', hex: '#228B22' }, { name: 'mint', hex: '#98FF98' },
      { name: 'purple', hex: '#800080' }, { name: 'lavender', hex: '#E6E6FA' }, { name: 'lilac', hex: '#C8A2C8' },
      { name: 'mauve', hex: '#E0B0FF' },
    ]
  },
  {
    titleKey: 'earthTones',
    data: [
      { name: 'beige', hex: '#F5F5DC' }, { name: 'cream', hex: '#FFFDD0' }, { name: 'tan', hex: '#D2B48C' }, 
      { name: 'camel', hex: '#C19A6B' }, { name: 'brown', hex: '#8B4513' }, { name: 'chocolate', hex: '#D2691E' }, 
      { name: 'taupe', hex: '#483C32' }, { name: 'khaki', hex: '#C3B091' }, { name: 'olive', hex: '#808000' },
      { name: 'sage', hex: '#BCB88A' }, { name: 'terracotta', hex: '#E2725B' },
    ]
  },
  {
    titleKey: 'metallics',
    data: [
      { name: 'gold', hex: '#FFD700' }, { name: 'silver', hex: '#C0C0C0' }, { name: 'bronze', hex: '#CD7F32' },
    ]
  }
];

const chunk = (arr: any[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

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

  // Aktif seçili renkler listesi
  const currentSelectedColors = multiSelect ? selectedColors : (selectedColor ? [selectedColor] : []);

  const handleSelect = (colorName: string) => {
    if (multiSelect && onSelectColors) {
      const isSelected = currentSelectedColors.includes(colorName);
      
      if (isSelected) {
        // Rengi kaldır
        const newColors = currentSelectedColors.filter(c => c !== colorName);
        onSelectColors(newColors);
      } else {
        // Rengi ekle (maksimum sayı kontrolü ile)
        if (currentSelectedColors.length < maxColors) {
          onSelectColors([...currentSelectedColors, colorName]);
        }
      }
    } else if (onSelectColor) {
      onSelectColor(colorName);
      setModalVisible(false);
      setSearchQuery('');
    }
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery) return colorSections;
    
    return colorSections
      .map(section => ({
        ...section,
        data: section.data.filter(color =>
          t(`colors.${color.name}`).toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(section => section.data.length > 0);
  }, [searchQuery, t]);

  const allColors = colorSections.flatMap(s => s.data);

  const renderSelectedColorsDisplay = () => {
    if (currentSelectedColors.length === 0) {
      return (
        <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
          {multiSelect 
            ? t('wardrobe.selectColorsPlaceholder', 'Select colors...')
            : t('wardrobe.selectColorPlaceholder', 'Select a color...')
          }
        </Text>
      );
    }

    if (multiSelect) {
      return (
        <View style={styles.multiColorDisplay}>
          {currentSelectedColors.map((colorName, index) => {
            const colorData = allColors.find(c => c.name === colorName);
            if (!colorData) return null;
            
            return (
              <View key={colorName} style={styles.selectedColorChip}>
                <View 
                  style={[
                    styles.colorChipCircle, 
                    { 
                      backgroundColor: colorData.hex,
                      borderColor: colorData.name === 'white' ? theme.colors.border : 'transparent'
                    }
                  ]} 
                />
                <Text style={[styles.colorChipText, { color: theme.colors.text }]}>
                  {t(`colors.${colorName}`)}
                </Text>
                {index < maxColors - 1 && index < currentSelectedColors.length - 1 && (
                  <Text style={[styles.colorSeparator, { color: theme.colors.textLight }]}>+</Text>
                )}
              </View>
            );
          })}
          
          {currentSelectedColors.length < maxColors && (
            <View style={[styles.addMoreChip, { borderColor: theme.colors.primary }]}>
              <Plus size={16} color={theme.colors.primary} />
              <Text style={[styles.addMoreText, { color: theme.colors.primary }]}>
                {t('wardrobe.addMoreColors', 'Add more')}
              </Text>
            </View>
          )}
        </View>
      );
    } else {
      // Tek renk seçimi için mevcut görünüm
      const colorData = allColors.find(c => c.name === selectedColor);
      if (!colorData) return null;

      return (
        <View style={styles.selectedColorView}>
          <View style={[
            styles.colorCircle, 
            { 
              backgroundColor: colorData.hex, 
              width: 24, 
              height: 24, 
              borderRadius: 12,
              borderColor: colorData.name === 'white' ? theme.colors.border : 'transparent',
              borderWidth: colorData.name === 'white' ? 1 : 0
            }
          ]} />
          <Text style={[styles.selectedColorText, { color: theme.colors.text }]}>
            {t(`colors.${colorData.name}`)}
          </Text>
        </View>
      );
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.buttonContainer, 
          { 
            borderColor: error ? theme.colors.error : theme.colors.border,
            minHeight: multiSelect ? 60 : 50 // Çoklu seçim için daha yüksek
          }
        ]}
        onPress={() => setModalVisible(true)}
      >
        {renderSelectedColorsDisplay()}
      </TouchableOpacity>

      {/* Çoklu seçim durumunda limit bilgisi */}
      {multiSelect && (
        <View style={styles.infoContainer}>
          <Text style={[styles.infoText, { color: theme.colors.textLight }]}>
            {t('wardrobe.colorSelectionInfo', {
              selected: currentSelectedColors.length,
              max: maxColors
            }, `${currentSelectedColors.length}/${maxColors} colors selected`)}
          </Text>
          {currentSelectedColors.length === maxColors && (
            <Text style={[styles.limitText, { color: theme.colors.warning }]}>
              {t('wardrobe.colorLimitReached', 'Maximum colors reached')}
            </Text>
          )}
        </View>
      )}
      
      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPressOut={() => setModalVisible(false)}
        >
          <View 
            onStartShouldSetResponder={() => true} 
            style={[styles.modalContent, { backgroundColor: theme.colors.background }]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {multiSelect 
                  ? t('wardrobe.selectColors', 'Select Colors')
                  : t('wardrobe.color')
                }
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>

            {/* Çoklu seçim durumunda seçili renkler göstergesi */}
            {multiSelect && currentSelectedColors.length > 0 && (
              <View style={[styles.selectedColorsHeader, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.selectedColorsHeaderText, { color: theme.colors.primary }]}>
                  {t('wardrobe.selectedColors', 'Selected Colors')}: {currentSelectedColors.length}/{maxColors}
                </Text>
                <View style={styles.selectedColorsPreview}>
                  {currentSelectedColors.map(colorName => {
                    const colorData = allColors.find(c => c.name === colorName);
                    if (!colorData) return null;
                    return (
                      <View 
                        key={colorName}
                        style={[
                          styles.previewColorCircle, 
                          { 
                            backgroundColor: colorData.hex,
                            borderColor: colorData.name === 'white' ? theme.colors.border : 'transparent',
                            borderWidth: colorData.name === 'white' ? 1 : 0
                          }
                        ]} 
                      />
                    );
                  })}
                </View>
              </View>
            )}

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

            <SectionList
              sections={filteredSections}
              keyExtractor={(item, index) => item.name + index}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section: { titleKey } }) => (
                <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
                  {t(`colorGroups.${titleKey}`)}
                </Text>
              )}
              renderItem={({ item, section }) => {
                const rows = chunk(section.data, 4);
                if (section.data.indexOf(item) !== 0) return null;

                return (
                  <View>
                    {rows.map((row, rowIndex) => (
                      <View key={rowIndex} style={styles.row}>
                        {row.map(color => {
                          const isSelected = currentSelectedColors.includes(color.name);
                          const canSelect = !isSelected && (multiSelect ? currentSelectedColors.length < maxColors : true);
                          const isDisabled = multiSelect && !isSelected && currentSelectedColors.length >= maxColors;

                          return (
                            <TouchableOpacity
                              key={color.name}
                              style={[
                                styles.colorItemContainer,
                                isDisabled && styles.disabledColorItem
                              ]}
                              onPress={() => canSelect || isSelected ? handleSelect(color.name) : null}
                              disabled={isDisabled}
                            >
                              <View style={[
                                styles.colorCircle, 
                                { 
                                  backgroundColor: color.hex,
                                  borderWidth: color.name === 'white' ? 1 : (isSelected ? 3 : 0),
                                  borderColor: color.name === 'white' ? theme.colors.border : (isSelected ? theme.colors.primary : 'transparent')
                                }
                              ]}>
                                {isSelected && (
                                  <Check 
                                    size={24} 
                                    color={color.name === 'black' || color.name === 'navy' ? 'white' : 'black'} 
                                  />
                                )}
                                {isDisabled && (
                                  <View style={styles.disabledOverlay} />
                                )}
                              </View>
                              <Text style={[
                                styles.colorName, 
                                { 
                                  color: isSelected ? theme.colors.primary : theme.colors.textLight,
                                  opacity: isDisabled ? 0.5 : 1
                                }
                              ]}>
                                {t(`colors.${color.name}`)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                );
              }}
            />

            {/* Çoklu seçim durumunda done butonu */}
            {multiSelect && (
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.doneButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.doneButtonText}>
                    {t('common.done')} ({currentSelectedColors.length})
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  selectedColorView: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedColorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    marginLeft: 12,
  },
  multiColorDisplay: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  selectedColorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  colorChipCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
  },
  colorChipText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
  colorSeparator: {
    marginHorizontal: 4,
    fontSize: 12,
  },
  addMoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  addMoreText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
  placeholderText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  },
  limitText: {
    fontSize: 11,
    fontFamily: 'Montserrat-Medium',
    marginTop: 2,
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
  },
  selectedColorsHeader: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedColorsHeaderText: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
  },
  selectedColorsPreview: {
    flexDirection: 'row',
    gap: 6,
  },
  previewColorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
  },
  sectionHeader: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  colorItemContainer: {
    width: '25%',
    alignItems: 'center',
    marginVertical: 8,
  },
  disabledColorItem: {
    opacity: 0.5,
  },
  colorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 24,
  },
  colorName: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  modalFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 16,
  },
  doneButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
});

export default ColorPicker;