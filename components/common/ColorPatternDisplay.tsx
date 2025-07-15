// components/common/ColorPatternDisplay.tsx

import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface ColorPatternDisplayProps {
  color: { name: string; hex: string };
  size?: number;
  theme: any;
  style?: ViewStyle;
  borderWidth?: number;
}

const ColorPatternDisplay: React.FC<ColorPatternDisplayProps> = ({ 
  color, 
  size = 16, 
  theme, 
  style,
  borderWidth 
}) => {
  const circleStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: borderWidth ?? (color.name === 'white' ? 1 : 0),
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...style,
  };

  const renderContent = () => {
    switch (color.hex) {
      case 'pattern_leopard':
        return (
          <Image 
            source={require('@/assets/patterns/leopard.webp')} 
            style={styles.patternImage} 
            resizeMode="cover"
          />
        );
      case 'pattern_zebra':
        return (
          <Image 
            source={require('@/assets/patterns/zebra.webp')} 
            style={styles.patternImage} 
            resizeMode="cover"
          />
        );
      case 'pattern_snakeskin':
        return (
          <Image 
            source={require('@/assets/patterns/snake.webp')} 
            style={styles.patternImage} 
            resizeMode="cover"
          />
        );
      default:
        return (
          <View style={{ backgroundColor: color.hex, width: '100%', height: '100%' }} />
        );
    }
  };

  return (
    <View style={circleStyle}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  patternImage: {
    width: '100%',
    height: '100%',
  },
});

export default ColorPatternDisplay;