import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { User } from 'firebase/auth';

interface AvatarProps {
  size: number;
  user: User | null;
}

const Avatar: React.FC<AvatarProps> = ({ size, user }) => {
  const { theme } = useTheme();

  const getInitials = () => {
    if (!user || user.isAnonymous || !user.displayName) {
      return 'G';
    }

    return user.displayName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: user?.isAnonymous ? theme.colors.textLight : theme.colors.primary,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          {
            color: theme.colors.white,
            fontSize: size * 0.4,
          },
        ]}
      >
        {getInitials()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontFamily: 'Montserrat-Bold',
  },
});

export default Avatar;