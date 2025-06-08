import * as Location from 'expo-location';
import axios from 'axios';
import { Weather } from '@/store/weatherStore';

// In a real app, you would use a proper API key
const API_KEY = 'demo_api_key';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

export async function fetchCurrentWeather(): Promise<Weather> {
  try {
    // Get permission for location
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }

    // Get current location
    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    // In a real app, we would fetch weather data from a real API
    // For demo purposes, return mock data
    return getMockWeatherData(latitude, longitude);

    /* Real API call would look like:
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: API_KEY,
        units: 'metric',
      },
    });

    const data = response.data;
    
    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main.toLowerCase(),
      location: data.name,
    };
    */
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}

// Mock data for demo purposes
function getMockWeatherData(latitude: number, longitude: number): Weather {
  // Use latitude and longitude to generate different mock data for different locations
  const conditions = ['clear', 'clouds', 'rain', 'snow'];
  const locationIndex = Math.abs(Math.round(latitude + longitude)) % 4;
  const condition = conditions[locationIndex];
  
  // Generate a random temperature between 5 and 30 degrees
  const temperature = Math.round(5 + Math.random() * 25);
  
  // Mock locations
  const locations = ['New York', 'London', 'Paris', 'Tokyo'];
  const location = locations[locationIndex];
  
  return {
    temperature,
    condition,
    location,
  };
}