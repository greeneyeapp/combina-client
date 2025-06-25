// Dosya: kodlar/components/suggestions/OccasionPicker.tsx (BU KODU KULLANIN)

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, FlatList, SafeAreaView as ModalSafeArea } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { ChevronDown, X } from 'lucide-react-native';

interface OccasionPickerProps {
  selectedOccasion: string;
  onSelectOccasion: (occasion: string) => void;
}

// --- YENİ, DAHA SPESİFİK VE GENİŞLETİLMİŞ KATEGORİLER ---
const occasionCategories = {
  // Günlük
  casual: [
    'errands-run', 'friends-gathering', 'weekend-brunch',
    'coffee-date', 'shopping-trip', 'park-walk'
  ],

  // Profesyonel
  work: [
    'office-day', 'business-meeting', 'business-lunch',
    'networking-event', 'university-lecture'
  ],

  // Kutlama & Davet
  formal: [
    'wedding-guest', 'evening-reception', 'cocktail-party',
    'gala-event', 'graduation-ceremony'
  ],

  // Sosyal
  social: [
    'dinner-date', 'birthday-party', 'live-concert',
    'art-gallery-visit', 'rooftop-bar', 'house-party'
  ],

  // Aktif
  active: [
    'gym-workout', 'yoga-or-pilates', 'outdoor-run',
    'hiking-trip', 'sports-activity'
  ],

  // Seyahat & Özel
  special: [
    'airport-travel', 'weekend-getaway', 'beach-vacation',
    'music-festival', 'sightseeing-tour'
  ],
};


const OccasionPicker: React.FC<OccasionPickerProps> = ({
  selectedOccasion,
  onSelectOccasion,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [modalVisible, setModalVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<keyof typeof occasionCategories>('casual');

  const getSelectedCategory = () => {
    if (!selectedOccasion) return null;

    for (const category in occasionCategories) {
      if (occasionCategories[category as keyof typeof occasionCategories].includes(selectedOccasion)) {
        return category;
      }
    }
    return 'casual';
  };

  const handleCategoryPress = (category: keyof typeof occasionCategories) => {
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
            {/* FlatList zaten kaydırma (scroll) özelliğine sahiptir */}
            <FlatList
              data={occasionCategories[currentCategory]}
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
        {Object.keys(occasionCategories).map((category) => {
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
              onPress={() => handleCategoryPress(category as keyof typeof occasionCategories)}
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
    paddingHorizontal: 16,
    paddingRight: 32,
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
    height: '75%', // Listenin rahatça sığması için yüksekliği artırdım
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
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