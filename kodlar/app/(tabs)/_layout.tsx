import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import {
  Shirt,
  LightbulbIcon,
  Layout,
  History,
  UserCircle2
} from 'lucide-react-native';

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
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Montserrat-Medium',
          fontSize: 12,
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="wardrobe/index"
        options={{
          title: t('tabs.wardrobe'),
          tabBarIcon: ({ color, size }) => (
            <Shirt color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="suggestions/index"
        options={{
          title: t('tabs.suggestions'),
          tabBarIcon: ({ color, size }) => (
            <LightbulbIcon color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inspiration/index"
        options={{
          title: t('tabs.inspiration'),
          tabBarIcon: ({ color, size }) => (
            <Layout color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, size }) => (
            <History color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <UserCircle2 color={color} size={size} />
          ),
        }}
      />
      {/* Hidden screens (stack-like behavior) */}
      <Tabs.Screen name="wardrobe/add" options={{ href: null }} />
      <Tabs.Screen name="wardrobe/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/language" options={{ href: null }} />
    </Tabs>
  );
}