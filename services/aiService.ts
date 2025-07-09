// services/aiService.ts - Optimize edilmiş versiyon

import axios from 'axios';
import { useApiAuthStore } from '@/store/apiAuthStore';
import API_URL from '@/config';
import { Outfit } from '@/store/outfitStore';
import { ClothingItem } from '@/store/clothingStore';
import useAlertStore from '@/store/alertStore';
import i18n from '@/locales/i18n';

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

// Wardrobe item'ını backend için optimize et
interface OptimizedClothingItem {
  id: string;
  name: string;
  category: string;
  colors: string[];         // Çoklu renk desteği
  season: string[];
  style: string[];         // String array olarak gönder
}

// Outfit history'yi optimize et
interface OptimizedOutfit {
  items: string[];         // Sadece ID'ler
  occasion: string;
  weather: string;
  date: string;           // Analiz için tarih yeterli
}

// ClothingItem'ı optimize edilmiş versiyona dönüştür
const optimizeClothingItem = (item: ClothingItem): OptimizedClothingItem => {
  // Çoklu renk desteği - colors varsa onu kullan, yoksa color'dan oluştur
  const itemColors = item.colors && item.colors.length > 0 ? item.colors : [item.color];
  
  // Style array'e dönüştür - string'se split et
  const styleArray = typeof item.style === 'string' 
    ? item.style.split(',').map(s => s.trim()).filter(s => s.length > 0)
    : Array.isArray(item.style) 
      ? item.style 
      : ['casual']; // Fallback

  const optimized = {
    id: item.id,
    name: item.name,
    category: item.category,
    colors: itemColors,
    season: item.season || [],
    style: styleArray
  };

  // Debug: İlk item için detay log
  if (item.id && Math.random() < 0.1) { // %10 şansla log
    console.log('🔄 Item optimization:', {
      original: {
        id: item.id,
        style: item.style,
        colors: item.colors,
        color: item.color
      },
      optimized: optimized
    });
  }

  return optimized;
};

// Outfit'i optimize edilmiş versiyona dönüştür
const optimizeOutfit = (outfit: Outfit): OptimizedOutfit => {
  return {
    items: outfit.items,
    occasion: outfit.occasion,
    weather: outfit.weather,
    date: outfit.date
  };
};

// Wardrobe'ı akıllı filtreleme ile optimize et
const filterRelevantWardrobe = (
  wardrobe: ClothingItem[],
  weatherCondition: string,
  occasion: string
): OptimizedClothingItem[] => {
  
  // İlk aşama: Temel filtreler (çok katı olmayan)
  const basicFiltered = wardrobe.filter(item => {
    // Sadece resmi olmayan item'ları filtrele
    return !item.isImageMissing;
  });
  
  // İkinci aşama: Uygun item'ları skorla
  const scoredItems = basicFiltered.map(item => {
    let score = 1; // Base score
    
    // Mevsim uygunluğu skorla (0-3 arası ekleme)
    const seasonScore = item.season.reduce((acc, season) => {
      switch (weatherCondition) {
        case 'cold':
        case 'snowy':
          if (season === 'winter') return acc + 3;
          if (season === 'fall') return acc + 2;
          if (season === 'spring') return acc + 1;
          return acc;
        case 'cool':
          if (season === 'fall') return acc + 3;
          if (season === 'spring') return acc + 3;
          if (season === 'winter') return acc + 1;
          return acc;
        case 'warm':
          if (season === 'spring') return acc + 3;
          if (season === 'summer') return acc + 2;
          if (season === 'fall') return acc + 1;
          return acc;
        case 'hot':
        case 'sunny':
          if (season === 'summer') return acc + 3;
          if (season === 'spring') return acc + 2;
          return acc;
        default:
          return acc + 1; // Her mevsim için eşit skor
      }
    }, 0);
    
    // Stil uygunluğu skorla (0-3 arası ekleme)
    const styles = item.style ? item.style.split(',').map(s => s.trim()) : ['casual'];
    const styleScore = styles.reduce((acc, style) => {
      if (occasion.includes('formal') || occasion.includes('business') || occasion.includes('wedding')) {
        if (style === 'formal') return acc + 3;
        if (style === 'business') return acc + 3;
        if (style === 'casual') return acc + 1;
        return acc;
      }
      if (occasion.includes('gym') || occasion.includes('sport') || occasion.includes('yoga')) {
        if (style === 'sportswear') return acc + 3;
        return acc;
      }
      if (occasion.includes('beach') || occasion.includes('vacation')) {
        if (style === 'beachwear') return acc + 3;
        if (style === 'casual') return acc + 2;
        return acc;
      }
      if (occasion.includes('party') || occasion.includes('night')) {
        if (style === 'party') return acc + 3;
        if (style === 'formal') return acc + 2;
        if (style === 'casual') return acc + 1;
        return acc;
      }
      // Casual occasions için
      if (style === 'casual') return acc + 3;
      return acc + 1;
    }, 0);
    
    // Kategori çeşitliliği için bonus (temel kategoriler öncelikli)
    const categoryBonus = (() => {
      const essentialCategories = ['t-shirt', 'jeans', 'trousers', 'shirt', 'sweater', 'sneakers'];
      return essentialCategories.includes(item.category) ? 1 : 0;
    })();
    
    return {
      item: optimizeClothingItem(item),
      score: score + seasonScore + styleScore + categoryBonus
    };
  });
  
  // Skorlara göre sırala ve akıllı filtreleme yap
  const sortedItems = scoredItems.sort((a, b) => b.score - a.score);
  
  // Kategori bazlı dağılım için akıllı seçim
  const categoryGroups = sortedItems.reduce((acc, { item, score }) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push({ item, score });
    return acc;
  }, {} as Record<string, Array<{ item: OptimizedClothingItem; score: number }>>);
  
  // Her kategoriden en iyi skorlu item'ları seç
  const selectedItems: OptimizedClothingItem[] = [];
  const maxPerCategory = calculateMaxPerCategory(Object.keys(categoryGroups).length);
  
  Object.entries(categoryGroups).forEach(([category, items]) => {
    // Her kategoriden maksimum kaç item alınacağını belirle
    const limit = Math.min(items.length, maxPerCategory);
    const bestItems = items.slice(0, limit).map(i => i.item);
    selectedItems.push(...bestItems);
  });
  
  return selectedItems;
};

// Dinamik limit hesaplama - wardrobe büyüklüğüne göre
const calculateDynamicLimit = (
  filteredWardrobe: OptimizedClothingItem[], 
  plan: 'free' | 'premium'
): number => {
  const itemCount = filteredWardrobe.length;
  
  // Plan bazlı maksimum limitler
  const maxLimits = {
    free: 150,      // Free kullanıcılar için makul limit
    premium: 300    // Premium kullanıcılar için daha yüksek limit
  };
  
  // Eğer filtrelenmiş wardrobe zaten küçükse tamamını gönder
  if (itemCount <= maxLimits[plan]) {
    return itemCount;
  }
  
  // Büyük wardrobe'lar için limit
  return maxLimits[plan];
};

// Kategori başına maksimum item sayısını hesapla
const calculateMaxPerCategory = (totalCategories: number): number => {
  // Kategori sayısına göre dinamik limit
  if (totalCategories <= 5) return 25;   // Az kategori varsa kategori başına daha fazla
  if (totalCategories <= 10) return 20;  // Orta sayıda kategori
  if (totalCategories <= 15) return 15;  // Çok kategori varsa kategori başına daha az
  if (totalCategories <= 20) return 12;  // Daha fazla kategori
  return 10; // Çok fazla kategori durumunda minimum
};

export async function getOutfitSuggestion(
  language: string,
  gender: 'female' | 'male' | undefined,
  plan: 'free' | 'premium',
  wardrobe: ClothingItem[],
  last5Outfits: Outfit[],
  weatherCondition: string,
  occasion: string
): Promise<OutfitSuggestionResponse | null> {
  try {
    const token = useApiAuthStore.getState().jwt;
    if (!token) throw new Error('User not authenticated');

    // Wardrobe'ı akıllı filtreleme ile optimize et
    const relevantWardrobe = filterRelevantWardrobe(wardrobe, weatherCondition, occasion);
    
    // Dinamik limit - kategori çeşitliliğine göre
    const maxWardrobeItems = calculateDynamicLimit(relevantWardrobe, plan);
    const optimizedWardrobe = relevantWardrobe.slice(0, maxWardrobeItems);
    
    // Outfit history'yi optimize et
    const optimizedHistory = last5Outfits.map(optimizeOutfit);

    // Payload'ı hazırla
    const payload = {
      language,
      gender,
      plan,
      wardrobe: optimizedWardrobe,          // Optimize edilmiş wardrobe
      last_5_outfits: optimizedHistory,     // Optimize edilmiş history
      weather_condition: weatherCondition,
      occasion,
      // Ek context bilgileri
      context: {
        total_wardrobe_size: wardrobe.length,
        filtered_wardrobe_size: optimizedWardrobe.length,
        user_plan: plan
      }
    };

    console.log('🚀 Sending optimized data to AI service:', {
      wardrobeItems: `${optimizedWardrobe.length}/${wardrobe.length}`,
      filteredByWeather: weatherCondition,
      filteredByOccasion: occasion,
      historyItems: optimizedHistory.length,
      payloadSize: calculatePayloadSize(payload)
    });

    // DETAYLI DEBUG: İlk wardrobe item'ını log'la
    if (optimizedWardrobe.length > 0) {
      console.log('📦 Sample wardrobe item:', {
        id: optimizedWardrobe[0].id,
        name: optimizedWardrobe[0].name,
        category: optimizedWardrobe[0].category,
        colors: optimizedWardrobe[0].colors,
        season: optimizedWardrobe[0].season,
        style: optimizedWardrobe[0].style
      });
    }

    // DETAYLI DEBUG: History sample
    if (optimizedHistory.length > 0) {
      console.log('📋 Sample history item:', optimizedHistory[0]);
    }

    const response = await axios.post<OutfitSuggestionResponse>(
      `${API_URL}/api/suggest-outfit`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 saniye timeout
      }
    );
    
    console.log('✅ AI suggestion received successfully');
    return response.data;
    
  } catch (error: any) {
    const { show: showAlert } = useAlertStore.getState();
    const t = i18n.t;

    console.error('❌ AI service error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });

    if (error.response?.status === 429) {
      showAlert({
        title: t('suggestions.limitExceededTitle'),
        message: t('suggestions.limitExceededMessage'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    } else if (error.response?.status === 413) {
      // Payload too large hatası
      showAlert({
        title: t('common.error'),
        message: t('suggestions.tooManyItemsError', 'Too many wardrobe items. Please try again.'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    } else if (error.code === 'ECONNABORTED') {
      // Timeout hatası
      showAlert({
        title: t('common.error'),
        message: t('suggestions.timeoutError', 'Request timed out. Please try again.'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    } else {
      showAlert({
        title: t('common.error'),
        message: t('suggestions.genericError'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    }
    return null;
  }
}

// Wardrobe istatistikleri için yardımcı fonksiyon
export const getWardrobeStats = (wardrobe: ClothingItem[]) => {
  const validItems = wardrobe.filter(item => !item.isImageMissing);
  
  const categoryCount = validItems.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const seasonCount = validItems.reduce((acc, item) => {
    item.season.forEach(season => {
      acc[season] = (acc[season] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalItems: validItems.length,
    categoryBreakdown: categoryCount,
    seasonBreakdown: seasonCount,
    missingImages: wardrobe.length - validItems.length
  };
};

// Debug için veri boyutunu hesapla
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