// kodlar/components/ads/BannerAd.tsx - Premium kontrolü ile güncellendi

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { admobConfig } from '@/utils/admobUtils';
// 1. DEĞİŞİKLİK: Abonelik durumunu kontrol etmek için hook'u import et
import { useRevenueCat } from '@/context/RevenueCatContext';

interface BannerAdProps {
  size?: BannerAdSize;
}

const bannerAdUnitId = admobConfig.banner as string;

export const CustomBannerAd: React.FC<BannerAdProps> = ({ size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }) => {
  // 2. DEĞİŞİKLİK: Kullanıcının mevcut planını ve yüklenme durumunu al
  const { currentPlan, isLoading } = useRevenueCat();

  // 3. DEĞİŞİKLİK: Premium kullanıcılar için reklamı gösterme
  // Plan bilgisi yükleniyorsa veya kullanıcı premium ise, hiçbir şey gösterme (null dön)
  if (isLoading || currentPlan === 'premium') {
    return null;
  }

  // Reklamı sadece 'free' plana sahip kullanıcılara göster
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={bannerAdUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          // Reklam yüklenemezse konsola hata bas, ama uygulamayı çökertme
          console.error('Banner Ad Failed to Load:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    // Reklamın yüksekliği kadar bir alan ayırarak layout kaymalarını önleyebiliriz.
    // Adaptive banner için bu dinamik olabilir, şimdilik bu şekilde bırakalım.
    minHeight: 50, 
  },
});