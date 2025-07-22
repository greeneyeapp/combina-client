// app/(tabs)/_layout.tsx - Tablet için en basit ve en doğru ortalama

import React from 'react';
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
import { Dimensions, Text } from 'react-native';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// Telefon için olan Tab Düzeni (Değişiklik yok)
const PhoneLayout = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const iconSize = 24;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 60, paddingTop: 2, paddingBottom: 5,
        },
        tabBarLabelStyle: { fontFamily: 'Montserrat-Medium', fontSize: 11 },
        headerShown: false,
      }}>
      <Tabs.Screen name="home/index" options={{ title: t('tabs.home'), tabBarIcon: ({ color }) => <Home color={color} size={iconSize} /> }} />
      <Tabs.Screen name="wardrobe/index" options={{ title: t('tabs.wardrobe'), tabBarIcon: ({ color }) => <Shirt color={color} size={iconSize} /> }} />
      <Tabs.Screen name="suggestions/index" options={{ title: t('tabs.suggestions'), tabBarIcon: ({ color }) => <LightbulbIcon color={color} size={iconSize} /> }} />
      <Tabs.Screen name="history/index" options={{ title: t('tabs.history'), tabBarIcon: ({ color }) => <History color={color} size={iconSize} /> }} />
      <Tabs.Screen name="profile/index" options={{ title: t('tabs.profile'), tabBarIcon: ({ color }) => <UserCircle2 color={color} size={iconSize} /> }} />
      <Tabs.Screen name="wardrobe/add" options={{ href: null }} />
      <Tabs.Screen name="wardrobe/[id]" options={{ href: null }} />
      <Tabs.Screen name="wardrobe/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/language" options={{ href: null }} />
    </Tabs>
  );
};

// Tablet için olan Tab Düzeni (EN BASİT VE DOĞRU HALİ)
const TabletLayout = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const iconSize = 32;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textLight,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          height: 90, // Yüksekliği koruyoruz
        },
        tabBarItemStyle: {
          // DEĞİŞİKLİK: 'gap' ile ikon ve metin arasını açıyoruz
          gap: 2, 
          // DEĞİŞİKLİK: Dikeyde tam ortalama için padding
          paddingVertical: 12, 
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="home/index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <Home color={color} size={iconSize} />,
          // DEĞİŞİKLİK: tabBarLabel prop'u ile stil ve vurgu çizgisi
          tabBarLabel: ({ focused, color, children }) => (
            <Text style={{ 
              color, 
              fontSize: 15,
              fontFamily: focused ? 'Montserrat-Bold' : 'Montserrat-Medium',
              // Aktif ise altına 16px'lik boşluk bırak
              marginBottom: focused ? -16 : 0, 
              // Aktif ise altını çiz
              borderBottomColor: focused ? color : 'transparent',
              borderBottomWidth: focused ? 3 : 0,
              // Çizgi ve metin arasına boşluk
              paddingBottom: 8, 
            }}>
              {children}
            </Text>
          ),
        }}
      />
      {/* Diğer sekmeler için aynı mantığı uyguluyoruz */}
      <Tabs.Screen
        name="wardrobe/index"
        options={{
          title: t('tabs.wardrobe'),
          tabBarIcon: ({ color }) => <Shirt color={color} size={iconSize} />,
          tabBarLabel: ({ focused, color, children }) => (
            <Text style={{ color, fontSize: 15, fontFamily: focused ? 'Montserrat-Bold' : 'Montserrat-Medium', marginBottom: focused ? -16 : 0, borderBottomColor: focused ? color : 'transparent', borderBottomWidth: focused ? 3 : 0, paddingBottom: 8, }}>{children}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="suggestions/index"
        options={{
          title: t('tabs.suggestions'),
          tabBarIcon: ({ color }) => <LightbulbIcon color={color} size={iconSize} />,
          tabBarLabel: ({ focused, color, children }) => (
            <Text style={{ color, fontSize: 15, fontFamily: focused ? 'Montserrat-Bold' : 'Montserrat-Medium', marginBottom: focused ? -16 : 0, borderBottomColor: focused ? color : 'transparent', borderBottomWidth: focused ? 3 : 0, paddingBottom: 8, }}>{children}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history/index"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color }) => <History color={color} size={iconSize} />,
          tabBarLabel: ({ focused, color, children }) => (
            <Text style={{ color, fontSize: 15, fontFamily: focused ? 'Montserrat-Bold' : 'Montserrat-Medium', marginBottom: focused ? -16 : 0, borderBottomColor: focused ? color : 'transparent', borderBottomWidth: focused ? 3 : 0, paddingBottom: 8, }}>{children}</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <UserCircle2 color={color} size={iconSize} />,
          tabBarLabel: ({ focused, color, children }) => (
            <Text style={{ color, fontSize: 15, fontFamily: focused ? 'Montserrat-Bold' : 'Montserrat-Medium', marginBottom: focused ? -16 : 0, borderBottomColor: focused ? color : 'transparent', borderBottomWidth: focused ? 3 : 0, paddingBottom: 8, }}>{children}</Text>
          ),
        }}
      />
      
      {/* Gizli Sayfalar */}
      <Tabs.Screen name="wardrobe/add" options={{ href: null }} />
      <Tabs.Screen name="wardrobe/[id]" options={{ href: null }} />
      <Tabs.Screen name="wardrobe/edit/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/language" options={{ href: null }} />
    </Tabs>
  );
};

export default function TabLayout() {
  if (isTablet) {
    return <TabletLayout />;
  } else {
    return <PhoneLayout />;
  }
}