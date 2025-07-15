// kodlar/hooks/useRewardedAd.ts - Reklamın yeniden yüklenmesi sorunu düzeltildi

import { useEffect, useState, useRef } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  AdLoadError,
} from 'react-native-google-mobile-ads';
import { admobConfig } from '@/utils/admobUtils';

const rewardedAdUnitId = admobConfig.rewarded as string;

export const useRewardedAd = () => {
  // Reklam nesnesini useRef ile saklayarak component re-render'larından etkilenmemesini sağlıyoruz.
  const adRef = useRef<RewardedAd | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEarned, setIsEarned] = useState(false);
  const [isClosed, setIsClosed] = useState(false); // Bu state, reklamın kapandığını UI'a bildirmek için kalabilir.
  const [error, setError] = useState<AdLoadError | null>(null);

  const loadAd = () => {
    if (adRef.current) {
      console.log('🔄 Requesting new rewarded ad...');
      adRef.current.load();
    }
  };
  
  useEffect(() => {
    // Component ilk yüklendiğinde reklam nesnesini oluştur.
    const rewardedAd = RewardedAd.createForAdRequest(rewardedAdUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
    adRef.current = rewardedAd;

    const adLoadedListener = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setIsLoaded(true);
      setError(null);
      console.log('✅ Rewarded Ad Loaded and ready to be shown.');
    });

    const adErrorListener = rewardedAd.addAdEventListener(AdEventType.ERROR, (err) => {
      setError(err);
      setIsLoaded(false);
      console.error('❌ Rewarded Ad Error:', err);
    });

    const rewardListener = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('✅ User earned reward of', reward);
        setIsEarned(true);
      }
    );

    const adClosedListener = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('🚪 Rewarded Ad Closed. Requesting next ad...');
      // State'leri sıfırla ve YENİ BİR REKLAM İSTE.
      setIsLoaded(false);
      setIsEarned(false); // Ödül state'ini bir sonraki reklam için sıfırla
      setIsClosed(true); // UI'ın bilmesi için
      loadAd(); // Mevcut reklam nesnesi üzerinden yeni bir reklam yükle
    });

    // İlk reklamı yükle
    loadAd();

    // Cleanup fonksiyonu
    return () => {
      adLoadedListener();
      adErrorListener();
      rewardListener();
      adClosedListener();
      adRef.current = null; // Bellek sızıntılarını önlemek için referansı temizle
    };
  }, []); // Bu useEffect sadece bir kez çalışır.

  const show = () => {
    if (adRef.current && isLoaded) {
      adRef.current.show();
    } else {
      console.warn('Tried to show ad, but it was not loaded.');
    }
  };

  return {
    show,
    isLoaded,
    isEarned,
    isClosed,
    error,
  };
};