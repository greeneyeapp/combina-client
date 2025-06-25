// Dosya: kodlar/components/wardrobe/CategoryPicker.tsx (TAM KOD)

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SelectionDropdown from '@/components/common/SelectionDropdown';
import { GENDERED_CATEGORY_HIERARCHY } from '@/utils/constants';

interface CategoryPickerProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  gender: 'female' | 'male' | undefined; // Cinsiyet prop'u eklendi
  error?: string;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ selectedCategory, onSelectCategory, gender, error }) => {
  const { t } = useTranslation();

  // Cinsiyete göre doğru kategori hiyerarşisini seçer.
  // Eğer 'gender' prop'u 'male' ise erkek kategorilerini, değilse (veya tanımsızsa) varsayılan olarak kadın kategorilerini kullanır.
  const categoryHierarchy = useMemo(() => {
    if (gender === 'male') {
      return GENDERED_CATEGORY_HIERARCHY.male;
    }
    return GENDERED_CATEGORY_HIERARCHY.female;
  }, [gender]);

  // Seçilen hiyerarşiye göre açılır menü seçeneklerini oluşturur.
  // Her ana kategoriyi bir başlık, alt kategorileri ise seçilebilir bir öğe olarak formatlar.
  const categoryOptions = useMemo(() => {
    const options: { label: string; value: string; isGroupHeader?: boolean }[] = [];
    Object.entries(categoryHierarchy).forEach(([mainCategory, subCategories]) => {
      // Ana Kategori Başlığı
      options.push({
        label: t(`categories.${mainCategory}`),
        value: `header-${mainCategory}`, // Seçilemez olmasını sağlamak için benzersiz bir value
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
    <SelectionDropdown
      label={t('wardrobe.category')}
      options={categoryOptions}
      selectedValue={selectedCategory}
      onSelect={onSelectCategory}
      placeholder={t('wardrobe.selectCategoryPlaceholder')}
      error={error}
      searchable={true}
    />
  );
};

export default CategoryPicker;