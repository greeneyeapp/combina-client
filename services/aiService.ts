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
  url:string;
}

export interface OutfitSuggestionResponse {
  items: SuggestedItem[];
  description: string;
  suggestion_tip?: string;
  pinterest_links: PinterestLink[];
}

export async function getOutfitSuggestion(
  language: string,
  gender: 'female' | 'male' | undefined,
  wardrobe: ClothingItem[],
  last5Outfits: Outfit[],
  weatherCondition: string,
  occasion: string
): Promise<OutfitSuggestionResponse | null> {
  try {
    const token = useApiAuthStore.getState().jwt;
    if (!token) throw new Error('User not authenticated');

    const response = await axios.post<OutfitSuggestionResponse>(
      `${API_URL}/api/suggest-outfit`,
      {
        language,
        gender,
        wardrobe,
        last_5_outfits: last5Outfits,
        weather_condition: weatherCondition,
        occasion,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    const { show: showAlert } = useAlertStore.getState();
    const t = i18n.t;

    if (error.response?.status === 429) {
      showAlert({
        title: t('suggestions.limitExceededTitle'),
        message: t('suggestions.limitExceededMessage'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    } else {
      console.error('Kombin önerisi alınırken hata:', error.response?.data || error.message);
      showAlert({
        title: t('common.error'),
        message: t('suggestions.genericError'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    }
    return null;
  }
}