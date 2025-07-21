// hooks/useRewardedAd.ts - Premium kullanıcılar için reklam yüklemeyi durduracak şekilde güncellendi.

import { useEffect, useState, useRef } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  AdLoadError,
} from 'react-native-google-mobile-ads';
import { admobConfig } from '@/utils/admobUtils';
import { useRevenueCat } from '@/context/RevenueCatContext'; // 1. RevenueCat hook'unu import et

const rewardedAdUnitId = admobConfig.rewarded as string;

export const useRewardedAd = () => {
  // 2. Kullanıcının güncel planını RevenueCat'ten al
  const { currentPlan } = useRevenueCat(); 

  const adRef = useRef<RewardedAd | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isEarned, setIsEarned] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [error, setError] = useState<AdLoadError | null>(null);

  // 3. Reklam yükleme fonksiyonu artık planı kontrol ediyor
  const loadAd = () => {
    // Premium kullanıcılar için reklam yükleme
    if (currentPlan === 'premium') {
      console.log('👑 Premium user, skipping rewarded ad load.');
      // Eğer bir reklam nesnesi varsa ve yüklenmişse, onu temizle
      if (adRef.current && isLoaded) {
        setIsLoaded(false);
      }
      return;
    }
    
    if (adRef.current) {
      console.log('🔄 Requesting new rewarded ad...');
      adRef.current.load();
    }
  };
  
  // 4. Ana useEffect artık plan değişikliklerine de duyarlı
  useEffect(() => {
    // Eğer kullanıcı premium ise, hiçbir şey yapma.
    if (currentPlan === 'premium') {
      console.log('👑 Premium plan active, rewarded ad hook is disabled.');
      // Mevcut reklam state'ini temizle
      setIsLoaded(false);
      adRef.current = null;
      return; // Fonksiyondan çık, listener'ları kurma.
    }

    console.log('🚀 Initializing rewarded ad for free user...');
    
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
      setIsLoaded(false);
      setIsEarned(false);
      setIsClosed(true); 
      loadAd(); // Yeni reklam iste
    });

    // İlk reklamı yükle
    loadAd();

    // Cleanup fonksiyonu
    return () => {
      // Listener'ları güvenli bir şekilde kaldır
      adLoadedListener?.();
      adErrorListener?.();
      rewardListener?.();
      adClosedListener?.();
      adRef.current = null;
    };
  }, [currentPlan]); // Dependency array'e 'currentPlan' eklendi.

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