// components/wardrobe/FilterModal.tsx - GENDERED_CATEGORY_HIERARCHY ile güncellenmiş

import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/common/Button';
import { X, ChevronDown, ChevronUp } from 'lucide-react-native';
import { GENDERED_CATEGORY_HIERARCHY, ALL_COLORS, ALL_SEASONS, ALL_STYLES } from '@/utils/constants';

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
  gender: 'female' | 'male' | 'unisex' | undefined;
}

const FilterModal: React.FC<FilterModalProps> = ({ isVisible, onClose, onApply, initialFilters, gender }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categories);
  const [selectedColors, setSelectedColors] = useState<string[]>(initialFilters.colors);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialFilters.seasons);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(initialFilters.styles);
  
  const [expandedSection, setExpandedSection] = useState<string | null>('category');

  const categoryHierarchy = useMemo(() => {
    if (gender === 'male') {
      return GENDERED_CATEGORY_HIERARCHY.male;
    } else if (gender === 'unisex') {
      // Unisex için her iki cinsiyetin kategorilerini birleştir
      const maleCategories = GENDERED_CATEGORY_HIERARCHY.male;
      const femaleCategories = GENDERED_CATEGORY_HIERARCHY.female;
      const merged: Record<string, string[]> = {};
      
      // Önce erkek kategorilerini ekle
      Object.entries(maleCategories).forEach(([mainCat, subcats]) => {
        merged[mainCat] = [...subcats];
      });
      
      // Sonra kadın kategorilerini ekle (duplicate olmayan)
      Object.entries(femaleCategories).forEach(([mainCat, subcats]) => {
        if (merged[mainCat]) {
          // Mevcut kategoriye yeni alt kategorileri ekle (duplicate olmayan)
          subcats.forEach(subcat => {
            if (!merged[mainCat].includes(subcat)) {
              merged[mainCat].push(subcat);
            }
          });
        } else {
          // Yeni ana kategori
          merged[mainCat] = [...subcats];
        }
      });
      
      return merged;
    }
    // Default olarak female kategorilerini kullan
    return GENDERED_CATEGORY_HIERARCHY.female;
  }, [gender]);

  useEffect(() => {
    if (isVisible) {
      setSelectedCategories(initialFilters.categories);
      setSelectedColors(initialFilters.colors);
      setSelectedSeasons(initialFilters.seasons);
      setSelectedStyles(initialFilters.styles);
    }
  }, [isVisible, initialFilters]);

  const toggleSelection = (list: string[], item: string, setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

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
  };

  const CollapsibleSection = ({ title, sectionKey, children }: { title: string; sectionKey: string; children: React.ReactNode }) => {
    const isExpanded = expandedSection === sectionKey;
    return (
      <View style={styles.sectionContainer}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => setExpandedSection(isExpanded ? null : sectionKey)}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
          {isExpanded ? <ChevronUp color={theme.colors.text} /> : <ChevronDown color={theme.colors.textLight} />}
        </TouchableOpacity>
        {isExpanded && <View style={styles.sectionContent}>{children}</View>}
      </View>
    );
  };

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('wardrobe.filterTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}><X size={24} color={theme.colors.text} /></TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <CollapsibleSection title={t('wardrobe.category')} sectionKey="category">
              {Object.entries(categoryHierarchy).map(([mainCat, subcats]) => (
                <View key={mainCat} style={styles.groupBlock}>
                  <Text style={[styles.groupTitle, { color: theme.colors.textLight }]}>{t(`categories.${mainCat}`)}</Text>
                  <View style={styles.optionsGrid}>
                    {(subcats as string[]).map(sub => (
                      <TouchableOpacity
                        key={sub}
                        style={[
                          styles.filterOption, 
                          { borderColor: theme.colors.border },
                          selectedCategories.includes(sub) && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }
                        ]}
                        onPress={() => toggleSelection(selectedCategories, sub, setSelectedCategories)}
                      >
                        <Text style={[
                          styles.filterOptionText, 
                          { color: theme.colors.text },
                          selectedCategories.includes(sub) && { color: theme.colors.primary }
                        ]}>
                          {t(`categories.${sub}`)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </CollapsibleSection>

            <CollapsibleSection title={t('wardrobe.color')} sectionKey="color">
              <View style={styles.optionsGrid}>
                {ALL_COLORS.map(color => (
                  <TouchableOpacity
                    key={color.name}
                    style={[
                      styles.colorOption, 
                      { borderColor: theme.colors.border },
                      selectedColors.includes(color.name) && { borderColor: theme.colors.primary }
                    ]}
                    onPress={() => toggleSelection(selectedColors, color.name, setSelectedColors)}
                  >
                    <View style={[styles.colorSwatch, { backgroundColor: color.hex, borderColor: theme.colors.border }]} />
                    <Text style={[
                      styles.filterOptionText, 
                      { color: theme.colors.text },
                      selectedColors.includes(color.name) && { color: theme.colors.primary }
                    ]}>
                      {t(`colors.${color.name}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </CollapsibleSection>

            <CollapsibleSection title={t('wardrobe.season')} sectionKey="season">
              <View style={styles.optionsGrid}>
                {ALL_SEASONS.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.filterOption, 
                      { borderColor: theme.colors.border },
                      selectedSeasons.includes(item) && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }
                    ]}
                    onPress={() => toggleSelection(selectedSeasons, item, setSelectedSeasons)}
                  >
                    <Text style={[
                      styles.filterOptionText, 
                      { color: theme.colors.text },
                      selectedSeasons.includes(item) && { color: theme.colors.primary }
                    ]}>
                      {t(`seasons.${item}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </CollapsibleSection>
            
            <CollapsibleSection title={t('wardrobe.style')} sectionKey="style">
              <View style={styles.optionsGrid}>
                {ALL_STYLES.map(item => (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.filterOption, 
                      { borderColor: theme.colors.border },
                      selectedStyles.includes(item) && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }
                    ]}
                    onPress={() => toggleSelection(selectedStyles, item, setSelectedStyles)}
                  >
                    <Text style={[
                      styles.filterOptionText, 
                      { color: theme.colors.text },
                      selectedStyles.includes(item) && { color: theme.colors.primary }
                    ]}>
                      {t(`styles.${item}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </CollapsibleSection>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
            <Button label={t('common.reset')} onPress={handleClearAll} variant="outline" style={styles.footerButton} />
            <Button label={t('common.apply')} onPress={handleApply} variant="primary" style={styles.footerButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { height: '85%', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontFamily: 'Montserrat-Bold', fontSize: 22 },
  closeButton: { padding: 5 },
  sectionContainer: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16 },
  sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 18 },
  sectionContent: { paddingBottom: 20 },
  groupBlock: { marginBottom: 16 },
  groupTitle: { fontFamily: 'Montserrat-SemiBold', fontSize: 14, marginBottom: 12, textTransform: 'uppercase' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  filterOptionText: { fontFamily: 'Montserrat-Medium', fontSize: 14 },
  colorOption: { flexDirection: 'row', alignItems: 'center', padding: 8, paddingRight: 12, borderRadius: 20, borderWidth: 1 },
  colorSwatch: { width: 20, height: 20, borderRadius: 10, marginRight: 8, borderWidth: 1 },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, paddingVertical: 15, paddingBottom: 25 },
  footerButton: { flex: 1, marginHorizontal: 8 },
});

export default FilterModal;