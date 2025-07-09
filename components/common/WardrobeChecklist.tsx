// Dosya: components/common/WardrobeChecklist.tsx (GÜNCELLENMİŞ)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
// 1. YENİ İKONLAR EKLENDİ
import { Shirt, CheckCircle2, Circle, ArrowRight, Sparkles, Wind, Footprints, Split } from 'lucide-react-native';
import Button from './Button';

// 2. HER KATEGORİ İÇİN ÖZEL İKONLAR ATANDI
const REQUIRED_CATEGORIES = [
  { key: 'top', icon: <Shirt size={24} />, min: 2 },
  { key: 'bottom', icon: <Split size={24} />, min: 2 },
  { key: 'outerwear', icon: <Wind size={24} />, min: 2 },
  { key: 'shoes', icon: <Footprints size={24} />, min: 2 },
];

interface WardrobeChecklistProps {
  counts: Record<string, number>;
  onButtonPress: () => void;
}

const WardrobeChecklist: React.FC<WardrobeChecklistProps> = ({ counts, onButtonPress }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles color={theme.colors.primary} size={32} />
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {t('suggestions.checklist.title', 'Complete Your Wardrobe')}
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textLight }]}>
          {t('suggestions.checklist.subtitle', 'You just need a few more key pieces for great outfit suggestions.')}
        </Text>
      </View>

      <View style={[styles.checklistContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        {REQUIRED_CATEGORIES.map(({ key, icon, min }) => {
          const currentCount = counts[key] || 0;
          const isComplete = currentCount >= min;
          return (
            <View key={key} style={styles.checklistItem}>
              <View style={[styles.iconContainer, { backgroundColor: isComplete ? theme.colors.successLight : theme.colors.border }]}>
                {/* İkon artık dinamik olarak geliyor */}
                {React.cloneElement(icon, { color: isComplete ? theme.colors.success : theme.colors.textLight })}
              </View>
              <View style={styles.itemDetails}>
                <Text style={[styles.itemText, { color: theme.colors.text }]}>
                  {t(`categories.${key}`)}
                </Text>
                <Text style={[styles.itemCount, { color: theme.colors.textLight }]}>
                  {t('suggestions.checklist.progress', { current: currentCount, total: min })}
                </Text>
              </View>
              {isComplete ? (
                <CheckCircle2 color={theme.colors.success} size={24} />
              ) : (
                <Circle color={theme.colors.border} size={24} />
              )}
            </View>
          );
        })}
      </View>

      <Button
        label={t('suggestions.addMoreItems')}
        onPress={onButtonPress}
        variant="primary"
        style={styles.actionButton}
        icon={<ArrowRight size={18} color={theme.colors.white} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  checklistContainer: {
    alignSelf: 'stretch',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemDetails: {
    flex: 1,
  },
  itemText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
  },
  itemCount: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    marginTop: 4,
  },
  actionButton: {
    marginTop: 32,
    width: '100%',
  },
});

export default WardrobeChecklist;