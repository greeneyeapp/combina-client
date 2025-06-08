import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  ScrollView 
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import Button from '@/components/common/Button';
import CategoryPicker from './CategoryPicker';
import ColorPicker from './ColorPicker';
import SeasonPicker from './SeasonPicker';
import StylePicker from './StylePicker';

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

const FilterModal: React.FC<FilterModalProps> = ({
  isVisible,
  onClose,
  onApply,
  initialFilters,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialFilters.categories);
  const [selectedColors, setSelectedColors] = useState<string[]>(initialFilters.colors);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>(initialFilters.seasons);
  const [selectedStyles, setSelectedStyles] = useState<string[]>(initialFilters.styles);

  const handleReset = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedSeasons([]);
    setSelectedStyles([]);
  };

  const handleApply = () => {
    onApply({
      categories: selectedCategories,
      colors: selectedColors,
      seasons: selectedSeasons,
      styles: selectedStyles,
    });
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('wardrobe.filters')}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X color={theme.colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.category')}
              </Text>
              <CategoryPicker
                multiSelect
                selectedCategories={selectedCategories}
                onSelectCategories={setSelectedCategories}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.color')}
              </Text>
              <ColorPicker
                multiSelect
                selectedColors={selectedColors}
                onSelectColors={setSelectedColors}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.season')}
              </Text>
              <SeasonPicker
                selectedSeasons={selectedSeasons}
                onSelectSeason={setSelectedSeasons}
              />
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.style')}
              </Text>
              <StylePicker
                multiSelect
                selectedStyles={selectedStyles}
                onSelectStyles={setSelectedStyles}
              />
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <Button
              label={t('wardrobe.reset')}
              onPress={handleReset}
              variant="outline"
              style={styles.resetButton}
            />
            <Button
              label={t('wardrobe.apply')}
              onPress={handleApply}
              variant="primary"
              style={styles.applyButton}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    paddingHorizontal: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  resetButton: {
    flex: 1,
    marginRight: 8,
  },
  applyButton: {
    flex: 1,
    marginLeft: 8,
  },
});

export default FilterModal;