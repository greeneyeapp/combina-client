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
  { name: 'snakeskin', hex: 'pattern_snakeskin' },
  { name: 'striped', hex: 'pattern_striped' },
  { name: 'plaid', hex: 'pattern_plaid' },
  { name: 'floral', hex: 'pattern_floral' },
  { name: 'polka-dot', hex: 'pattern_polka_dot' },
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
    // KADIN KATEGORİLERİ (Yazlıktan Kışlığa Sıralı)
    'top': [
      'bralette', 'tank-top', 'crop-top', 'bodysuit', 't-shirt', 'blouse',
      'shirt', 'tunic', 'vest', 'track-top', 'sweatshirt', 'hoodie', // GÜNCELLENDİ: track-top ortaya alındı
      'pullover', 'sweater'
    ],
    'bottom': [
      'mini-skirt', 'denim-shorts', 'fabric-shorts', 'athletic-shorts', 'bermuda-shorts',
      'midi-skirt', 'long-skirt', 'leggings', 'track-bottom', 'linen-trousers', // GÜNCELLENDİ: track-bottom ortaya alındı
      'jeans', 'trousers'
    ],
    'dresses-jumpsuits': [
      'romper', 'sporty-dress', 'casual-dress', 'modest-dress', 'jumpsuit',
      'evening-dress', 'modest-evening-dress'
    ],
    'outerwear': [
      'blazer', 'denim-jacket', 'fabric-jacket', 'bomber-jacket', 'leather-jacket',
      'raincoat', 'trenchcoat', 'cardigan', 'abaya', 'coat',
      'overcoat', 'puffer-coat'
    ],
    'shoes': [
      'slippers', 'sandals', 'flats', 'heels', 'sneakers',
      'casual-sport-shoes', 'loafers',
      'boots', 'tall-boots'
    ],
    'bags': [
      'handbag', 'backpack', 'shoulder-bag', 'briefcase'
    ],
    'accessories': [
      'sunglasses', 'ring', 'bracelet', 'earrings', 'necklace', 'belt',
      'watch', 'hat', 'hijab', 'scarf', 'shawl'
    ]
  },
  male: {
    // ERKEK KATEGORİLERİ (Yazlıktan Kışlığa Sıralı)
    'top': [
      'tank-top', 't-shirt', 'polo-shirt', 'shirt', 'vest', 'track-top', // GÜNCELLENDİ: track-top ortaya alındı
      'sweatshirt', 'hoodie', 'pullover', 'sweater'
    ],
    'bottom': [
      'athletic-shorts', 'denim-shorts', 'fabric-shorts', 'bermuda-shorts',
      'capri-pants', 'track-bottom', 'linen-trousers', 'jeans', 'trousers' // GÜNCELLENDİ: track-bottom ortaya alındı
    ],
    'outerwear': [
      'cardigan', 'denim-jacket', 'fabric-jacket', 'leather-jacket', 'raincoat',
      'trenchcoat', 'coat', 'overcoat', 'puffer-coat'
    ],
    'suits': [
      'suit-jacket', 'suit-trousers', 'blazer', 'tuxedo'
    ],
    'shoes': [
      'slippers', 'sandals', 'sneakers', 'casual-sport-shoes', 'loafers',
      'classic-shoes', 'boots'
    ],
    'bags': [
      'crossbody-bag', 'backpack', 'shoulder-bag', 'briefcase'
    ],
    'accessories': [
      'sunglasses', 'ring', 'bracelet', 'earrings', 'necklace', 'belt',
      'watch', 'hat', 'tie'
    ]
  }
};

export const ALL_SEASONS = ['spring', 'summer', 'fall', 'winter'];
export const ALL_STYLES = [
  'classic',
  'smart_casual',
  'casual',
  'bohemian',
  'minimalist',
  'vintage',
  'gothic',
  'party',
  'sportswear'
];