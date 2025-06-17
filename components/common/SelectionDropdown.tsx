import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ChevronDown, X, Search } from 'lucide-react-native';

interface DropdownOption {
  label: string; // Görüntülenecek metin (örn: "T-Shirts")
  value: string; // Gerçek değer (örn: "t-shirt")
  isGroupHeader?: boolean; // Eğer bu bir grup başlığıysa (örn: "Tops")
}

interface SelectionDropdownProps {
  label: string; // Seçicinin üstündeki etiket (örn: "Category")
  options: DropdownOption[]; // Dropdown'daki tüm seçenekler
  selectedValue: string; // Halihazırda seçili olan değer
  onSelect: (value: string) => void; // Bir öğe seçildiğinde çağrılacak fonksiyon
  placeholder?: string; // Seçili değer yokken görüntülenecek metin
  error?: string; // Hata mesajı
  searchable?: boolean; // Arama çubuğu olup olmayacağı
}

const SelectionDropdown: React.FC<SelectionDropdownProps> = ({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder,
  error,
  searchable = false,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<DropdownOption[]>(options);

  useEffect(() => {
    // Arama metni veya seçenekler değiştiğinde filtrele
    const lowercasedSearchText = searchText.toLowerCase();
    const newFilteredOptions = options.filter(
      (option) =>
        !option.isGroupHeader && option.label.toLowerCase().includes(lowercasedSearchText)
    );

    // Grup başlıklarını da ekleyelim, eğer altlarında filtrelenmiş bir öğe varsa
    const finalOptions: DropdownOption[] = [];
    let lastGroupHeader: DropdownOption | null = null;

    options.forEach(option => {
      if (option.isGroupHeader) {
        lastGroupHeader = option;
      } else if (newFilteredOptions.some(f => f.value === option.value)) {
        if (lastGroupHeader && !finalOptions.includes(lastGroupHeader)) {
          finalOptions.push(lastGroupHeader);
        }
        finalOptions.push(option);
      }
    });

    setFilteredOptions(finalOptions);
  }, [searchText, options]);

  const handleSelectOption = (value: string) => {
    onSelect(value);
    setModalVisible(false);
    setSearchText(''); // Modal kapanınca aramayı sıfırla
  };

  const renderOption = ({ item }: { item: DropdownOption }) => {
    if (item.isGroupHeader) {
      return (
        <View style={[styles.groupHeaderContainer, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.groupHeaderText, { color: theme.colors.text }]}>
            {item.label}
          </Text>
        </View>
      );
    }
    const isSelected = selectedValue === item.value;
    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && { backgroundColor: theme.colors.primaryLight },
        ]}
        onPress={() => handleSelectOption(item.value)}
      >
        <Text
          style={[
            styles.optionText,
            isSelected && { color: theme.colors.primary, fontFamily: 'Montserrat-Bold' },
            { color: theme.colors.text },
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const currentSelectionLabel = options.find((opt) => opt.value === selectedValue)?.label || placeholder || t('common.select');

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          {
            backgroundColor: theme.colors.card,
            borderColor: error ? theme.colors.error : theme.colors.border,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.dropdownButtonText,
            { color: selectedValue ? theme.colors.text : theme.colors.textLight },
          ]}
        >
          {currentSelectionLabel}
        </Text>
        <ChevronDown size={20} color={theme.colors.textLight} />
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{label || t('common.select')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <X size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
                <Search size={18} color={theme.colors.textLight} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.colors.text }]}
                  placeholder={t('common.searchPlaceholder')}
                  placeholderTextColor={theme.colors.textLight}
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            )}

            <FlatList
              data={filteredOptions}
              renderItem={renderOption}
              keyExtractor={(item, index) => item.value + index} // Grup başlıkları için benzersiz anahtar
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.optionsListContent}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 50,
  },
  dropdownButtonText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
    flex: 1,
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: '80%', // Modal yüksekliği
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
  closeButton: {
    padding: 5,
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
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
  },
  optionsListContent: {
    paddingBottom: 20, // Liste sonuna boşluk bırakır
  },
  groupHeaderContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 5,
    marginTop: 15,
  },
  groupHeaderText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
  },
  optionItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  optionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
});

export default SelectionDropdown;