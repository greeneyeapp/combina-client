// kodlar/utils/constants.ts - Son, manuel olarak sıralanmış ve mantıksal renk paleti

export interface ColorInfo {
  name: string; // Benzersiz İngilizce anahtar
  hex: string;
}

export const ALL_COLORS: ColorInfo[] = [
  // --- YENİ GRUP: Desenler ---


  // --- Mevcut Renk Listeniz (Sırası Korunarak) ---
  { name: 'black', hex: '#000000' },
  { name: 'white', hex: '#FFFFFF' },
  { name: 'cream', hex: '#FFFDD0' },
  { name: 'beige', hex: '#C4A484' },
  { name: 'silver', hex: '#C0C0C0' },
  { name: 'gray', hex: '#A2AAAD' },
  { name: 'fume', hex: '#5B6770' },
  { name: 'earth', hex: '#7D5A3A' },
  { name: 'bronze', hex: '#cc8031' },
  { name: 'cinnamon', hex: '#7f4031' },
  { name: 'chestnut', hex: '#582D1D' },
  { name: 'tan', hex: '#8B4513' },
  { name: 'mustard', hex: '#C5A900' },
  { name: 'gold', hex: '#FFD700' },
  { name: 'yellow', hex: '#FEDD00' },
  { name: 'lemon', hex: '#F6EB61' },
  { name: 'orange', hex: '#C1441E' },
  { name: 'coral', hex: '#FF7F50' },
  { name: 'salmon', hex: '#fa8071' },
  { name: 'apricot', hex: '#ffa483' },
  { name: 'peach', hex: '#ffbe98' },
  { name: 'dusty-pink', hex: '#F4A6A3' },
  { name: 'lilac', hex: '#c8a2c8' },
  { name: 'lavender', hex: '#b57edc' },
  { name: 'violet', hex: '#93328E' },
  { name: 'pink', hex: '#E93CAC' },
  { name: 'fuchsia', hex: '#ff00ff' },
  { name: 'pomegranate-red', hex: '#e91639' },
  { name: 'red', hex: '#e30a17' },
  { name: 'dark-red', hex: '#8B0000' },
  { name: 'cherry-red', hex: '#74050b' },
  { name: 'plum', hex: '#582D4B' },
  { name: 'purple', hex: '#440099' },
  { name: 'navy', hex: '#001489' },
  { name: 'saxony-blue', hex: '#0000c8' },
  { name: 'blue', hex: '#0072CE' },
  { name: 'turquoise', hex: '#30d5c8' },
  { name: 'ice-blue', hex: '#74D1EA' },
  { name: 'water-green', hex: '#7bdcb5' },
  { name: 'mint', hex: '#98ff98' },
  { name: 'grass-green', hex: '#00B140' },
  { name: 'green', hex: '#007A33' },
  { name: 'olive', hex: '#556B2F' },
  { name: 'khaki', hex: '#736542' },
  { name: 'emerald', hex: '#013220' },

  { name: 'leopard', hex: 'pattern_leopard' },
  { name: 'zebra', hex: 'pattern_zebra' },
  { name: 'snakeskin', hex: 'pattern_snakeskin' }, // YENİ EKLENDİ
];

export const OCCASION_HIERARCHY = {
  casual: ['daily-errands', 'friends-gathering', 'weekend-brunch', 'coffee-date', 'shopping', 'walk'],
  work: ['office-day', 'business-meeting', 'business-lunch', 'networking', 'university'],
  formal: ['wedding', 'special-event', 'celebration', 'formal-dinner'],
  social: ['dinner-date', 'birthday-party', 'concert', 'night-out', 'house-party'],
  active: ['gym', 'yoga-pilates', 'outdoor-sports', 'hiking'],
  special: ['travel', 'weekend-getaway', 'holiday', 'festival', 'sightseeing']
};

export const GENDERED_CATEGORY_HIERARCHY = {
  female: {
    'top': ['t-shirt', 'blouse', 'shirt', 'bodysuit', 'crop-top', 'tank-top', 'sweater', 'cardigan', 'hoodie', 'turtleneck'],
    'bottom': ['jeans', 'trousers', 'leggings', 'joggers', 'skirt', 'shorts', 'culottes', 'wide-leg-trousers'],
    'sets': ['dress', 'jumpsuit', 'romper', 'co-ord-set', 'tracksuit'],
    'outerwear': ['coat', 'trenchcoat', 'jacket', 'bomber-jacket', 'denim-jacket', 'leather-jacket', 'blazer', 'vest'],
    'modest-wear': ['tunic', 'long-cardigan', 'abaya', 'hijab-shawl', 'long-skirt'],
    'shoes': ['sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'wedges'],
    'bags': ['handbag', 'crossbody-bag', 'backpack', 'clutch', 'tote-bag', 'fanny-pack'],
    'accessories': ['jewelry', 'scarf', 'sunglasses', 'belt', 'hat', 'beanie', 'watch']
  },
  male: {
    'top': ['t-shirt', 'shirt', 'polo-shirt', 'tank-top', 'sweater', 'cardigan', 'hoodie', 'turtleneck', 'henley-shirt'],
    'bottom': ['jeans', 'trousers', 'chino-trousers', 'joggers', 'cargo-pants', 'shorts'],
    'outerwear': ['coat', 'trenchcoat', 'jacket', 'bomber-jacket', 'denim-jacket', 'leather-jacket', 'blazer', 'vest', 'gilet'],
    'suits': ['suit-jacket', 'suit-trousers', 'waistcoat'],
    'shoes': ['sneakers', 'boots', 'sandals', 'loafers', 'classic-shoes', 'boat-shoes'],
    'bags': ['backpack', 'messenger-bag', 'briefcase', 'fanny-pack'],
    'accessories': ['sunglasses', 'belt', 'hat', 'beanie', 'watch', 'tie']
  }
};

export const ALL_SEASONS = ['spring', 'summer', 'fall', 'winter'];
export const ALL_STYLES = ['casual', 'formal', 'business', 'sportswear', 'party'];
