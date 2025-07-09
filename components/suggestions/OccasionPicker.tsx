// components/suggestions/OccasionPicker.tsx - OCCASION_HIERARCHY ile güncellenmiş

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList, SafeAreaView as ModalSafeArea } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ChevronDown, X } from 'lucide-react-native';
import { OCCASION_HIERARCHY } from '@/utils/constants';

interface OccasionPickerProps {
  selectedOccasion: string;
  onSelectOccasion: (occasion: string) => void;
}

const OccasionPicker: React.FC<OccasionPickerProps> = ({
  selectedOccasion,
  onSelectOccasion,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [modalVisible, setModalVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<keyof typeof OCCASION_HIERARCHY>('casual');

  const getSelectedCategory = () => {
    if (!selectedOccasion) return null;

    for (const category in OCCASION_HIERARCHY) {
      if (OCCASION_HIERARCHY[category as keyof typeof OCCASION_HIERARCHY].includes(selectedOccasion)) {
        return category;
      }
    }
    return 'casual';
  };

  const handleCategoryPress = (category: keyof typeof OCCASION_HIERARCHY) => {
    setCurrentCategory(category);
    setModalVisible(true);
  };

  const handleOccasionPress = (occasion: string) => {
    onSelectOccasion(occasion);
    setModalVisible(false);
  };

  const renderModalContent = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          <ModalSafeArea>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {t(`occasions.categories.${currentCategory}`)}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.colors.textLight} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={OCCASION_HIERARCHY[currentCategory]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.subOccasionItem, selectedOccasion === item && { backgroundColor: theme.colors.primaryLight }]}
                  onPress={() => handleOccasionPress(item)}
                >
                  <Text style={[
                    styles.subOccasionText,
                    { color: selectedOccasion === item ? theme.colors.primary : theme.colors.text }
                  ]}>
                    {t(`occasions.${item}`)}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.flatListContent}
            />
          </ModalSafeArea>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {Object.keys(OCCASION_HIERARCHY).map((category) => {
          const isSelected = getSelectedCategory() === category;
          return (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryItem,
                {
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                  borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                },
              ]}
              onPress={() => handleCategoryPress(category as keyof typeof OCCASION_HIERARCHY)}
            >
              <Text style={[styles.categoryText, { color: isSelected ? theme.colors.white : theme.colors.text }]}>
                {t(`occasions.categories.${category}`)}
              </Text>
              <ChevronDown color={isSelected ? theme.colors.white : theme.colors.textLight} size={16} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {renderModalContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContainer: {
    paddingHorizontal: 0,
    paddingRight: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
  },
  flatListContent: {
    paddingBottom: 16,
  },
  subOccasionItem: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  subOccasionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default OccasionPicker;