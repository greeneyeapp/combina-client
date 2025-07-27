// kodlar/components/wardrobe/SeasonPicker.tsx - 2x2 grid yapısıyla güncellendi

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface SeasonPickerProps {
  selectedSeasons: string[];
  onSelectSeason: (seasons: string[]) => void;
}

const seasons = ['spring', 'summer', 'fall', 'winter'];

const SeasonPicker: React.FC<SeasonPickerProps> = ({
  selectedSeasons,
  onSelectSeason,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const handleSelect = (season: string) => {
    if (selectedSeasons.includes(season)) {
      onSelectSeason(selectedSeasons.filter(s => s !== season));
    } else {
      onSelectSeason([...selectedSeasons, season]);
    }
  };

  const getSeasonColor = (season: string) => {
    switch (season) {
      case 'spring':
        return '#A8E6CF';
      case 'summer':
        return '#FFD3B6';
      case 'fall':
        return '#FFAAA5';
      case 'winter':
        return '#D8E2DC';
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      {seasons.map(season => (
        <TouchableOpacity
          key={season}
          style={[
            styles.seasonItem,
            {
              backgroundColor: selectedSeasons.includes(season)
                ? getSeasonColor(season)
                : theme.colors.card,
              borderColor: selectedSeasons.includes(season)
                ? getSeasonColor(season)
                : theme.colors.border,
            },
          ]}
          onPress={() => handleSelect(season)}
        >
          <Text
            style={[
              styles.seasonText,
              {
                color: selectedSeasons.includes(season)
                  ? '#000000'
                  : theme.colors.text,
                fontFamily: selectedSeasons.includes(season)
                  ? 'Montserrat-Bold'
                  : 'Montserrat-Medium',
              },
            ]}
          >
            {t(`seasons.${season}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// --- DEĞİŞİKLİK BURADA ---
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Öğelerin alt satıra kaymasını sağlar
    justifyContent: 'space-between', // Sütunlar arasında boşluk bırakır
    rowGap: 10, // Satırlar arasına dikey boşluk ekler
  },
  seasonItem: {
    width: '48.5%', // İki sütunlu bir yapı için genişlik ayarı (%3 aradaki boşluk için)
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  seasonText: {
    fontSize: 14,
  },
});
// --- DEĞİŞİKLİK BİTTİ ---

export default SeasonPicker;