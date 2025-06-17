import * as Location from 'expo-location';
import axios from 'axios';
import { Weather } from '@/store/weatherStore';
import API_URL from '@/config';
import { useApiAuthStore } from '@/store/apiAuthStore';

export async function fetchCurrentWeather(): Promise<Weather> {
  try {
    const token = useApiAuthStore.getState().jwt;
    if (!token) throw new Error('Not authenticated for API');

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const response = await axios.get(`${API_URL}/api/weather`, {
      params: { lat: latitude, lon: longitude },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = response.data;
    
    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main.toLowerCase(),
      location: data.name,
    };
    
  } catch (error) {
    console.error('Hava durumu isteği hatası:', error);
    throw new Error('Failed to fetch weather data from backend.');
  }
}