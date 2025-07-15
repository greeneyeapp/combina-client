
import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

const adUnitIds = {
  // Gerçek ID'leriniz
  production: {
    banner: Platform.select({
      ios: 'ca-app-pub-5658124024438456/9482275717', //
      android: 'ca-app-pub-5658124024438456/9231133892', //
    }),
    rewarded: Platform.select({
      ios: 'ca-app-pub-5658124024438456/9578690915', //
      android: 'ca-app-pub-5658124024438456/3452432786', //
    }),
  },
  // Geliştirme için Test ID'leri
  development: {
    banner: TestIds.BANNER,
    rewarded: TestIds.REWARDED,
  },
};

// Geliştirme ortamında test ID'lerini, production'da gerçek ID'leri kullan
export const admobConfig = __DEV__ ? adUnitIds.development : adUnitIds.production;