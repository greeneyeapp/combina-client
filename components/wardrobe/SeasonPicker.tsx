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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seasonItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  seasonText: {
    fontSize: 14,
  },
});

export default SeasonPicker;