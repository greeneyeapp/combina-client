import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearAllData() {
  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    
    // Clear all data
    await AsyncStorage.multiRemove(keys);
    
    console.log('All data cleared successfully');
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}