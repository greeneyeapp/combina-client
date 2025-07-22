// components/common/SelectionDropdown.tsx - iPad için büyütülmüş ve orantılı tasarım

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
  Dimensions, // YENİ: Dimensions modülü eklendi
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ChevronDown, X, Search } from 'lucide-react-native';

// YENİ: iPad tespiti
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface DropdownOption {
  label: string;
  value: string;
  isGroupHeader?: boolean;
}

interface SelectionDropdownProps {
  label: string;
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string;
  searchable?: boolean;
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
    const lowercasedSearchText = searchText.toLowerCase();
    if (!searchText.trim()) {
        setFilteredOptions(options); // Arama boşsa tüm seçenekleri göster
        return;
    }

    const newFilteredOptions = options.filter(
      (option) =>
        !option.isGroupHeader && option.label.toLowerCase().includes(lowercasedSearchText)
    );

    const finalOptions: DropdownOption[] = [];
    let lastGroupHeader: DropdownOption | null = null;
    let addedHeaders = new Set<string>();

    options.forEach(option => {
      if (option.isGroupHeader) {
        lastGroupHeader = option;
      } else if (newFilteredOptions.some(f => f.value === option.value)) {
        if (lastGroupHeader && !addedHeaders.has(lastGroupHeader.value)) {
          finalOptions.push(lastGroupHeader);
          addedHeaders.add(lastGroupHeader.value);
        }
        finalOptions.push(option);
      }
    });

    setFilteredOptions(finalOptions);
  }, [searchText, options]);

  const handleSelectOption = (value: string) => {
    onSelect(value);
    setModalVisible(false);
    setSearchText('');
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
        style={[styles.optionItem, isSelected && { backgroundColor: theme.colors.primaryLight }]}
        onPress={() => handleSelectOption(item.value)}
      >
        <Text
          style={[
            styles.optionText,
            { color: theme.colors.text },
            isSelected && { color: theme.colors.primary, fontFamily: 'Montserrat-Bold' },
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
        <ChevronDown size={isTablet ? 24 : 20} color={theme.colors.textLight} />
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
                <X size={isTablet ? 30 : 24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
                <Search size={isTablet ? 22 : 18} color={theme.colors.textLight} style={styles.searchIcon} />
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
              keyExtractor={(item, index) => item.value + index}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.optionsListContent}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
const styles = StyleSheet.create({
  container: {
    // marginBottom: 16, // Bu component artık kart içinde olduğu için dış boşluğa gerek yok
  },
  label: {
    fontFamily: 'Montserrat-Bold',
    fontSize: isTablet ? 18 : 16, // Büyütüldü
    marginBottom: 12, // Boşluk artırıldı
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12, // Daha yuvarlak
    padding: isTablet ? 16 : 12, // İç boşluk artırıldı
    minHeight: isTablet ? 60 : 50,
  },
  dropdownButtonText: {
    fontSize: isTablet ? 18 : 16, // Büyütüldü
    fontFamily: 'Montserrat-Regular',
    flex: 1,
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 14 : 12, // Büyütüldü
    marginTop: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    height: isTablet ? '70%' : '80%', // Tablette yüksekliği biraz azalttık
    borderTopLeftRadius: 24, // Daha yuvarlak
    borderTopRightRadius: 24,
    padding: isTablet ? 32 : 20, // İç boşluk artırıldı
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24, // Boşluk artırıldı
  },
  modalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: isTablet ? 24 : 20, // Büyütüldü
  },
  closeButton: {
    padding: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: isTablet ? 20 : 15,
    marginBottom: 20,
    minHeight: isTablet ? 60 : 50, // Büyütüldü
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 18 : 16, // Büyütüldü
  },
  optionsListContent: {
    paddingBottom: 32,
  },
  groupHeaderContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  groupHeaderText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: isTablet ? 18 : 16, // Büyütüldü
  },
  optionItem: {
    paddingVertical: isTablet ? 20 : 15, // Dikey boşluk artırıldı
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  optionText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 18 : 16, // Büyütüldü
  },
});

export default SelectionDropdown;