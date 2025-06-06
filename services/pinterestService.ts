import axios from 'axios';

// Bu IP adresinin bilgisayarınızın güncel IP adresi olduğundan emin olun
const YOUR_API_URL = 'http://192.168.1.11:9002'; 

// Her iki fonksiyonun da kullanacağı Pin arayüzü
interface Pin {
  id: string;
  pinUrl: string | null;
  imageUrl: string | null;
  aspectRatio?: number; // Bu alan getInspirationByOccasion için opsiyonel
}

/**
 * Öneriler sekmesi için: Belirtilen duruma göre ilgili panodaki pin'leri getirir.
 */
export const getInspirationByOccasion = async (occasion: string): Promise<Pin[]> => {
  try {
    const response = await axios.get<Pin[]>(`${YOUR_API_URL}/get-inspiration`, {
      params: {
        occasion: occasion,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('getInspirationByOccasion hatası:', error.response?.data || error.message);
    } else {
      console.error('Beklenmedik bir hata oluştu:', error);
    }
    return [];
  }
};

/**
 * İlham sekmesi için: Bir Pinterest Pin URL'sinden pin'in detaylarını ve görselini getirir.
 */
export const getPinDetailsByUrl = async (pinUrl: string): Promise<Pin | null> => {
  try {
    const response = await axios.get<Pin>(`${YOUR_API_URL}/get-pin-details`, {
      params: {
        url: pinUrl,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('getPinDetailsByUrl hatası:', error.response?.data || error.message);
    } else {
      console.error('Beklenmedik bir hata oluştu:', error);
    }
    return null;
  }
};