// screens/history/index.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useOutfitStore, Outfit } from '@/store/outfitStore';
import HeaderBar from '@/components/common/HeaderBar';
import EmptyState from '@/components/common/EmptyState';
import OutfitHistoryItem from '@/components/history/OutfitHistoryItem';
import { groupOutfitsByDate, formatDate } from '@/utils/dateUtils';
import { router } from 'expo-router';

interface Section {
  title: string;
  data: Outfit[];
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { outfits } = useOutfitStore();

  // lazy‐loading ayarları
  const [limit, setLimit] = useState(10);
  const loadMore = () => {
    if (limit < outfits.length) {
      setLimit(prev => Math.min(prev + 10, outfits.length));
    }
  };

  // limitli liste ve section oluştur
  const limited = useMemo(() => outfits.slice(0, limit), [outfits, limit]);
  const sections: Section[] = useMemo(
    () => groupOutfitsByDate(limited),
    [limited]
  );

  // Bugünün tarihi (örn. "June 12, 2025")
  const todayString = formatDate(new Date().toISOString());

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

      {/* Sabit "Today" etiketi (veya başka bir başlık) */}
      <View style={{
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 12,
        marginBottom: 0,
      }}>
        <Text style={{ color: theme.colors.textLight, fontFamily: 'Montserrat-Bold', fontSize: 14 }}>
          {t('history.today')}
        </Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderSectionHeader={({ section: { title } }) => (
          <View style={[
            styles.sectionHeader,
            { backgroundColor: theme.colors.card }
          ]}>
            <Text style={[
              styles.sectionTitle,
              { color: theme.colors.text }
            ]}>
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
            <OutfitHistoryItem outfit={item} />
            <Text style={[styles.description, { color: theme.colors.text }]}>{item.description}</Text>
            <Text style={[styles.suggestionTip, { color: theme.colors.textLight }]}>{item.suggestion_tip}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  description: {
    marginTop: 12,
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionTip: {
    marginTop: 8,
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    fontStyle: 'italic',
  },
});
