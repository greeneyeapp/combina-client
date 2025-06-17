// components/wardrobe/FilterModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/common/Button';
import { X } from 'lucide-react-native';
import { CATEGORY_HIERARCHY } from '@/utils/constants';

interface FilterModalProps {
  isVisible: boolean;
  onClose: () => void;
  onApply: (filters: {
    categories: string[];
    colors: string[];
    seasons: string[];
    styles: string[];
  }) => void;
  initialFilters: {
    categories: string[];
    colors: string[];
    seasons: string[];
    styles: string[];
  };
}

const ALL_SEASONS = ['spring', 'summer', 'fall', 'winter'];

const FilterModal: React.FC<FilterModalProps> = ({
  isVisible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  // Dinamik renk ve stil anahtarları en.json'dan çekiliyor
  const ALL_COLORS = useMemo(
    () => Object.keys(t('colors', { returnObjects: true }) as Record<string, string>),
    [t]
  );
  const ALL_STYLES = useMemo(
    () => Object.keys(t('styles', { returnObjects: true }) as Record<string, string>),
    [t]
  );

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categories);
  const [selectedColors, setSelectedColors] = useState<string[]>(initialFilters.colors);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialFilters.seasons);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(initialFilters.styles);

  useEffect(() => {
    setSelectedCategories(initialFilters.categories);
    setSelectedColors(initialFilters.colors);
    setSelectedSeasons(initialFilters.seasons);
    setSelectedStyles(initialFilters.styles);
  }, [initialFilters]);

  const toggleSelection = (
    list: string[],
    item: string,
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  // Apply sonrası filtreleri uygula ve modal'ı kapat
  const handleApply = () => {
    onApply({
      categories: selectedCategories,
      colors: selectedColors,
      seasons: selectedSeasons,
      styles: selectedStyles,
    });
    onClose();
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedSeasons([]);
    setSelectedStyles([]);
    onApply({ categories: [], colors: [], seasons: [], styles: [] });
    onClose();
  };

  const renderCategoryOptions = () => (
    Object.entries(CATEGORY_HIERARCHY).map(([mainCat, subcats]) => (
      <View key={mainCat} style={styles.groupBlock}>
        <Text style={[styles.filterGroupTitle, { color: theme.colors.text }]}>
          {t(`categories.${mainCat}`)}
        </Text>
        <View style={styles.optionsGrid}>
          {subcats.map(sub => (
            <TouchableOpacity
              key={sub}
              style={[
                styles.filterOption,
                selectedCategories.includes(sub) && { backgroundColor: theme.colors.primaryLight },
              ]}
              onPress={() => toggleSelection(selectedCategories, sub, setSelectedCategories)}
            >
              <Text
                style={[
                  styles.filterOptionText,
                  { color: selectedCategories.includes(sub) ? theme.colors.primary : theme.colors.text },
                ]}
              >
                {t(`categories.${sub}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ))
  );

  const renderOptions = (
    items: string[],
    selected: string[],
    onToggle: (i: string) => void,
    translationKey: string
  ) => (
    <View style={styles.optionsGrid}>
      {items.map(item => (
        <TouchableOpacity
          key={item}
          style={[
            styles.filterOption,
            selected.includes(item) && { backgroundColor: theme.colors.primaryLight },
          ]}
          onPress={() => onToggle(item)}
        >
          <Text
            style={[
              styles.filterOptionText,
              { color: selected.includes(item) ? theme.colors.primary : theme.colors.text },
            ]}
          >
            {t(`${translationKey}.${item}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('wardrobe.filterTitle')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.filterOptionsContainer}>
            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
              {t('wardrobe.category')}
            </Text>
            {renderCategoryOptions()}

            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
              {t('wardrobe.color')}
            </Text>
            {renderOptions(
              ALL_COLORS,
              selectedColors,
              (c) => toggleSelection(selectedColors, c, setSelectedColors),
              'colors'
            )}

            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
              {t('wardrobe.season')}
            </Text>
            {renderOptions(
              ALL_SEASONS,
              selectedSeasons,
              (s) => toggleSelection(selectedSeasons, s, setSelectedSeasons),
              'seasons'
            )}

            <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>
              {t('wardrobe.style')}
            </Text>
            {renderOptions(
              ALL_STYLES,
              selectedStyles,
              (s) => toggleSelection(selectedStyles, s, setSelectedStyles),
              'styles'
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              label={t('common.reset')}
              onPress={handleClearAll}
              variant="outline"
              style={styles.footerButton}
            />
            <Button
              label={t('common.apply')}
              onPress={handleApply}
              variant="primary"
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
  },
  closeButton: { padding: 5 },
  filterOptionsContainer: { paddingBottom: 20 },
  sectionHeader: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  groupBlock: { marginBottom: 15 },
  filterGroupTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 14,
    marginBottom: 5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterOptionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  footerButton: { flex: 1, marginHorizontal: 5 },
});

export default FilterModal;
