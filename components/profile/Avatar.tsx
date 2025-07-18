// components/profile/Avatar.tsx - Firebase dependency kaldırılmış

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

// DÜZELTME: Firebase User type'ı yerine kendi interface'imizi tanımlıyoruz
interface UserType {
  uid?: string;
  name?: string;
  fullname?: string;
  displayName?: string;
  email?: string;
  isAnonymous?: boolean;
  provider?: string;
}

interface AvatarProps {
  size: number;
  user: UserType | null;
}

const Avatar: React.FC<AvatarProps> = ({ size, user }) => {
  const { theme } = useTheme();

  const getInitials = () => {
    if (!user || user.isAnonymous) {
      return 'G'; // Guest
    }

    // DÜZELTME: Birden fazla name alanını kontrol et
    const name = user.displayName || user.fullname || user.name;
    
    if (!name) {
      return 'U'; // User
    }

    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isGuest = !user || user.isAnonymous;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: isGuest ? theme.colors.textLight : theme.colors.primary,
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