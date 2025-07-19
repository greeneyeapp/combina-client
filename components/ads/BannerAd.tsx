import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { admobConfig } from '@/utils/admobUtils';
import { useRevenueCat } from '@/context/RevenueCatContext';

interface BannerAdProps {
  size?: BannerAdSize;
}

const bannerAdUnitId = admobConfig.banner as string;

export const CustomBannerAd: React.FC<BannerAdProps> = ({ size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER }) => {
  const { currentPlan, isLoading } = useRevenueCat();

  // ✅ DÜZELTME: Sadece kesin olarak premium olduğunda reklamı gizle
  // Loading sırasında free user varsay ve reklamı göster
  if (currentPlan === 'premium') {
    return null;
  }

  // Free user veya loading durumunda reklamı göster
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={bannerAdUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
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
    minHeight: 50, 
  },
});