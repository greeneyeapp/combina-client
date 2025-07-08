// Dosya: kodlar/utils/constants.ts (GÜNCELLENMİŞ)

export interface ColorInfo {
  name: string;
  hex: string;
}

// YENİ: Uygulama genelinde kullanılacak merkezi renk paleti
export const ALL_COLORS: ColorInfo[] = [
  { name: 'black', hex: '#000000' }, { name: 'white', hex: '#FFFFFF' }, { name: 'ivory', hex: '#FFFFF0' },
  { name: 'beige', hex: '#F5F5DC' }, { name: 'cream', hex: '#FFFDD0' }, { name: 'charcoal', hex: '#36454F' },
  { name: 'gray', hex: '#808080' }, { name: 'terracotta', hex: '#E2725B' }, { name: 'lightgray', hex: '#D3D3D3' },
  { name: 'taupe', hex: '#483C32' }, { name: 'brown', hex: '#8B4513' }, { name: 'camel', hex: '#C19A6B' },
  { name: 'chocolate', hex: '#D2691E' }, { name: 'tan', hex: '#D2B48C' }, { name: 'navy', hex: '#000080' },
  { name: 'blue', hex: '#0000FF' }, { name: 'royalblue', hex: '#4169E1' }, { name: 'lightblue', hex: '#ADD8E6' },
  { name: 'skyblue', hex: '#87CEEB' }, { name: 'turquoise', hex: '#40E0D0' }, { name: 'teal', hex: '#008080' },
  { name: 'green', hex: '#008000' }, { name: 'olive', hex: '#808000' }, { name: 'khaki', hex: '#F0E68C' },
  { name: 'forestgreen', hex: '#228B22' }, { name: 'mint', hex: '#98FF98' }, { name: 'sage', hex: '#BCB88A' },
  { name: 'red', hex: '#FF0000' }, { name: 'burgundy', hex: '#800020' }, { name: 'maroon', hex: '#800000' },
  { name: 'scarlet', hex: '#FF2400' }, { name: 'purple', hex: '#800080' }, { name: 'lavender', hex: '#E6E6FA' },
  { name: 'lilac', hex: '#C8A2C8' }, { name: 'mauve', hex: '#E0B0FF' }, { name: 'pink', hex: '#FFC0CB' },
  { name: 'hotpink', hex: '#FF69B4' }, { name: 'fuchsia', hex: '#FF00FF' }, { name: 'rose', hex: '#FF007F' },
  { name: 'orange', hex: '#FFA500' }, { name: 'apricot', hex: '#FBCEB1' }, { name: 'peach', hex: '#FFE5B4' },
  { name: 'coral', hex: '#FF7F50' }, { name: 'yellow', hex: '#FFFF00' }, { name: 'gold', hex: '#FFD700' },
  { name: 'mustard', hex: '#FFDB58' }, { name: 'silver', hex: '#C0C0C0' }, { name: 'bronze', hex: '#CD7F32' }
];

// ColorPicker bileşeni için renk grupları
export const COLOR_SECTIONS = [
  {
    titleKey: 'neutrals',
    data: ['white', 'ivory', 'beige', 'cream', 'lightgray', 'gray', 'charcoal', 'black']
  },
  {
    titleKey: 'earthTones',
    data: ['brown', 'chocolate', 'tan', 'camel', 'taupe', 'khaki', 'olive', 'sage', 'terracotta']
  },
  {
    titleKey: 'coolTones',
    data: ['blue', 'navy', 'royalblue', 'lightblue', 'skyblue', 'turquoise', 'teal', 'green', 'forestgreen', 'mint', 'purple', 'lavender', 'lilac', 'mauve']
  },
  {
    titleKey: 'warmTones',
    data: ['red', 'burgundy', 'maroon', 'scarlet', 'pink', 'hotpink', 'fuchsia', 'rose', 'orange', 'apricot', 'peach', 'coral', 'yellow', 'mustard']
  },
  {
    titleKey: 'metallics',
    data: ['gold', 'silver', 'bronze']
  }
].map(section => ({
  ...section,
  // Her bölümdeki renk isimlerini tam ColorInfo nesneleriyle eşleştir
  data: section.data.map(colorName => ALL_COLORS.find(c => c.name === colorName)).filter(Boolean) as ColorInfo[]
}));


export const GENDERED_CATEGORY_HIERARCHY = {
  // --- KADIN KATEGORİLERİ ---
  female: {
    'top': ['t-shirt', 'blouse', 'shirt', 'bodysuit', 'crop-top', 'tank-top', 'sweater', 'cardigan', 'hoodie', 'turtleneck'],
    'bottom': ['jeans', 'trousers', 'leggings', 'joggers', 'skirt', 'shorts', 'culottes'],
    'sets': ['dress', 'jumpsuit', 'romper', 'co-ord-set', 'tracksuit'],
    'outerwear': ['coat', 'trenchcoat', 'jacket', 'bomber-jacket', 'denim-jacket', 'leather-jacket', 'blazer', 'vest'],
    'modest-wear': ['tunic', 'long-cardigan', 'abaya', 'hijab-shawl', 'long-skirt', 'wide-leg-trousers'],
    'beachwear': ['swimsuit', 'bikini', 'beach-dress', 'kaftan'],
    'shoes': ['sneakers', 'heels', 'boots', 'sandals', 'flats', 'loafers', 'wedges'],
    'bags': ['handbag', 'crossbody-bag', 'backpack', 'clutch', 'tote-bag', 'fanny-pack'],
    'accessories': ['jewelry', 'scarf', 'sunglasses', 'belt', 'hat', 'beanie', 'watch']
  },
  // --- ERKEK KATEGORİLERİ ---
  male: {
    'top': ['t-shirt', 'shirt', 'polo-shirt', 'tank-top', 'sweater', 'cardigan', 'hoodie', 'turtleneck', 'henley-shirt'],
    'bottom': ['jeans', 'trousers', 'chino-trousers', 'joggers', 'cargo-pants', 'shorts'],
    'outerwear': ['coat', 'trenchcoat', 'jacket', 'bomber-jacket', 'denim-jacket', 'leather-jacket', 'blazer', 'vest', 'gilet'],
    'suits': ['suit-jacket', 'suit-trousers', 'waistcoat'],
    'beachwear': ['swim-shorts'],
    'shoes': ['sneakers', 'boots', 'sandals', 'loafers', 'classic-shoes', 'boat-shoes'],
    'bags': ['backpack', 'messenger-bag', 'briefcase', 'fanny-pack'],
    'accessories': ['sunglasses', 'belt', 'hat', 'beanie', 'watch', 'tie', 'cufflinks']
  }
};

export const ALL_SEASONS = ['spring', 'summer', 'fall', 'winter'];
export const ALL_STYLES = ['casual', 'formal', 'business', 'sportswear', 'party', 'beachwear'];