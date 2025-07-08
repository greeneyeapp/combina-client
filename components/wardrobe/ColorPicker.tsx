// Dosya: kodlar/components/wardrobe/ColorPicker.tsx (GÜNCELLENMİŞ)

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SectionList, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Check, X, Search } from 'lucide-react-native';
import { ALL_COLORS, COLOR_SECTIONS } from '@/utils/constants';

interface ColorPickerProps {
  selectedColor?: string;
  selectedColors?: string[];
  onSelectColor?: (color: string) => void;
  onSelectColors?: (colors: string[]) => void;
  multiSelect?: boolean;
  maxColors?: number;
  error?: string;
}

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

  const filteredSections = useMemo(() => {
    if (!searchQuery) return COLOR_SECTIONS;
    
    return COLOR_SECTIONS
      .map(section => ({
        ...section,
        data: section.data.filter(color =>
          t(`colors.${color.name}`).toLowerCase().includes(searchQuery.toLowerCase())
        ),
      }))
      .filter(section => section.data.length > 0);
  }, [searchQuery, t]);

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
    
    const colorData = ALL_COLORS.find(c => c.name === currentSelectedColors[0]);
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
        {currentSelectedColors.length > 1 && (
          <Text style={[styles.plusMore, {color: theme.colors.textLight}]}>
            + {currentSelectedColors.length - 1} more
          </Text>
        )}
      </View>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.buttonContainer, 
          { 
            borderColor: error ? theme.colors.error : theme.colors.border,
          }
        ]}
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
                {multiSelect ? t('wardrobe.selectColors') : t('wardrobe.color')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>

            {multiSelect && currentSelectedColors.length > 0 && (
              <View style={[styles.selectedColorsHeader, { backgroundColor: theme.colors.primaryLight }]}>
                <Text style={[styles.selectedColorsHeaderText, { color: theme.colors.primary }]}>
                  {t('wardrobe.colorSelectionInfo', { selected: currentSelectedColors.length, max: maxColors })}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.selectedColorsPreview}>
                    {currentSelectedColors.map(colorName => {
                      const colorData = ALL_COLORS.find(c => c.name === colorName);
                      if (!colorData) return null;
                      return (
                        <View key={colorName} style={[styles.previewColorCircle, { backgroundColor: colorData.hex, borderColor: colorData.name === 'white' ? theme.colors.border : 'transparent' }]} />
                      );
                    })}
                  </View>
                </ScrollView>
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
                          const isDisabled = multiSelect && !isSelected && currentSelectedColors.length >= maxColors;

                          return (
                            <TouchableOpacity
                              key={color.name}
                              style={[styles.colorItemContainer, isDisabled && styles.disabledColorItem]}
                              onPress={() => handleSelect(color.name)}
                              disabled={isDisabled}
                            >
                              <View style={[styles.colorCircle, { backgroundColor: color.hex, borderWidth: color.name === 'white' ? 1 : (isSelected ? 3 : 0), borderColor: isSelected ? theme.colors.primary : theme.colors.border }]}>
                                {isSelected && <Check size={24} color={color.name === 'black' || color.name === 'navy' ? 'white' : 'black'} />}
                              </View>
                              <Text style={[styles.colorName, { color: isSelected ? theme.colors.primary : theme.colors.textLight, opacity: isDisabled ? 0.5 : 1 }]}>
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
      minHeight: 50,
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
    plusMore: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 14,
      marginLeft: 8,
    },
    placeholderText: {
      fontFamily: 'Montserrat-Regular',
      fontSize: 16,
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
      opacity: 0.4,
    },
    colorCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorName: {
      fontFamily: 'Montserrat-Medium',
      fontSize: 12,
      marginTop: 8,
      textAlign: 'center',
    },
  });

export default ColorPicker;