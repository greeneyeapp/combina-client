// app/(tabs)/history/index.tsx - iPad için genişletilmiş ve ortalanmış tek sütunlu liste

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useOutfitStore, Outfit } from '@/store/outfitStore';
import { useClothingStore } from '@/store/clothingStore';
import HeaderBar from '@/components/common/HeaderBar';
import EmptyState from '@/components/common/EmptyState';
import OutfitHistoryItem from '@/components/history/OutfitHistoryItem';
import { groupOutfitsByDate } from '@/utils/dateUtils';
import { router } from 'expo-router';
import useAlertStore from '@/store/alertStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Trash2, AlertTriangle, Calendar, Sparkles, Heart, Star } from 'lucide-react-native';
import { CustomBannerAd } from '@/components/ads/BannerAd';
import { BannerAdSize } from 'react-native-google-mobile-ads';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

type ListItem = ExtendedOutfit | { type: 'AD'; id: string };

interface Section {
  title: string;
  data: ListItem[]; // Veri tipi tek boyutlu diziye geri döndü
}

interface ExtendedOutfit extends Outfit {
  availableItemsCount: number;
  totalItemsCount: number;
  hasAllItems: boolean;
}

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { outfits, removeOutfit } = useOutfitStore();
  const { clothing } = useClothingStore();
  const { show: showAlert } = useAlertStore();
  const [deleteAnimations] = useState(new Map<string, Animated.Value>());

  const outfitsWithValidation = useMemo(() => {
    return outfits.map(outfit => {
      const availableItems = outfit.items.filter(itemId => clothing.some(c => c.id === itemId));
      return {
        ...outfit,
        availableItemsCount: availableItems.length,
        totalItemsCount: outfit.items.length,
        hasAllItems: availableItems.length === outfit.items.length
      } as ExtendedOutfit;
    });
  }, [outfits, clothing]);

  const sections: Section[] = useMemo(() => {
    const groupedOutfits = groupOutfitsByDate(outfitsWithValidation, i18n.language, t);
    const sectionsWithAds: Section[] = [];
    
    groupedOutfits.forEach(group => {
      const newSectionData: ListItem[] = [];
      let outfitCounter = 0;
      group.data.forEach(outfit => {
        newSectionData.push(outfit as ExtendedOutfit);
        outfitCounter++;
        if (outfitCounter % 2 === 0) {
          newSectionData.push({ type: 'AD', id: `ad-${outfitCounter}` });
        }
      });
      sectionsWithAds.push({ title: group.title, data: newSectionData });
    });
    return sectionsWithAds;
  }, [outfitsWithValidation, i18n.language, t]);

  const getDeleteAnimation = (id: string) => {
    if (!deleteAnimations.has(id)) {
      deleteAnimations.set(id, new Animated.Value(1));
    }
    return deleteAnimations.get(id)!;
  };

  const handleDelete = (id: string) => {
    showAlert({
      title: t('history.deleteTitle'), message: t('history.deleteMessage'),
      buttons: [
        { text: t('common.cancel'), onPress: () => {}, variant: 'outline' },
        {
          text: t('common.delete'),
          onPress: () => {
            const anim = getDeleteAnimation(id);
            Animated.timing(anim, {
              toValue: 0, duration: 300, useNativeDriver: true,
            }).start(() => {
              removeOutfit(id);
              deleteAnimations.delete(id);
            });
          },
          variant: 'destructive',
        },
      ],
    });
  };

  const getCardStyle = (outfit: ExtendedOutfit) => {
    const baseStyle = [styles.card, { backgroundColor: theme.colors.card }];
    if (!outfit.hasAllItems) {
      return [...baseStyle, { borderColor: theme.colors.warning, borderWidth: 1, borderStyle: 'dashed' as const, backgroundColor: theme.mode === 'dark' ? 'rgba(237, 137, 54, 0.1)' : 'rgba(251, 240, 234, 0.8)' }];
    }
    return baseStyle;
  };

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <LinearGradient colors={theme.mode === 'dark' ? [theme.colors.background, theme.colors.card] : [theme.colors.primaryLight, theme.colors.background]} style={styles.sectionHeaderContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
      <View style={styles.sectionHeaderContent}>
        <Calendar size={isTablet ? 22 : 18} color={theme.colors.primary} />
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{title}</Text>
        <Sparkles size={isTablet ? 20 : 16} color={theme.colors.accent} />
      </View>
    </LinearGradient>
  );

  const renderItem = ({ item }: { item: ListItem }) => {
    if ('type' in item && item.type === 'AD') {
      return (
        <View style={styles.adContainer}>
          <CustomBannerAd size={BannerAdSize.MEDIUM_RECTANGLE} />
        </View>
      );
    }
    const outfit = item as ExtendedOutfit;
    const anim = getDeleteAnimation(outfit.id);
    const tipColor = theme.colors.accent;
    return (
      <Animated.View style={[{ opacity: anim, transform: [{ scale: anim }] }]}>
        <LinearGradient
          colors={theme.mode === 'dark' ? [theme.colors.card, theme.colors.background] : [theme.colors.background, theme.colors.card]}
          style={[getCardStyle(outfit), { shadowColor: theme.mode === 'dark' ? '#000' : theme.colors.text }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.occasionContainer}>
                <View style={[styles.occasionDot, { backgroundColor: theme.colors.primary }]} />
                <Text style={[styles.occasion, { color: theme.colors.text }]}>{t(`occasions.${outfit.occasion}`)} • {t(`weather.${outfit.weather}`)}</Text>
              </View>
              {!outfit.hasAllItems && (
                <View style={[styles.warningContainer, { backgroundColor: theme.mode === 'dark' ? 'rgba(237, 137, 54, 0.2)' : 'rgba(251, 240, 234, 1)' }]}>
                  <AlertTriangle color={theme.colors.warning} size={14} />
                  <Text style={[styles.warningText, { color: theme.colors.warning }]}>{t('history.missingItems', { missing: outfit.totalItemsCount - outfit.availableItemsCount, total: outfit.totalItemsCount })}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => handleDelete(outfit.id)} style={[styles.deleteButton, { backgroundColor: theme.colors.errorLight }]} activeOpacity={0.7}>
              <Trash2 color={theme.colors.error} size={isTablet ? 22 : 18} />
            </TouchableOpacity>
          </View>
          <View style={styles.outfitContent}><OutfitHistoryItem outfit={outfit} /></View>
          <Text style={[styles.description, { color: theme.colors.text }]}>{outfit.description}</Text>
          {outfit.suggestion_tip && (
            <LinearGradient colors={theme.mode === 'dark' ? ['rgba(241, 201, 59, 0.15)', 'rgba(241, 201, 59, 0.05)'] : ['rgba(241, 201, 59, 0.3)', 'rgba(241, 201, 59, 0.1)']} style={styles.tipContainer} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.tipHeader}><Star size={isTablet ? 16 : 14} color={tipColor} fill={tipColor} /><Text style={[styles.tipLabel, { color: tipColor }]}>{t('suggestions.stylingTip')}</Text></View>
              <Text style={[styles.suggestionTip, { color: theme.colors.text }]}>{outfit.suggestion_tip}</Text>
            </LinearGradient>
          )}
          <View style={[styles.decorativeElement, styles.topRight]}><Heart size={12} color={theme.colors.primary} fill={theme.colors.primary} /></View>
          {!outfit.hasAllItems && (<View style={[styles.decorativeElement, styles.bottomLeft]}><AlertTriangle size={10} color={theme.colors.warning} /></View>)}
        </LinearGradient>
      </Animated.View>
    );
  };

  if (outfits.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title={t('history.title')} />
        <LinearGradient colors={[theme.colors.background, theme.colors.primaryLight]} style={styles.emptyContainer}>
          <EmptyState icon="history" title={t('history.emptyTitle')} message={t('history.emptyMessage')} buttonText={t('history.generateOutfit')} onButtonPress={() => router.push('/suggestions')} />
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('history.title')} />
      {/* YENİ: Listeyi ortalamak ve genişliğini sınırlamak için sarmalayıcı */}
      <View style={styles.listWrapper}>
          <SectionList
            sections={sections}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // YENİ: Liste için sarmalayıcı stil
  listWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    maxWidth: isTablet ? 800 : undefined,
  },
  emptyContainer: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  sectionHeaderContainer: { borderRadius: 12, marginBottom: 16, overflow: 'hidden' },
  sectionHeaderContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: isTablet ? 16 : 12, paddingHorizontal: 16, gap: 8,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: isTablet ? 24 : 18,
    flex: 1, textAlign: 'center',
  },
  card: {
    borderRadius: 20, padding: isTablet ? 24 : 20, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 6,
    position: 'relative', overflow: 'hidden', flex: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerLeft: { flex: 1, marginRight: 12 },
  occasionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  occasionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  occasion: { fontFamily: 'Montserrat-Bold', fontSize: isTablet ? 17 : 15 },
  warningContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  warningText: { fontFamily: 'Montserrat-Medium', fontSize: isTablet ? 13 : 11 },
  deleteButton: {
    width: isTablet ? 48 : 40, height: isTablet ? 48 : 40,
    borderRadius: isTablet ? 24 : 20,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15,
    shadowRadius: 4, elevation: 4,
  },
  outfitContent: { marginBottom: 16 },
  description: {
    marginBottom: 12, fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 16 : 14, lineHeight: isTablet ? 26 : 22,
  },
  tipContainer: { borderRadius: 12, padding: isTablet ? 16 : 12, marginTop: 8 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  tipLabel: {
    fontFamily: 'Montserrat-SemiBold', fontSize: isTablet ? 13 : 11,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  suggestionTip: {
    fontFamily: 'PlayfairDisplay-Italic',
    fontSize: isTablet ? 15 : 13,
    lineHeight: isTablet ? 24 : 20,
    fontStyle: 'italic',
  },
  decorativeElement: { position: 'absolute' },
  topRight: { top: 12, right: 60 },
  bottomLeft: { bottom: 12, left: 12 },
  adContainer: {
    marginVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});