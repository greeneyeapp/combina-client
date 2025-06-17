import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SelectionDropdown from '@/components/common/SelectionDropdown';
import { CATEGORY_HIERARCHY } from '@/utils/constants';

interface CategoryPickerProps {
  selectedCategory: string; // Detaylı kategori (örn: 't-shirt')
  onSelectCategory: (category: string) => void;
  error?: string; // Hata mesajı prop'u
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ selectedCategory, onSelectCategory, error }) => {
  const { t } = useTranslation();

  // Tüm kategori seçeneklerini SelectionDropdown'a uygun formata dönüştür
  const categoryOptions = useMemo(() => {
    const options: { label: string; value: string; isGroupHeader?: boolean }[] = [];

    Object.keys(CATEGORY_HIERARCHY).forEach(mainCategory => {
      // Ana kategori başlığını ekle
      options.push({
        label: t(`categories.${mainCategory}`),
        value: mainCategory, // Ana kategorinin kendisi de bir değer olabilir
        isGroupHeader: true,
      });

      // Alt kategorileri ekle
      CATEGORY_HIERARCHY[mainCategory as keyof typeof CATEGORY_HIERARCHY].forEach(subCategory => {
        options.push({
          label: t(`categories.${subCategory}`),
          value: subCategory,
        });
      });
    });

    return options;
  }, [t]);

  return (
    <SelectionDropdown
      label={t('wardrobe.category')}
      options={categoryOptions}
      selectedValue={selectedCategory}
      onSelect={onSelectCategory}
      placeholder={t('wardrobe.selectCategoryPlaceholder')}
      error={error}
      searchable={true} // Kategori listesi uzun olabileceği için arama özelliğini açtık
    />
  );
};

export default CategoryPicker;