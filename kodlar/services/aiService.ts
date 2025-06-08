import { ClothingItem } from '@/store/clothingStore';

type SuggestedOutfit = {
  items: ClothingItem[];
  description: string;
};

// In a real app, this would use OpenAI or another AI service
export async function getOutfitSuggestion(
  clothing: ClothingItem[],
  weatherCondition: string,
  occasion: string
): Promise<SuggestedOutfit | null> {
  try {
    // This would normally be an API call to an AI service
    // For demo purposes, we'll simulate the AI response
    return simulateAIResponse(clothing, weatherCondition, occasion);
  } catch (error) {
    console.error('Error getting outfit suggestion:', error);
    return null;
  }
}

// Simulate AI response for demo
function simulateAIResponse(
  clothing: ClothingItem[],
  weatherCondition: string,
  occasion: string
): SuggestedOutfit {
  // Filter by weather-appropriate items
  let weatherAppropriate = clothing;
  
  if (['hot', 'sunny', 'warm'].includes(weatherCondition)) {
    weatherAppropriate = clothing.filter(item => 
      item.season.includes('summer') || item.season.includes('spring')
    );
  } else if (['cool', 'cloudy'].includes(weatherCondition)) {
    weatherAppropriate = clothing.filter(item => 
      item.season.includes('fall') || item.season.includes('spring')
    );
  } else if (['cold', 'snowy', 'rainy'].includes(weatherCondition)) {
    weatherAppropriate = clothing.filter(item => 
      item.season.includes('winter') || item.season.includes('fall')
    );
  }

  // Further filter by occasion
  let occasionAppropriate = weatherAppropriate;
  
  if (['formal', 'work'].includes(occasion)) {
    occasionAppropriate = weatherAppropriate.filter(item => 
      ['formal', 'business'].includes(item.style)
    );
  } else if (occasion === 'casual') {
    occasionAppropriate = weatherAppropriate.filter(item => 
      ['casual', 'sportswear'].includes(item.style)
    );
  } else if (occasion === 'party') {
    occasionAppropriate = weatherAppropriate.filter(item => 
      ['party', 'formal'].includes(item.style)
    );
  }

  // If we don't have enough items after filtering, use the original weather-appropriate items
  if (occasionAppropriate.length < 3) {
    occasionAppropriate = weatherAppropriate;
  }

  // Choose items by category
  const tops = occasionAppropriate.filter(item => item.category === 'top');
  const bottoms = occasionAppropriate.filter(item => item.category === 'bottom');
  const outerwear = occasionAppropriate.filter(item => item.category === 'outerwear');
  const dresses = occasionAppropriate.filter(item => item.category === 'dress');
  const shoes = occasionAppropriate.filter(item => item.category === 'shoes');
  const accessories = occasionAppropriate.filter(item => item.category === 'accessory');

  // Initialize the outfit items array
  const outfitItems: ClothingItem[] = [];

  // Build the outfit based on occasion and available items
  if (occasion === 'formal' && dresses.length > 0) {
    // For formal events, prefer dresses if available
    outfitItems.push(dresses[Math.floor(Math.random() * dresses.length)]);
  } else {
    // Add a top if available
    if (tops.length > 0) {
      outfitItems.push(tops[Math.floor(Math.random() * tops.length)]);
    }
    
    // Add bottoms if available and we're not using a dress
    if (bottoms.length > 0 && !outfitItems.some(item => item.category === 'dress')) {
      outfitItems.push(bottoms[Math.floor(Math.random() * bottoms.length)]);
    }
  }

  // Add outerwear for cold weather
  if (['cold', 'snowy', 'rainy', 'cool'].includes(weatherCondition) && outerwear.length > 0) {
    outfitItems.push(outerwear[Math.floor(Math.random() * outerwear.length)]);
  }

  // Add shoes if available
  if (shoes.length > 0) {
    outfitItems.push(shoes[Math.floor(Math.random() * shoes.length)]);
  }

  // Add an accessory if available
  if (accessories.length > 0) {
    outfitItems.push(accessories[Math.floor(Math.random() * accessories.length)]);
  }

  // Create a description of the outfit
  const descriptions = [
    `Perfect for a ${occasion} day in ${weatherCondition} weather.`,
    `This outfit is ideal for ${occasion} occasions when it's ${weatherCondition} outside.`,
    `A stylish choice for ${occasion} events during ${weatherCondition} weather.`,
    `Stay comfortable and fashionable during ${weatherCondition} weather for your ${occasion} needs.`,
  ];

  return {
    items: outfitItems,
    description: descriptions[Math.floor(Math.random() * descriptions.length)]
  };
}