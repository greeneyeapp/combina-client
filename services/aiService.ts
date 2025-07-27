// services/aiService.ts - Unisex mantığı ve dinamik kuralları içeren, tüm fonksiyonların korunduğu tam ve düzeltilmiş versiyon

import axios from 'axios';
import { useApiAuthStore } from '@/store/apiAuthStore';
import API_URL from '@/config';
import { Outfit } from '@/store/outfitStore';
import { ClothingItem } from '@/store/clothingStore';
import useAlertStore from '@/store/alertStore';
import i18n from '@/locales/i18n';
import { GENDERED_CATEGORY_HIERARCHY } from '@/utils/constants';
import { useConfigStore } from '@/store/configStore';

export interface SuggestedItem {
  id: string;
  name: string;
  category: string;
}

export interface PinterestLink {
  title: string;
  url: string;
}

export interface OutfitSuggestionResponse {
  items: SuggestedItem[];
  description: string;
  suggestion_tip?: string;
  pinterest_links?: PinterestLink[];
}

interface OptimizedClothingItem {
  id: string;
  name: string;
  category: string;
  colors: string[];
  season: string[];
  style: string[];
}

interface OptimizedOutfit {
  items: string[];
  occasion: string;
  weather: string;
  date: string;
}

const optimizeClothingItem = (item: ClothingItem): OptimizedClothingItem => {
  const itemColors = item.colors && item.colors.length > 0 ? item.colors : [item.color];
  const styleArray = typeof item.style === 'string'
    ? item.style.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : Array.isArray(item.style)
      ? item.style
      : ['casual'];
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    colors: itemColors,
    season: item.season || [],
    style: styleArray
  };
};

const optimizeOutfit = (outfit: Outfit): OptimizedOutfit => {
  return {
    items: outfit.items,
    occasion: outfit.occasion,
    weather: outfit.weather,
    date: outfit.date
  };
};

const intelligentWardrobeFilter = (
  wardrobe: ClothingItem[],
  weatherCondition: string,
  occasion: string,
  plan: 'free' | 'premium',
  gender: 'female' | 'male' | 'unisex' | undefined
): ClothingItem[] => {
  const validItems = wardrobe.filter(item => !item.isImageMissing);
  const preFilterLimit = plan === 'premium' ? 400 : 300;

  const allRules = useConfigStore.getState().occasionRules;
  let requirements: { required_one_of?: Record<string, string[]> } | undefined;
  let hierarchy: Record<string, string[]>;

  if (gender === 'male') {
    requirements = allRules?.male[occasion];
    hierarchy = GENDERED_CATEGORY_HIERARCHY.male;
  } else if (gender === 'unisex') {
    if (allRules) {
        const maleRules = allRules.male[occasion]?.required_one_of || {};
        const femaleRules = allRules.female[occasion]?.required_one_of || {};
        const mergedRules: Record<string, string[]> = {};
        Object.keys(femaleRules).forEach(key => {
            mergedRules[key] = [...(new Set([...(mergedRules[key] || []), ...femaleRules[key]]))];
        });
        Object.keys(maleRules).forEach(key => {
            if (!mergedRules[key]) mergedRules[key] = [];
            maleRules[key].forEach(cat => {
                if (!mergedRules[key].includes(cat)) mergedRules[key].push(cat);
            });
        });
        requirements = { required_one_of: mergedRules };
    }
    const maleCategories = GENDERED_CATEGORY_HIERARCHY.male;
    const femaleCategories = GENDERED_CATEGORY_HIERARCHY.female;
    const mergedHierarchy: Record<string, string[]> = {};
    Object.entries(maleCategories).forEach(([mainCat, subcats]) => { mergedHierarchy[mainCat] = [...subcats]; });
    Object.entries(femaleCategories).forEach(([mainCat, subcats]) => {
        if (mergedHierarchy[mainCat]) {
            subcats.forEach(subcat => { if (!mergedHierarchy[mainCat].includes(subcat)) mergedHierarchy[mainCat].push(subcat); });
        } else {
            mergedHierarchy[mainCat] = [...subcats];
        }
    });
    hierarchy = mergedHierarchy;
  } else {
    requirements = allRules?.female[occasion];
    hierarchy = GENDERED_CATEGORY_HIERARCHY.female;
  }

  const essentialItems = new Set<ClothingItem>();
  if (requirements?.required_one_of) {
    for (const mainCategory in requirements.required_one_of) {
        const requiredSubCategories = requirements.required_one_of[mainCategory];
        const itemsInCategory = validItems.filter(item => {
            const itemMainCategory = Object.keys(hierarchy).find(key => hierarchy[key as keyof typeof hierarchy].includes(item.category));
            return itemMainCategory === mainCategory && requiredSubCategories.includes(item.category);
        });
        itemsInCategory.sort((a, b) => calculateImportanceScore(b) - calculateImportanceScore(a)).slice(0, 5).forEach(item => essentialItems.add(item));
    }
  }

  if (validItems.length <= preFilterLimit) {
    return validItems;
  }

  const scoredItems = validItems.map(item => {
    const essentialBonus = essentialItems.has(item) ? 100 : 0;
    const seasonScore = calculateSeasonScore(item, weatherCondition);
    const styleScore = calculateStyleScore(item, occasion);
    const importanceScore = calculateImportanceScore(item);
    const colorScore = calculateColorDiversityScore(item);
    return { item, score: essentialBonus + seasonScore + styleScore + importanceScore + colorScore };
  });

  return balancedSelection(scoredItems, preFilterLimit);
};

const calculateSeasonScore = (item: ClothingItem, weather: string): number => {
  const seasonMap: Record<string, string[]> = {
    'hot': ['summer'], 'warm': ['spring', 'summer'],
    'cool': ['fall', 'spring'], 'cold': ['winter', 'fall']
  };
  const appropriateSeasons = seasonMap[weather] || ['spring', 'summer', 'fall', 'winter'];
  return item.season.filter(s => appropriateSeasons.includes(s)).length > 0 ? 2 : 0;
};

const calculateStyleScore = (item: ClothingItem, occasion: string): number => {
  const styles = typeof item.style === 'string' ? item.style.split(',').map(s => s.trim()) : (Array.isArray(item.style) ? item.style : ['casual']);
  if (occasion.includes('business') || occasion.includes('formal') || occasion.includes('office')) {
    return styles.some(s => ['classic', 'smart_casual', 'minimalist'].includes(s.toLowerCase())) ? 3 : 0;
  }
  if (occasion.includes('party') || occasion.includes('night') || occasion.includes('celebration')) {
    return styles.some(s => ['party', 'vintage', 'gothic'].includes(s.toLowerCase())) ? 3 : 1;
  }
  if (occasion.includes('sport') || occasion.includes('gym') || occasion.includes('yoga')) {
    return styles.some(s => ['sportswear', 'casual'].includes(s.toLowerCase())) ? 3 : 0;
  }
  if (occasion.includes('date') || occasion.includes('dinner')) {
    return styles.some(s => ['smart_casual', 'classic', 'vintage', 'party'].includes(s.toLowerCase())) ? 3 : 1;
  }
  if (occasion.includes('weekend') || occasion.includes('brunch') || occasion.includes('coffee')) {
    return styles.some(s => ['casual', 'bohemian', 'minimalist'].includes(s.toLowerCase())) ? 3 : 1;
  }
  return styles.some(s => ['casual', 'smart_casual'].includes(s.toLowerCase())) ? 2 : 1;
};

const calculateImportanceScore = (item: ClothingItem): number => {
  const essentialCategories = [
    't-shirt', 'shirt', 'jeans', 'trousers', 'sneakers',
    'dress', 'blouse', 'jacket', 'boots', 'flats'
  ];
  return essentialCategories.includes(item.category.toLowerCase()) ? 1 : 0;
};

const calculateColorDiversityScore = (item: ClothingItem): number => {
  const colors = item.colors || [item.color];
  const hasNeutral = colors.some(c => ['black', 'white', 'gray', 'navy', 'beige', 'cream'].includes(c || ''));
  return hasNeutral ? 1 : 0.5;
};

const balancedSelection = (
  scoredItems: Array<{ item: ClothingItem, score: number }>,
  limit: number
): ClothingItem[] => {
  const sorted = scoredItems.sort((a, b) => b.score - a.score);
  const selected: ClothingItem[] = [];
  const categoryCount: Record<string, number> = {};
  const maxPerCategory = Math.max(3, Math.floor(limit / 15));
  for (const { item } of sorted) {
    if (selected.length >= limit) break;
    const category = item.category.toLowerCase();
    const currentCount = categoryCount[category] || 0;
    if (currentCount < maxPerCategory) {
      selected.push(item);
      categoryCount[category] = currentCount + 1;
    }
  }
  return selected;
};

export async function getOutfitSuggestion(
  language: string,
  gender: 'female' | 'male' | 'unisex' | undefined,
  plan: 'free' | 'premium',
  wardrobe: ClothingItem[],
  last5Outfits: Outfit[],
  weatherCondition: string,
  occasion: string
): Promise<OutfitSuggestionResponse | null> {
  try {
    const token = useApiAuthStore.getState().jwt;
    if (!token) throw new Error('User not authenticated');

    const filteredWardrobe = intelligentWardrobeFilter(wardrobe, weatherCondition, occasion, plan, gender);
    const optimizedWardrobe = filteredWardrobe.map(optimizeClothingItem);
    const optimizedHistory = last5Outfits.slice(0, 5).map(optimizeOutfit);

    const payload = {
      language, gender, plan,
      wardrobe: optimizedWardrobe,
      last_5_outfits: optimizedHistory,
      weather_condition: weatherCondition,
      occasion,
      context: {
        total_wardrobe_size: wardrobe.length,
        filtered_wardrobe_size: optimizedWardrobe.length,
        user_plan: plan,
        optimization_applied: true
      }
    };
    
    console.log('🚀 Sending AI request:', {
      originalWardrobe: wardrobe.length,
      filteredWardrobe: optimizedWardrobe.length,
      plan: plan,
      weather: weatherCondition,
      occasion: occasion,
      payloadSize: calculatePayloadSize(payload)
    });

    const response = await axios.post<OutfitSuggestionResponse>(
      `${API_URL}/api/suggest-outfit`, payload,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, timeout: 35000 }
    );

    console.log('✅ AI suggestion received successfully');
    return response.data;
  } catch (error: any) {
    const { show: showAlert } = useAlertStore.getState();
    const t = i18n.t;
    console.error('❌ AI service error:', {
      status: error.response?.status, data: error.response?.data,
      message: error.message, url: error.config?.url
    });

    if (error.response?.status === 422) {
      const detail = error.response.data.detail || '';
      const occasionMatch = detail.match(/'([^']+)'/);
      const categoriesMatch = detail.match(/like: (.*)\./);
      let title = t('suggestions.wardrobeError.title');
      let message = t('suggestions.wardrobeError.defaultMessage');
      if (occasionMatch && categoriesMatch) {
        const occasionKey = occasionMatch[1];
        const categoryKeys = categoriesMatch[1].split(', ').map(k => k.trim());
        const localizedOccasion = t(`occasions.${occasionKey}`, occasionKey);
        const localizedCategories = categoryKeys.map(key => t(`categories.${key}`, key)).join(', ');
        message = t('suggestions.wardrobeError.specificMessage', {
          occasion: localizedOccasion,
          categories: localizedCategories
        });
      }
      showAlert({ title: title, message: message, buttons: [{ text: t('common.ok'), onPress: () => { }, variant: 'primary' }] });
    } else if (error.response?.status === 429) {
      showAlert({ title: t('suggestions.limitExceededTitle'), message: t('suggestions.limitExceededMessage'), buttons: [{ text: t('common.ok'), onPress: () => { } }] });
    } else if (error.response?.status === 413) {
      showAlert({ title: t('common.error'), message: t('suggestions.tooManyItemsError', 'Wardrobe too large. Please try again.'), buttons: [{ text: t('common.ok'), onPress: () => { } }] });
    } else if (error.code === 'ECONNABORTED') {
      showAlert({ title: t('common.error'), message: t('suggestions.timeoutError', 'Request timed out. Please try again.'), buttons: [{ text: t('common.ok'), onPress: () => { } }] });
    } else if (error.response?.status === 500) {
      showAlert({ title: t('common.error'), message: t('suggestions.aiServiceError', 'AI service temporarily unavailable. Please try again.'), buttons: [{ text: t('common.ok'), onPress: () => { } }] });
    } else {
      const genericMessage = error.response?.data?.detail || t('suggestions.genericError');
      showAlert({ title: t('common.error'), message: genericMessage, buttons: [{ text: t('common.ok'), onPress: () => { } }] });
    }
    return null;
  }
}

export const getWardrobeStats = (wardrobe: ClothingItem[]) => {
  const validItems = wardrobe.filter(item => !item.isImageMissing);
  const categoryCount = validItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const seasonCount = validItems.reduce((acc, item) => {
    item.season.forEach(season => { acc[season] = (acc[season] || 0) + 1; });
    return acc;
  }, {} as Record<string, number>);
  const colorCount = validItems.reduce((acc, item) => {
    const colors = item.colors || [item.color];
    colors.forEach(color => { if (color) acc[color] = (acc[color] || 0) + 1; });
    return acc;
  }, {} as Record<string, number>);
  return {
    totalItems: validItems.length,
    categoryBreakdown: categoryCount,
    seasonBreakdown: seasonCount,
    colorBreakdown: colorCount,
    missingImages: wardrobe.length - validItems.length,
    optimizationScore: calculateOptimizationScore(validItems)
  };
};

export const calculateOptimizationScore = (wardrobe: ClothingItem[]): number => {
  if (wardrobe.length === 0) return 0;
  const categories = new Set(wardrobe.map(item => item.category));
  const categoryScore = Math.min(categories.size / 10, 1) * 0.3;
  const colors = new Set();
  wardrobe.forEach(item => {
    const itemColors = item.colors || [item.color];
    itemColors.forEach(color => color && colors.add(color));
  });
  const colorScore = Math.min(colors.size / 15, 1) * 0.3;
  const seasons = ['spring', 'summer', 'fall', 'winter'];
  const seasonCoverage = seasons.filter(season => wardrobe.some(item => item.season.includes(season))).length;
  const seasonScore = (seasonCoverage / 4) * 0.2;
  const availableStyles = ['classic', 'smart_casual', 'casual', 'bohemian', 'minimalist', 'vintage', 'gothic', 'party', 'sportswear'];
  const styles = new Set();
  wardrobe.forEach(item => {
    const itemStyles = typeof item.style === 'string' ? item.style.split(',').map(s => s.trim()) : (Array.isArray(item.style) ? item.style : ['casual']);
    itemStyles.forEach(style => { if (availableStyles.includes(style)) { styles.add(style); } });
  });
  const styleScore = Math.min(styles.size / availableStyles.length, 1) * 0.2;
  return Math.round((categoryScore + colorScore + seasonScore + styleScore) * 100);
};

export const calculatePayloadSize = (data: any): string => {
  const jsonString = JSON.stringify(data);
  const sizeInBytes = new Blob([jsonString]).size;
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} bytes`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};

export const checkGPTStatus = async (): Promise<any> => {
  try {
    const token = useApiAuthStore.getState().jwt;
    const response = await axios.get(`${API_URL}/api/gpt-status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('GPT status check failed:', error);
    return { status: 'unknown' };
  }
};
