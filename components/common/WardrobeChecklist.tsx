// components/common/WardrobeChecklist.tsx - iPad için daha büyük ve ekranı dolduran son hali

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Shirt, CheckCircle2, Circle, ArrowRight, Sparkles, Wind, Footprints, Split } from 'lucide-react-native';
import Button from './Button';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// DEĞİŞİKLİK: İkon boyutları artık daha büyük
const REQUIRED_CATEGORIES = [
  { key: 'top', icon: <Shirt size={isTablet ? 36 : 24} />, min: 2 },
  { key: 'bottom', icon: <Split size={isTablet ? 36 : 24} />, min: 2 },
  { key: 'outerwear', icon: <Wind size={isTablet ? 36 : 24} />, min: 2 },
  { key: 'shoes', icon: <Footprints size={isTablet ? 36 : 24} />, min: 2 },
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
        <View style={styles.contentWrapper}>
            <View style={styles.header}>
                <Sparkles color={theme.colors.primary} size={isTablet ? 64 : 32} />
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
                        <CheckCircle2 color={theme.colors.success} size={isTablet ? 36 : 24} />
                    ) : (
                        <Circle color={theme.colors.border} size={isTablet ? 36 : 24} />
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
                labelStyle={{ fontSize: isTablet ? 18 : 16 }} // Buton metnini büyüttük
                icon={<ArrowRight size={isTablet ? 22 : 18} color={theme.colors.white} />}
            />
        </View>
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
  contentWrapper: {
    width: '100%',
    maxWidth: isTablet ? 600 : undefined,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48, // Boşluğu artırdık
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: isTablet ? 40 : 24, // Büyüttük
    marginTop: 24, // Boşluğu artırdık
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 20 : 16, // Büyüttük
    textAlign: 'center',
    marginTop: 12,
    lineHeight: isTablet ? 30 : 22,
  },
  checklistContainer: {
    alignSelf: 'stretch',
    borderRadius: 20,
    padding: isTablet ? 24 : 16,
    borderWidth: 1,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isTablet ? 20 : 12, // Dikey boşluğu artırdık
  },
  iconContainer: {
    width: isTablet ? 72 : 48, // Büyüttük
    height: isTablet ? 72 : 48,
    borderRadius: isTablet ? 36 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 24, // Boşluğu artırdık
  },
  itemDetails: {
    flex: 1,
  },
  itemText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: isTablet ? 22 : 16, // Büyüttük
  },
  itemCount: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 18 : 14, // Büyüttük
    marginTop: 6,
  },
  actionButton: {
    marginTop: 48, // Boşluğu artırdık
    width: '100%',
    paddingVertical: isTablet ? 20 : 12, // Butonu büyüttük
  },
});

export default WardrobeChecklist;