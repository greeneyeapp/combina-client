// Dosya: kodlar/utils/constants.ts

export const GENDERED_CATEGORY_HIERARCHY = {
  // --- KADIN KATEGORİLERİ ---
  female: {
    'top': ['t-shirt', 'blouse', 'shirt', 'bodysuit', 'crop-top', 'tank-top', 'sweater', 'cardigan', 'hoodie', 'turtleneck'],
    'bottom': ['jeans', 'trousers', 'leggings', 'joggers', 'skirt', 'shorts', 'culottes'],
    'sets': ['dress', 'jumpsuit', 'romper', 'co-ord-set', 'tracksuit'],
    'outerwear': ['coat', 'trenchcoat', 'jacket', 'bomber-jacket', 'denim-jacket', 'leather-jacket', 'blazer', 'vest'],
    'modest-wear': ['tunic', 'long-cardigan', 'abaya', 'hijab-shawl', 'long-skirt', 'wide-leg-trousers'],
    'beachwear': ['swimsuit', 'bikini', 'beach-dress', 'kaftan'],
    // --- DEĞİŞİKLİK BURADA ---
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
    // --- DEĞİŞİKLİK BURADA ---
    'shoes': ['sneakers', 'boots', 'sandals', 'loafers', 'classic-shoes', 'boat-shoes'],
    'bags': ['backpack', 'messenger-bag', 'briefcase', 'fanny-pack'],
    'accessories': ['sunglasses', 'belt', 'hat', 'beanie', 'watch', 'tie', 'cufflinks']
  }
};

// Eski kodların geçiş sürecinde bozulmaması için varsayılan bir hiyerarşi
export const CATEGORY_HIERARCHY = GENDERED_CATEGORY_HIERARCHY.female;

// ... (dosyanın geri kalanı aynı)
export const ALL_COLORS = [ /* ... */ ];
export const ALL_SEASONS = ['spring', 'summer', 'fall', 'winter'];
export const ALL_STYLES = ['casual', 'formal', 'business', 'sportswear', 'party', 'beachwear'];
