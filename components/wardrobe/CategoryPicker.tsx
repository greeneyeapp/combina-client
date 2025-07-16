// components/wardrobe/CategoryPicker.tsx - DEBUG VERSİYONU

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text } from 'react-native';
import SelectionDropdown from '@/components/common/SelectionDropdown';
import { GENDERED_CATEGORY_HIERARCHY } from '@/utils/constants';

interface CategoryPickerProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  gender: 'female' | 'male' | 'unisex' | undefined;
  error?: string;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ selectedCategory, onSelectCategory, gender, error }) => {
  const { t } = useTranslation();

  // Cinsiyete göre doğru kategori hiyerarşisini seçer.
  const categoryHierarchy = useMemo(() => {
    
    if (gender === 'male') {
      return GENDERED_CATEGORY_HIERARCHY.male;
    } else if (gender === 'unisex') {
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
    return GENDERED_CATEGORY_HIERARCHY.female;
  }, [gender]);

  // Seçilen hiyerarşiye göre açılır menü seçeneklerini oluşturur.
  const categoryOptions = useMemo(() => {
    const options: { label: string; value: string; isGroupHeader?: boolean }[] = [];
    
    
    Object.entries(categoryHierarchy).forEach(([mainCategory, subCategories]) => {
      
      // Ana Kategori Başlığı
      options.push({
        label: t(`categories.${mainCategory}`),
        value: `header-${mainCategory}`,
        isGroupHeader: true,
      });
      
      // Alt Kategoriler
      subCategories.forEach((subCategory: string) => {
        options.push({
          label: t(`categories.${subCategory}`),
          value: subCategory,
        });
      });
    });
        
    return options;
  }, [t, categoryHierarchy]);

  return (
    <View>
      <SelectionDropdown
        label={t('wardrobe.category')}
        options={categoryOptions}
        selectedValue={selectedCategory}
        onSelect={onSelectCategory}
        placeholder={t('wardrobe.selectCategoryPlaceholder')}
        error={error}
        searchable={true}
      />
    </View>
  );
};

export default CategoryPicker;