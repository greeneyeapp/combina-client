export const WARDROBE_CATEGORIES = [
  'all', // Tüm öğeleri görmek için genel kategori

  // Üst Giyim
  'top', // Ana kategori
  't-shirt', 'shirt', 'blouse', 'sweater', 'cardigan', 'hoodie', 'tank-top', 'polo-shirt',

  // Alt Giyim
  'bottom', // Ana kategori
  'jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'joggers',

  // Dış Giyim
  'outerwear', // Ana kategori
  'jacket', 'coat', 'blazer', 'vest', 'raincoat',

  // Elbiseler
  'dress', // Ana kategori
  'mini-dress', 'midi-dress', 'maxi-dress', 'cocktail-dress', 'evening-dress', 'casual-dress',

  // Ayakkabılar
  'shoes', // Ana kategori
  'sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'slippers',

  // Aksesuarlar
  'accessory', // Ana kategori
  'bag', 'hat', 'scarf', 'belt', 'jewelry', 'sunglasses', 'watch', 'tie', 'gloves',
];

// Detaylı filtreleme için kategori hiyerarşisi (WardrobeScreen için kullanılacak)
export const CATEGORY_HIERARCHY = {
  'top': ['t-shirt', 'shirt', 'blouse', 'sweater', 'cardigan', 'hoodie', 'tank-top', 'polo-shirt'],
  'bottom': ['jeans', 'trousers', 'shorts', 'skirt', 'leggings', 'joggers'],
  'outerwear': ['jacket', 'coat', 'blazer', 'vest', 'raincoat'],
  'dress': ['mini-dress', 'midi-dress', 'maxi-dress', 'cocktail-dress', 'evening-dress', 'casual-dress'],
  'shoes': ['sneakers', 'boots', 'sandals', 'heels', 'flats', 'loafers', 'slippers'],
  'accessory': ['bag', 'hat', 'scarf', 'belt', 'jewelry', 'sunglasses', 'watch', 'tie', 'gloves'],
  // Diğer ana kategoriler buraya eklenebilir
};