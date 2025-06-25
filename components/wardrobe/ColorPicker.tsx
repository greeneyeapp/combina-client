// Dosya: kodlar/components/wardrobe/ColorPicker.tsx (TAM KOD)

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SectionList, TextInput } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Check, X, Search } from 'lucide-react-native';

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  error?: string;
}

// Renkleri SectionList'e uygun şekilde grupluyoruz
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

// FlatList'in renderItem'ı için satırları 4'erli gruplayan yardımcı fonksiyon
const chunk = (arr: any[], size: number) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
    arr.slice(i * size, i * size + size)
  );

const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelectColor,
  error,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (colorName: string) => {
    onSelectColor(colorName);
    setModalVisible(false);
    setSearchQuery('');
  };
  
  // Arama filtresini SectionList verisine uygun hale getiriyoruz
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
  const selectedColorData = allColors.find(c => c.name === selectedColor);

  return (
    <>
      <TouchableOpacity
        style={[styles.buttonContainer, { borderColor: error ? theme.colors.error : theme.colors.border }]}
        onPress={() => setModalVisible(true)}
      >
        {selectedColorData ? (
          <View style={styles.selectedColorView}>
            <View style={[styles.colorCircle, { backgroundColor: selectedColorData.hex, width: 24, height: 24, borderRadius: 12 }]} />
            <Text style={[styles.selectedColorText, { color: theme.colors.text }]}>
              {t(`colors.${selectedColorData.name}`)}
            </Text>
          </View>
        ) : (
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
            {t('wardrobe.selectColorPlaceholder', 'Select a color...')}
          </Text>
        )}
      </TouchableOpacity>
      
      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
            <View onStartShouldSetResponder={() => true} style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('wardrobe.color')}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                        <X size={24} color={theme.colors.textLight} />
                    </TouchableOpacity>
                </View>

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

                {/* SectionList Kullanımı */}
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
                        // Veriyi 4'lü gruplara ayırarak render ediyoruz
                        const rows = chunk(section.data, 4);
                        // Sadece ilk item için satırları render et, diğerlerini boş geç
                        if (section.data.indexOf(item) !== 0) return null;

                        return (
                            <View>
                                {rows.map((row, rowIndex) => (
                                    <View key={rowIndex} style={styles.row}>
                                        {row.map(color => (
                                            <TouchableOpacity
                                                key={color.name}
                                                style={styles.colorItemContainer}
                                                onPress={() => handleSelect(color.name)}
                                            >
                                                <View style={[styles.colorCircle, { backgroundColor: color.hex, borderWidth: color.name === 'white' ? 1 : 0, borderColor: theme.colors.border }]}>
                                                    {selectedColor === color.name && <Check size={24} color={color.name === 'black' || color.name === 'navy' ? 'white' : 'black'} />}
                                                </View>
                                                <Text style={[styles.colorName, { color: selectedColor === color.name ? theme.colors.primary : theme.colors.textLight }]}>
                                                    {t(`colors.${color.name}`)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
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

// ... stillerin geri kalanı aynı kalabilir, sadece sectionHeader eklendi ...
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
    maxHeight: '80%',
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
    width: '25%', // 4'lü grid için
    alignItems: 'center',
    marginVertical: 8,
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