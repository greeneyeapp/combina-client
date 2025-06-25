import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore, ClothingItem as TClothingItem } from '@/store/clothingStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { PlusCircle, Search, SlidersHorizontal } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import FilterModal from '@/components/wardrobe/FilterModal';
import Input from '@/components/common/Input';
import EmptyState from '@/components/common/EmptyState';
import ClothingItem from '@/components/wardrobe/ClothingItem';
import { GENDERED_CATEGORY_HIERARCHY } from '@/utils/constants';
import { useWardrobeLimit } from '@/hooks/useWardrobeLimit';

interface SectionData {
  title: string;
  data: TClothingItem[][];
  id: string;
}

const { width } = Dimensions.get('window');
const gridSpacing = 8;
const gridColumns = 3;
const sidePadding = 16;
const gridItemWidth = (width - sidePadding * 2 - gridSpacing * (gridColumns - 1)) / gridColumns;

export default function WardrobeScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const router = useRouter();
  const { userPlan: storedUserPlan } = useUserPlanStore();
  const { limitInfo, isLoading: isLimitLoading } = useWardrobeLimit();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    categories: string[];
    colors: string[];
    seasons: string[];
    styles: string[];
  }>({ categories: [], colors: [], seasons: [], styles: [] });

  const { clothing } = useClothingStore();
  
  const getUsageColor = () => {
    if (!limitInfo) return theme.colors.textLight;
    if (limitInfo.limit === Infinity) return theme.colors.success;
    const percentage = limitInfo.percentage;
    if (percentage > 90) return theme.colors.error;
    if (percentage > 75) return theme.colors.warning;
    return theme.colors.success;
  };
  
  function chunkArray<T>(array: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  const filteredClothing = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clothing
      .filter(item => {
        const name = item.name.toLowerCase();
        const cat = t(`categories.${item.category}`).toLowerCase();
        const col = t(`colors.${item.color}`).toLowerCase();
        const seasons = item.season.map(s => t(`seasons.${s}`)).join(' ').toLowerCase();
        const style = item.style.split(',').map(s => t(`styles.${s}`)).join(' ').toLowerCase();
        const notes = item.notes?.toLowerCase() || '';

        const matchesSearch = !q || name.includes(q) || cat.includes(q) || col.includes(q) || seasons.includes(q) || style.includes(q) || notes.includes(q);
        const matchesCategory = activeFilters.categories.length === 0 || activeFilters.categories.includes(item.category);
        const matchesColor = activeFilters.colors.length === 0 || activeFilters.colors.includes(item.color);
        const matchesSeason = activeFilters.seasons.length === 0 || item.season.some(s => activeFilters.seasons.includes(s));
        const matchesStyle = activeFilters.styles.length === 0 || item.style.split(',').some(s => activeFilters.styles.includes(s));

        return matchesSearch && matchesCategory && matchesColor && matchesSeason && matchesStyle;
      })
      .reverse();
  }, [clothing, searchQuery, activeFilters, t]);

  const sections = useMemo<SectionData[]>(() => {
    const grouped: { [key: string]: TClothingItem[] } = {};
    const gender = storedUserPlan?.gender || 'female';
    const hierarchy = gender === 'male' ? GENDERED_CATEGORY_HIERARCHY.male : GENDERED_CATEGORY_HIERARCHY.female;

    filteredClothing.forEach(item => {
      let mainCategory = '';
      for (const [mainCat, subCats] of Object.entries(hierarchy)) {
        if ((subCats as string[]).includes(item.category)) {
          mainCategory = mainCat;
          break;
        }
      }
      if (mainCategory) {
        if (!grouped[mainCategory]) grouped[mainCategory] = [];
        grouped[mainCategory].push(item);
      }
    });

    return Object.keys(grouped).map(mainCat => ({
      title: t(`categories.${mainCat}`).toUpperCase(),
      data: chunkArray(grouped[mainCat], 3),
      id: mainCat,
    }));
  }, [filteredClothing, t, storedUserPlan?.gender]);


  const handleAddItem = () => router.push('/wardrobe/add');
  const handleItemPress = (id: string) => router.push(`/wardrobe/${id}`);
  const handleEditPress = (id: string) => router.push(`/wardrobe/edit/${id}`);
  const handleApplyFilters = (filters: typeof activeFilters) => {
    setActiveFilters(filters);
    setIsFilterModalVisible(false);
  };

  const hasActiveFilters = () => activeFilters.categories.length > 0 || activeFilters.colors.length > 0 || activeFilters.seasons.length > 0 || activeFilters.styles.length > 0;
  const totalActiveFilters = activeFilters.categories.length + activeFilters.colors.length + activeFilters.seasons.length + activeFilters.styles.length;

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={[styles.categoryHeaderContainer, { borderBottomColor: theme.colors.border }]}>
      <Text style={[styles.categoryHeaderText, { color: theme.colors.text }]}>{title}</Text>
    </View>
  );

  const renderItem = ({ item: row }: { item: TClothingItem[] }) => (
    <View style={styles.row}>
      {row.map((clothingItem, idx) => (
        <View style={[styles.itemWrapper, idx === gridColumns - 1 && styles.lastItemWrapper]} key={clothingItem.id}>
          <ClothingItem item={clothingItem} onPress={() => handleItemPress(clothingItem.id)} onEdit={() => handleEditPress(clothingItem.id)} />
        </View>
      ))}
      {Array.from({ length: gridColumns - row.length }).map((_, idx) => (
        <View style={[styles.itemWrapper, styles.lastItemWrapper]} key={`empty-${idx}`} />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('wardrobe.title')} />
      
      <View style={styles.usageContainer}>
        {isLimitLoading ? (
          <ActivityIndicator size="small" color={theme.colors.textLight} />
        ) : (
          limitInfo && 
          <TouchableOpacity onPress={() => router.push('/profile/subscription' as any)}>
            <Text style={[styles.usageText, { color: getUsageColor() }]}>
              {t('wardrobe.limit')}: {limitInfo.currentCount} / {limitInfo.limit === Infinity ? '∞' : limitInfo.limit}
              {limitInfo.plan !== 'premium' && <Text> ✨</Text>}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.searchContainer}>
        <Input
          placeholder={t('wardrobe.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search color={theme.colors.textLight} size={20} />}
          containerStyle={styles.searchInput}
        />
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: hasActiveFilters() ? theme.colors.primary : theme.colors.card }]}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <SlidersHorizontal color={hasActiveFilters() ? theme.colors.white : theme.colors.text} size={20} />
          {totalActiveFilters > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: theme.colors.accent }]}>
              <Text style={styles.filterBadgeText}>{totalActiveFilters}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(row, idx) => row.map(i => i.id).join('-') + '-' + idx}
          renderSectionHeader={renderSectionHeader}
          renderItem={renderItem}
          stickySectionHeadersEnabled={false}
        />
      ) : (
        <EmptyState
          icon="shirt"
          title={!searchQuery && !hasActiveFilters() ? t('wardrobe.emptyTitle') : t('wardrobe.noResultsTitle')}
          message={!searchQuery && !hasActiveFilters() ? t('wardrobe.emptyMessage') : t('wardrobe.noResultsMessage')}
          buttonText={!searchQuery && !hasActiveFilters() ? t('wardrobe.addFirstItem') : undefined}
          onButtonPress={!searchQuery && !hasActiveFilters() ? handleAddItem : undefined}
        />
      )}

      {!isLimitLoading && !limitInfo?.isLimitReached && (
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddItem}
        >
          <PlusCircle color={theme.colors.white} size={28} />
        </TouchableOpacity>
      )}

      <FilterModal
        isVisible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
        gender={storedUserPlan?.gender as 'female' | 'male' | undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  usageContainer: { alignItems: 'center', paddingBottom: 8, paddingTop: 0, minHeight: 21 },
  usageText: { fontFamily: 'Montserrat-Bold', fontSize: 14 },
  searchContainer: { flexDirection: 'row', padding: 16, paddingTop: 0, alignItems: 'center' },
  searchInput: { flex: 1, marginBottom: 0 },
  filterButton: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  filterBadge: { position: 'absolute', top: 6, right: 6, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  filterBadgeText: { fontFamily: 'Montserrat-Bold', fontSize: 10, color: 'white' },
  row: { flexDirection: 'row', marginBottom: gridSpacing, marginHorizontal: gridSpacing },
  itemWrapper: { width: gridItemWidth, marginRight: gridSpacing },
  lastItemWrapper: { marginRight: 0 },
  addButton: { position: 'absolute', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  categoryHeaderContainer: { paddingVertical: 10, paddingHorizontal: 16, marginTop: 15, marginBottom: 5 },
  categoryHeaderText: { fontFamily: 'Montserrat-Bold', fontSize: 16 },
});
