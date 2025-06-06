import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useOutfitStore } from '@/store/outfitStore';
import HeaderBar from '@/components/common/HeaderBar';
import OutfitHistoryItem from '@/components/history/OutfitHistoryItem';
import EmptyState from '@/components/common/EmptyState';
import { groupOutfitsByDate } from '@/utils/dateUtils';
import { router } from 'expo-router';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { outfits } = useOutfitStore();

  const groupedOutfits = groupOutfitsByDate(outfits);

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.card }]}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        {section.title}
      </Text>
    </View>
  );

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
      
      <FlatList
        data={groupedOutfits}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View>
            {renderSectionHeader({ section: item })}
            {item.data.map((outfit) => (
              <OutfitHistoryItem key={outfit.id} outfit={outfit} />
            ))}
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
});