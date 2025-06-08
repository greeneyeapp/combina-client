import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface HeaderBarProps {
  title: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.leftContainer}>
        {leftIcon && (
          <TouchableOpacity style={styles.iconButton} onPress={onLeftPress}>
            {leftIcon}
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>

      <View style={styles.rightContainer}>
        {rightIcon && (
          <TouchableOpacity style={styles.iconButton} onPress={onRightPress}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  leftContainer: {
    width: 40,
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: 40,
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    textAlign: 'center',
  },
  iconButton: {
    padding: 4,
  },
});

export default HeaderBar;