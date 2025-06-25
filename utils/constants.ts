// Dosya: kodlar/utils/constants.ts (TAM KOD)

/**
 * CİNSİYETE GÖRE KATEGORİ HİYERARŞİSİ
 * Uygulamadaki tüm kategori mantığı bu obje üzerinden yönetilecektir.
 */
export const GENDERED_CATEGORY_HIERARCHY = {
  // --- KADIN KATEGORİLERİ ---
  female: {
    'top': ['t-shirt', 'blouse', 'shirt', 'bodysuit', 'crop-top', 'tank-top', 'sweater', 'cardigan', 'hoodie', 'turtleneck'],
    'bottom': ['jeans', 'trousers', 'leggings', 'joggers', 'skirt', 'shorts', 'culottes'],
    'sets': ['dress', 'jumpsuit', 'romper', 'co-ord-set', 'tracksuit'], // 'sets' anahtar kelimesi daha kapsayıcı
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

// Eski kodların geçiş sürecinde bozulmaması için varsayılan bir hiyerarşi
export const CATEGORY_HIERARCHY = GENDERED_CATEGORY_HIERARCHY.female;

/**
 * TÜM RENKLERİN MERKEZİ LİSTESİ
 * ColorPicker ve FilterModal bu listeyi kullanacak.
 */
export const ALL_COLORS = [
  { name: 'white', hex: '#FFFFFF' }, { name: 'ivory', hex: '#FFFFF0' }, { name: 'lightgray', hex: '#D3D3D3' }, 
  { name: 'gray', hex: '#808080' }, { name: 'charcoal', hex: '#36454F' }, { name: 'black', hex: '#000000' },
  { name: 'red', hex: '#FF0000' }, { name: 'burgundy', hex: '#800020' }, { name: 'maroon', hex: '#800000' }, 
  { name: 'scarlet', hex: '#FF2400' }, { name: 'coral', hex: '#FF7F50' }, { name: 'orange', hex: '#FFA500' }, 
  { name: 'peach', hex: '#FFE5B4' }, { name: 'rose', hex: '#FFC0CB' }, { name: 'hotpink', hex: '#FF69B4' }, 
  { name: 'fuchsia', hex: '#FF00FF' }, { name: 'yellow', hex: '#FFFF00' }, { name: 'mustard', hex: '#FFDB58' },
  { name: 'blue', hex: '#0000FF' }, { name: 'navy', hex: '#000080' }, { name: 'royalblue', hex: '#4169E1' }, 
  { name: 'skyblue', hex: '#87CEEB' }, { name: 'turquoise', hex: '#40E0D0' }, { name: 'teal', hex: '#008080' },
  { name: 'green', hex: '#008000' }, { name: 'forestgreen', hex: '#228B22' }, { name: 'mint', hex: '#98FF98' },
  { name: 'purple', hex: '#800080' }, { name: 'lavender', hex: '#E6E6FA' }, { name: 'lilac', hex: '#C8A2C8' },
  { name: 'mauve', hex: '#E0B0FF' }, { name: 'beige', hex: '#F5F5DC' }, { name: 'cream', hex: '#FFFDD0' }, 
  { name: 'tan', hex: '#D2B48C' }, { name: 'camel', hex: '#C19A6B' }, { name: 'brown', hex: '#8B4513' }, 
  { name: 'chocolate', hex: '#D2691E' }, { name: 'taupe', hex: '#483C32' }, { name: 'khaki', hex: '#C3B091' }, 
  { name: 'olive', hex: '#808000' }, { name: 'sage', hex: '#BCB88A' }, { name: 'terracotta', hex: '#E2725B' },
  { name: 'gold', hex: '#FFD700' }, { name: 'silver', hex: '#C0C0C0' }, { name: 'bronze', hex: '#CD7F32' },
];

/**
 * TÜM SEZONLARIN MERKEZİ LİSTESİ
 */
export const ALL_SEASONS = ['spring', 'summer', 'fall', 'winter'];

/**
 * TÜM STİLLERİN MERKEZİ LİSTESİ
 */
export const ALL_STYLES = ['casual', 'formal', 'business', 'sportswear', 'party', 'beachwear'];