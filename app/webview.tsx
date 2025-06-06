import React, { useState, useRef } from 'react';
import { StyleSheet, View, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import HeaderBar from '@/components/common/HeaderBar';
import { ArrowLeft, ArrowRight, RefreshCw, ExternalLink, X } from 'lucide-react-native';

export default function WebViewScreen() {
  const { theme } = useTheme();
  const { url } = useLocalSearchParams<{ url: string }>();
  
  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState(url);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setLoading(navState.loading);
  };

  const goBack = () => webViewRef.current?.goBack();
  const goForward = () => webViewRef.current?.goForward();
  const reload = () => webViewRef.current?.reload();
  const openInBrowser = () => currentUrl && Linking.openURL(currentUrl);

  // Başlığı daha temiz hale getirelim
  const getHeaderTitle = () => {
    try {
      if (currentUrl) {
        const hostname = new URL(currentUrl).hostname;
        return hostname.replace('www.', ''); // www.pinterest.com -> pinterest.com
      }
    } catch (e) {
      // Geçersiz URL durumunda
      return "Invalid URL";
    }
    return "Browser";
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={getHeaderTitle()}
        leftIcon={<X color={theme.colors.text} size={24} />}
        onLeftPress={() => router.back()}
      />

      <WebView 
        ref={webViewRef}
        style={styles.webView}
        source={{ uri: url || 'https://www.google.com' }}
        startInLoadingState={true}
        onNavigationStateChange={handleNavigationStateChange}
        renderLoading={() => <ActivityIndicator style={StyleSheet.absoluteFill} color={theme.colors.primary} size="large" />}
      />

      {/* Alt Kontrol Paneli (Toolbar) */}
      <View style={[styles.toolbar, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
        <TouchableOpacity onPress={goBack} disabled={!canGoBack} style={styles.iconButton}>
          <ArrowLeft color={canGoBack ? theme.colors.text : theme.colors.textLight} size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goForward} disabled={!canGoForward} style={styles.iconButton}>
          <ArrowRight color={canGoForward ? theme.colors.text : theme.colors.textLight} size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={reload} disabled={loading} style={styles.iconButton}>
          <RefreshCw color={loading ? theme.colors.textLight : theme.colors.text} size={22} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openInBrowser} style={styles.iconButton}>
          <ExternalLink color={theme.colors.text} size={22} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    borderTopWidth: 1,
  },
  iconButton: {
    padding: 10,
  },
});