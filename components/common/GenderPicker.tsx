import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface GenderPickerProps {
  selectedValue: string;
  onSelect: (value: string) => void;
}

const GENDERS = ['female', 'male', 'unisex'];

const GenderPicker: React.FC<GenderPickerProps> = ({ selectedValue, onSelect }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      {GENDERS.map((gender) => {
        const isSelected = selectedValue === gender;
        return (
          <TouchableOpacity
            key={gender}
            style={[
              styles.button,
              { 
                backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => onSelect(gender)}
          >
            <Text
              style={[
                styles.text,
                { color: isSelected ? theme.colors.white : theme.colors.text },
              ]}
            >
              {t(`gender.${gender}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
});

export default GenderPicker;