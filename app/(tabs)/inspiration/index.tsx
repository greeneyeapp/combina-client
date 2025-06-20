import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useInspirationStore } from '@/store/inspirationStore';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Save, Search, Grid, X } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import CollectionsScreen from './collections';
import SaveNoteModal from '@/components/inspiration/SaveNoteModal';
import useAlertStore from '@/store/alertStore';

export default function InspirationScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { addInspiration } = useInspirationStore();
  const { show: showAlert } = useAlertStore();

  const webViewRef = useRef<WebView>(null);
  const [currentUrl, setCurrentUrl] = useState('https://www.pinterest.com/');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'webview' | 'collections'>('webview');
  const [showingSaveModal, setShowingSaveModal] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageUrlToSave, setImageUrlToSave] = useState<string | null>(null);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(searchQuery)}`;
      webViewRef.current?.injectJavaScript(`window.location.href = "${searchUrl}";`);
    }
  };

  const handleNavigationStateChange = (navState: any) => {
    setCurrentUrl(navState.url);
    setCanGoBack(navState.canGoBack);
  };

  const handleSaveCurrentPage = async () => {
    setIsSaving(true);
    // Demo mock data:
    const mockPinDetails = {
      id: 'demo-pin-123',
      pinUrl: currentUrl,
      imageUrl: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg'
    };
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (mockPinDetails && mockPinDetails.imageUrl) {
      setImageUrlToSave(mockPinDetails.imageUrl);
      setShowingSaveModal(true);
    } else {
      showAlert({
        title: 'Hata',
        message: 'Demo verisi yüklenemedi.',
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    }
    setIsSaving(false);
  };

  const handleSaveWithNote = (note: string) => {
    addInspiration({
      id: Date.now().toString(),
      url: currentUrl,
      imageUrl: imageUrlToSave,
      note,
      createdAt: new Date().toISOString(),
    });
    setShowingSaveModal(false);
    setImageUrlToSave(null);
  };

  // Sadece Pinterest/Koleksiyonlar ikonları
  const renderHeaderIcons = () => (
    <View style={{ flexDirection: 'row', gap: 16 }}>
      <TouchableOpacity onPress={() => setViewMode('webview')}>
        <Search color={viewMode === 'webview' ? theme.colors.primary : theme.colors.text} size={22} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setViewMode('collections')}>
        <Grid color={viewMode === 'collections' ? theme.colors.primary : theme.colors.text} size={22} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('inspiration.title')}
        rightIcon={renderHeaderIcons()}
        onRightPress={() => {}}
      />

      {viewMode === 'webview' && (
        <View style={styles.webViewContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.colors.card }]}>
            {canGoBack && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => webViewRef.current?.goBack()}
              >
                <ArrowLeft color={theme.colors.text} size={20} />
              </TouchableOpacity>
            )}

            <TextInput
              style={[styles.searchInput, { color: theme.colors.text }]}
              placeholder={t('inspiration.searchPlaceholder')}
              placeholderTextColor={theme.colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />

            {searchQuery ? (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <X color={theme.colors.textLight} size={16} />
              </TouchableOpacity>
            ) : null}
          </View>

          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webView}
            onNavigationStateChange={handleNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSaveCurrentPage}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Save color={theme.colors.white} size={24} />
            )}
          </TouchableOpacity>
        </View>
      )}

      {viewMode === 'collections' && <CollectionsScreen />}

      <SaveNoteModal
        isVisible={showingSaveModal}
        onClose={() => setShowingSaveModal(false)}
        onSave={handleSaveWithNote}
        pageUrl={currentUrl}
        imageUrl={imageUrlToSave}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webViewContainer: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  backButton: { padding: 8, marginRight: 4 },
  searchInput: {
    flex: 1,
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    paddingVertical: 8,
  },
  clearButton: { padding: 8 },
  webView: { flex: 1 },
  saveButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
