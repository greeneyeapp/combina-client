// components/common/HeaderBar.tsx - iPad için büyütülmüş ve orantılı tasarım

import React from 'react';
// YENİ: Dimensions modülü eklendi
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

// YENİ: iPad tespiti
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface HeaderBarProps {
  title: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  // YENİ: HeaderBar'a ek stil uygulama imkanı
  style?: object; 
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  style, // YENİ: style prop'u eklendi
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }, style]}>
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

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: isTablet ? 20 : 16, // Tablette dikey boşluk artırıldı
  },
  leftContainer: {
    width: isTablet ? 60 : 40, // Dokunma alanı genişletildi
    alignItems: 'flex-start',
  },
  rightContainer: {
    width: isTablet ? 60 : 40, // Dokunma alanı genişletildi
    alignItems: 'flex-end',
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: isTablet ? 30 : 24, // Başlık büyütüldü
    textAlign: 'center',
    flex: 1, // Başlığın ortada kalmasını garantiler
  },
  iconButton: {
    padding: 4,
  },
});

export default HeaderBar;