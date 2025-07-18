// app/(tabs)/_layout.tsx - Tab bar metin sığma sorunu düzeltildi

import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import {
  Home,
  Shirt,
  LightbulbIcon,
  History,
  UserCircle2
} from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedIcon = ({ children, focused }: { children: React.ReactNode; focused: boolean }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.25 : 1, {
      damping: 10,
      stiffness: 400,
    });
  }, [focused]);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return <Animated.View style={style}>{children}</Animated.View>;
};

export default function TabLayout() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingTop: 2, // İkon ve metin için üst boşluk
          paddingBottom: 5, // Alt boşluk azaltıldı
        },
        tabBarLabelStyle: {
          fontFamily: 'Montserrat-Medium',
          fontSize: 11, // Yazı tipi boyutu 12'den 11'e düşürüldü
        },
        headerShown: false,
      }}>
      
      {/* Ana Sayfa */}
      <Tabs.Screen
        name="home/index"
        options={{
          title: t('tabs.home', 'Home'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon focused={focused}>
              <Home color={color} size={size} />
            </AnimatedIcon>
          ),
        }}
      />
      
      <Tabs.Screen
        name="wardrobe/index"
        options={{
          title: t('tabs.wardrobe'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon focused={focused}>
              <Shirt color={color} size={size} />
            </AnimatedIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="suggestions/index"
        options={{
          title: t('tabs.suggestions'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon focused={focused}>
              <LightbulbIcon color={color} size={size} />
            </AnimatedIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon focused={focused}>
              <History color={color} size={size} />
            </AnimatedIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon focused={focused}>
              <UserCircle2 color={color} size={size} />
            </AnimatedIcon>
          ),
        }}
      />
      
      {/* Gizli sayfalar */}
      <Tabs.Screen name="wardrobe/add" options={{ href: null }} />
      <Tabs.Screen name="wardrobe/[id]" options={{ href: null }} />
      <Tabs.Screen name="wardrobe/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/language" options={{ href: null }} />
    </Tabs>
  );
}
