// Dosya: kodlar/app/(tabs)/history/index.tsx (GÜNCEL - Yeni Image Sistemi)

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
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
import { Trash2, AlertTriangle } from 'lucide-react-native';

interface Section {
  title: string;
  data: Outfit[];
}

export default function HistoryScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { outfits, removeOutfit } = useOutfitStore();
  const { clothing } = useClothingStore();
  const { show: showAlert } = useAlertStore();

  // Outfit'lerin geçerliliğini kontrol et
  const outfitsWithValidation = useMemo(() => {
    return outfits.map(outfit => {
      const availableItems = outfit.items.filter(itemId => 
        clothing.some(c => c.id === itemId)
      );
      
      return {
        ...outfit,
        availableItemsCount: availableItems.length,
        totalItemsCount: outfit.items.length,
        hasAllItems: availableItems.length === outfit.items.length
      };
    });
  }, [outfits, clothing]);

  const sections: Section[] = useMemo(
    () => groupOutfitsByDate(outfitsWithValidation, i18n.language, t),
    [outfitsWithValidation, i18n.language, t]
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

  const getCardStyle = (outfit: any) => {
    // Bazı item'lar eksikse farklı stil
    if (!outfit.hasAllItems) {
      return [
        styles.card,
        { 
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.warning,
          borderWidth: 1,
          borderStyle: 'dashed'
        }
      ];
    }
    
    return [styles.card, { backgroundColor: theme.colors.card }];
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
          const tipColor = theme.mode === 'light' ? theme.colors.warning : theme.colors.accent;

          return (
            <View style={getCardStyle(item)}>
              <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                  <Text style={[styles.occasion, { color: theme.colors.text }]}>
                    {t(`occasions.${item.occasion}`)} • {t(`weather.${item.weather}`)}
                  </Text>
                  {!item.hasAllItems && (
                    <View style={styles.warningContainer}>
                      <AlertTriangle color={theme.colors.warning} size={14} />
                      <Text style={[styles.warningText, { color: theme.colors.warning }]}>
                        {t('history.missingItems', { 
                          missing: item.totalItemsCount - item.availableItemsCount,
                          total: item.totalItemsCount 
                        })}
                      </Text>
                    </View>
                  )}
                </View>
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  occasion: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginBottom: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 11,
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