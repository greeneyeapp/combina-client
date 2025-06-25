// Dosya: kodlar/components/onboarding/OnboardingGuide.tsx (TAMAMEN DEĞİŞTİRİN)

import React, { useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, SafeAreaView, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/Button';
import { Shirt, Lightbulb, History, Sparkles, Heart } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const OnboardingGuide: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { showOnboarding, finishOnboarding } = useOnboardingStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const steps = [
    {
      icon: <Sparkles size={80} color={theme.colors.primary} />,
      title: t('onboarding.step1.title', 'Welcome to Your AI Stylist!'),
      text: t('onboarding.step1.text', 'Let\'s take a quick tour to see how you can get the most out of your wardrobe.'),
    },
    {
      icon: <Shirt size={80} color={theme.colors.primary} />,
      title: t('onboarding.step2.title', 'Build Your Digital Wardrobe'),
      text: t('onboarding.step2.text', 'Tap the "Wardrobe" tab and start adding your clothes. The more you add, the better your suggestions!'),
    },
    {
      icon: <Lightbulb size={80} color={theme.colors.primary} />,
      title: t('onboarding.step3.title', 'Get Instant Outfit Ideas'),
      text: t('onboarding.step3.text', 'Go to the "Outfits" tab, choose an occasion, and let our AI create the perfect combination for you.'),
    },
    {
      icon: <Heart size={80} color={theme.colors.primary} />,
      title: t('onboarding.step4.title', 'Save Your Favorites!'),
      text: t('onboarding.step4.text', 'Generated an outfit you love? Tap the heart icon to save it. Important: Unsaved suggestions will be lost forever!'),
    },
    {
      icon: <History size={80} color={theme.colors.primary} />,
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
        {/* Skip Butonu */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: theme.colors.textLight }]}>{t('onboarding.skip', 'Skip')}</Text>
        </TouchableOpacity>

        {/* Kaydırılabilir Adımlar */}
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

        {/* Alt Kısım: Noktalar ve Buton */}
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
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  slide: {
    width: width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 48,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  text: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  nextButton: {
    width: '100%',
  },
});

export default OnboardingGuide;