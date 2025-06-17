import { create } from 'zustand';
import { fetchCurrentWeather } from '@/services/weatherService';
import * as Location from 'expo-location';
import { Linking } from 'react-native';
import useAlertStore from './alertStore';
import i18n from '@/locales/i18n';

export type Weather = {
  temperature: number;
  condition: string;
  location: string;
};

interface WeatherState {
  weather: Weather | null;
  loading: boolean;
  error: string | null;
  fetchWeather: () => Promise<void>;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  weather: null,
  loading: false,
  error: null,
  fetchWeather: async () => {
    set({ loading: true, error: null });

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const { show: showAlert } = useAlertStore.getState();
        showAlert({
          title: i18n.t('permissions.locationRequiredTitle'),
          message: i18n.t('permissions.locationRequiredMessage'),
          buttons: [
            { text: i18n.t('common.cancel'), onPress: () => {}, variant: 'outline' },
            { text: i18n.t('permissions.openSettings'), onPress: () => Linking.openSettings() }
          ]
        });
        throw new Error('Location permission denied');
      }

      const weatherData = await fetchCurrentWeather();
      set({ weather: weatherData, loading: false, error: null });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather';
      console.error("fetchWeather error:", errorMessage);
      
      set({ 
        error: errorMessage, 
        loading: false,
        weather: null
      });
    }
  },
}));