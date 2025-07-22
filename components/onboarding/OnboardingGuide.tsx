// components/onboarding/OnboardingGuide.tsx - iPad için büyütülmüş ve orantılı tasarım

import React, { useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, SafeAreaView, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import { Shirt, Lightbulb, History, Sparkles, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');
// YENİ: iPad tespiti
const isTablet = width >= 768;

const OnboardingGuide: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { showOnboarding, finishOnboarding } = useOnboardingStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // DEĞİŞİKLİK: İkon boyutları tablet için büyütüldü
  const iconSize = isTablet ? 120 : 80;

  const steps = [
    {
      icon: <Sparkles size={iconSize} color={theme.colors.primary} />,
      title: t('onboarding.step1.title', 'Welcome to Your AI Stylist!'),
      text: t('onboarding.step1.text', 'Let\'s take a quick tour to see how you can get the most out of your wardrobe.'),
    },
    {
      icon: <Shirt size={iconSize} color={theme.colors.primary} />,
      title: t('onboarding.step2.title', 'Build Your Digital Wardrobe'),
      text: t('onboarding.step2.text', 'Tap the "Wardrobe" tab and start adding your clothes. The more you add, the better your suggestions!'),
    },
    {
      icon: <Lightbulb size={iconSize} color={theme.colors.primary} />,
      title: t('onboarding.step3.title', 'Get Instant Outfit Ideas'),
      text: t('onboarding.step3.text', 'Go to the "Outfits" tab, choose an occasion, and let our AI create the perfect combination for you.'),
    },
    {
      icon: <Heart size={iconSize} color={theme.colors.primary} />,
      title: t('onboarding.step4.title', 'Save Your Favorites!'),
      text: t('onboarding.step4.text', 'Generated an outfit you love? Tap the heart icon to save it. Important: Unsaved suggestions will be lost forever!'),
    },
    {
      icon: <History size={iconSize} color={theme.colors.primary} />,
      title: t('onboarding.step5.title', 'Track Your Style'),
      text: t('onboarding.step5.text', 'All your saved outfits are kept in your "History" tab. Never forget a great look again.'),
    },
  ];

  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };
  
  const onScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(newIndex);
  };

  if (!showOnboarding) {
    return null;
  }

  const renderSlide = ({ item }: { item: typeof steps[0] }) => (
    <View style={styles.slide}>
      <View style={styles.iconContainer}>{item.icon}</View>
      <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
      <Text style={[styles.text, { color: theme.colors.textLight }]}>{item.text}</Text>
    </View>
  );

  return (
    <Modal animationType="fade" transparent={false} visible={showOnboarding}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textLight }]}>{t('onboarding.skip', 'Skip')}</Text>
        </TouchableOpacity>
        <FlatList
          ref={flatListRef}
          data={steps}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          onMomentumScrollEnd={onScroll}
          decelerationRate="fast"
        />
        <View style={styles.footer}>
          <View style={styles.dotsContainer}>
            {steps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === currentIndex ? theme.colors.primary : theme.colors.border }
                ]}
              />
            ))}
          </View>
          <Button
            label={currentIndex === steps.length - 1 ? t('onboarding.finish', "Let's Go!") : t('onboarding.next', 'Next')}
            onPress={handleNext}
            variant="primary"
            style={styles.nextButton}
            // YENİ: Buton boyutu tablet için büyütüldü
            size={isTablet ? 'large' : 'medium'}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: isTablet ? 80 : 60, // Boşluk artırıldı
    right: isTablet ? 48 : 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: isTablet ? 18 : 16, // Büyüdü
  },
  slide: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    // YENİ: Tablette içeriğin genişliğini sınırlıyoruz
    paddingHorizontal: isTablet ? '15%' : 32,
  },
  iconContainer: {
    marginBottom: isTablet ? 64 : 48, // Boşluk artırıldı
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: isTablet ? 42 : 28, // Büyüdü
    textAlign: 'center',
    marginBottom: isTablet ? 24 : 16,
  },
  text: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 20 : 16, // Büyüdü
    textAlign: 'center',
    lineHeight: isTablet ? 32 : 24, // Satır aralığı arttı
  },
  footer: {
    height: isTablet ? 200 : 150, // Yükseklik artırıldı
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: isTablet ? 32 : 24,
  },
  dot: {
    width: isTablet ? 12 : 10, // Büyüdü
    height: isTablet ? 12 : 10,
    borderRadius: isTablet ? 6 : 5,
    marginHorizontal: 8,
  },
  nextButton: {
    width: '100%',
    maxWidth: isTablet ? 400 : undefined, // Buton genişliği sınırlandı
  },
});

export default OnboardingGuide;