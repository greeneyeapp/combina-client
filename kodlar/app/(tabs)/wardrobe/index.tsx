import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { PlusCircle, Search, Filter, SlidersHorizontal } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import ClothingItem from '@/components/wardrobe/ClothingItem';
import FilterModal from '@/components/wardrobe/FilterModal';
import Input from '@/components/common/Input';
import EmptyState from '@/components/common/EmptyState';

export default function WardrobeScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    categories: string[];
    colors: string[];
    seasons: string[];
    styles: string[];
  }>({
    categories: [],
    colors: [],
    seasons: [],
    styles: [],
  });

  const { clothing } = useClothingStore();

  const filteredClothing = clothing.filter((item) => {
    // Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = 
      activeFilters.categories.length === 0 || 
      activeFilters.categories.includes(item.category);
    
    // Color filter
    const matchesColor = 
      activeFilters.colors.length === 0 || 
      activeFilters.colors.includes(item.color);
    
    // Season filter
    const matchesSeason = 
      activeFilters.seasons.length === 0 || 
      item.season.some(s => activeFilters.seasons.includes(s));
    
    // Style filter
    const matchesStyle = 
      activeFilters.styles.length === 0 || 
      activeFilters.styles.includes(item.style);
    
    return matchesSearch && matchesCategory && matchesColor && matchesSeason && matchesStyle;
  });

  const handleAddItem = () => {
    router.push('/wardrobe/add');
  };

  const handleItemPress = (id: string) => {
    router.push(`/wardrobe/${id}`);
  };

  const handleApplyFilters = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    setIsFilterModalVisible(false);
  };

  const hasActiveFilters = () => {
    return (
      activeFilters.categories.length > 0 ||
      activeFilters.colors.length > 0 ||
      activeFilters.seasons.length > 0 ||
      activeFilters.styles.length > 0
    );
  };

  const totalActiveFilters = 
    activeFilters.categories.length +
    activeFilters.colors.length +
    activeFilters.seasons.length +
    activeFilters.styles.length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('wardrobe.title')} />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Input
            placeholder={t('wardrobe.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Search color={theme.colors.textLight} size={20} />}
            containerStyle={styles.searchInput}
          />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.filterButton, 
            { backgroundColor: hasActiveFilters() ? theme.colors.primary : theme.colors.card }
          ]}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <SlidersHorizontal 
            color={hasActiveFilters() ? theme.colors.white : theme.colors.text} 
            size={20} 
          />
          {totalActiveFilters > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.accent }]}>
              <Text style={[styles.filterBadgeText, { color: theme.colors.white }]}>
                {totalActiveFilters}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {filteredClothing.length > 0 ? (
        <FlatList
          data={filteredClothing}
          renderItem={({ item }) => (
            <ClothingItem
              item={item}
              onPress={() => handleItemPress(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.columnWrapper}
        />
      ) : (
        <EmptyState
          icon="shirt"
          title={t('wardrobe.emptyTitle')}
          message={t('wardrobe.emptyMessage')}
          buttonText={t('wardrobe.addFirstItem')}
          onButtonPress={handleAddItem}
        />
      )}

      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAddItem}
      >
        <PlusCircle color={theme.colors.white} size={24} />
      </TouchableOpacity>

      <FilterModal
        isVisible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
  },
  list: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});