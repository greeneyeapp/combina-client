// Dosya: kodlar/app/(tabs)/history/index.tsx (TAM KOD)

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useOutfitStore, Outfit } from '@/store/outfitStore';
import HeaderBar from '@/components/common/HeaderBar';
import EmptyState from '@/components/common/EmptyState';
import OutfitHistoryItem from '@/components/history/OutfitHistoryItem';
import { groupOutfitsByDate } from '@/utils/dateUtils';
import { router } from 'expo-router';
import useAlertStore from '@/store/alertStore';
import { Trash2 } from 'lucide-react-native';

interface Section {
  title: string;
  data: Outfit[];
}

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { outfits, removeOutfit } = useOutfitStore();
  const { show: showAlert } = useAlertStore();

  const sections: Section[] = useMemo(
    () => groupOutfitsByDate(outfits, i18n.language, t),
    [outfits, i18n.language, t]
  );

  const handleDelete = (id: string) => {
    showAlert({
      title: t('history.deleteTitle'),
      message: t('history.deleteMessage'),
      buttons: [
        { text: t('common.cancel'), onPress: () => {}, variant: 'outline' },
        {
          text: t('common.delete'),
          onPress: () => removeOutfit(id),
          variant: 'destructive',
        },
      ],
    });
  };

  if (outfits.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar title={t('history.title')} />
        <EmptyState
          icon="history"
          title={t('history.emptyTitle')}
          message={t('history.emptyMessage')}
          buttonText={t('history.generateOutfit')}
          onButtonPress={() => router.push('/suggestions')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('history.title')} />
      
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
        )}
        renderItem={({ item }) => {
          // ---- RENK KONTROLÜ BURADA YAPILIYOR ----
          // Açık tema ise daha koyu bir 'warning' rengi, koyu tema ise parlak 'accent' rengi kullan.
          const tipColor = theme.mode === 'light' ? theme.colors.warning : theme.colors.accent;

          return (
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.occasion, { color: theme.colors.text }]}>
                  {t(`occasions.${item.occasion}`)} • {t(`weather.${item.weather}`)}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Trash2 color={theme.colors.error} size={20} />
                </TouchableOpacity>
              </View>
              <OutfitHistoryItem outfit={item} />
              <Text style={[styles.description, { color: theme.colors.textLight }]}>
                {item.description}
              </Text>
              {item.suggestion_tip && (
                 <Text style={[styles.suggestionTip, { color: tipColor }]}>
                    💡 {item.suggestion_tip}
                 </Text>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    marginTop: 24,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occasion: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
  },
  description: {
    marginTop: 12,
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  suggestionTip: {
    marginTop: 12,
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
});