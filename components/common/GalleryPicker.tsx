// components/common/GalleryPicker.tsx - Kamera kırpma sorunu düzeltildi

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  SafeAreaView
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { X, Check, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { saveImageToTemp } from '@/utils/fileSystemImageManager';

const { width } = Dimensions.get('window');
const gridSpacing = 2;
const gridColumns = 3;
const gridItemWidth = (width - gridSpacing * (gridColumns + 1)) / gridColumns;

interface GalleryPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectImage: (tempUri: string) => void;
  allowCamera?: boolean;
}

export default function GalleryPicker({
  isVisible,
  onClose,
  onSelectImage,
  allowCamera = true
}: GalleryPickerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingPermission, setIsLoadingPermission] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<MediaLibrary.Asset | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string>();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsLoadingPermission(true);
      checkPermissionAndLoadAssets();
    } else {
      setAssets([]);
      setSelectedAsset(null);
      setEndCursor(undefined);
      setHasNextPage(true);
    }
  }, [isVisible]);

  const checkPermissionAndLoadAssets = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      if (status === 'granted') {
        setTimeout(() => loadAssets(true), 100);
      }
    } catch (error) {
      console.error('Error checking gallery permission:', error);
      setHasPermission(false);
    } finally {
      setIsLoadingPermission(false);
    }
  };

  const loadAssets = async (reset: boolean = false) => {
    if (loading || !hasNextPage) return;
    setLoading(true);
    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: 60,
        mediaType: [MediaLibrary.MediaType.photo],
        sortBy: [MediaLibrary.SortBy.creationTime],
        after: reset ? undefined : endCursor,
      });
      setAssets(prev => reset ? result.assets : [...prev, ...result.assets]);
      setHasNextPage(result.hasNextPage);
      setEndCursor(result.endCursor);
    } catch (error) {
      console.error('Error loading gallery assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCameraPress = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        console.error('Camera permission denied');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        // allowsEditing: true, // DEĞİŞİKLİK: Kırpmayı zorunlu kılan satır kaldırıldı.
        // aspect: [4, 3],      // DEĞİŞİKLİK: Kırpma oranı artık gereksiz.
        quality: 0.8,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled) {
        const tempUri = await saveImageToTemp(result.assets[0].uri);
        onSelectImage(tempUri);
        onClose();
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssetPress = (asset: MediaLibrary.Asset) => {
    setSelectedAsset(asset);
  };

  const handleConfirmSelection = async () => {
    if (!selectedAsset || isProcessing) return;
    try {
      setIsProcessing(true);
      const tempUri = await saveImageToTemp(selectedAsset.uri);
      onSelectImage(tempUri);
      onClose();
    } catch (error) {
      console.error('Error saving gallery image to temp:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderAssetItem = useCallback(({ item }: { item: MediaLibrary.Asset }) => {
    const isSelected = selectedAsset?.id === item.id;
    return (
      <TouchableOpacity
        style={[styles.assetItem, { width: gridItemWidth, height: gridItemWidth }, isSelected && { borderColor: theme.colors.primary, borderWidth: 3 }]}
        onPress={() => handleAssetPress(item)}
        activeOpacity={0.8}
        disabled={isProcessing}
      >
        <Image source={{ uri: item.uri }} style={styles.assetImage} resizeMode="cover" />
        {isSelected && (
          <View style={[styles.selectedOverlay, { backgroundColor: theme.colors.primary + '40' }]}>
            <View style={[styles.checkIcon, { backgroundColor: theme.colors.primary }]}>
              <Check color={theme.colors.white} size={16} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [selectedAsset?.id, theme.colors, gridItemWidth, isProcessing]);

  const renderCameraItem = () => {
    if (!allowCamera) return null;
    return (
      <TouchableOpacity
        style={[styles.cameraItem, { backgroundColor: theme.colors.card, width: gridItemWidth, height: gridItemWidth }]}
        onPress={handleCameraPress}
        activeOpacity={0.7}
        disabled={isProcessing}
      >
        <Camera color={theme.colors.text} size={32} />
        <Text style={[styles.cameraText, { color: theme.colors.text }]}>{t('wardrobe.takePhoto')}</Text>
      </TouchableOpacity>
    );
  };
  
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {renderCameraItem()}
    </View>
  );

  const renderContent = () => {
    if (isLoadingPermission) {
      return <View style={styles.centeredContent}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    }
    if (!hasPermission) {
      return (
        <View style={styles.permissionContainer}>
          <Text style={[styles.permissionText, { color: theme.colors.text }]}>{t('permissions.galleryRequired')}</Text>
          <TouchableOpacity style={[styles.permissionButton, { backgroundColor: theme.colors.primary }]} onPress={checkPermissionAndLoadAssets} disabled={isProcessing}>
            <Text style={styles.permissionButtonText}>{t('permissions.grantPermission')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <FlatList
        data={assets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        numColumns={gridColumns}
        contentContainerStyle={styles.gridContainer}
        ListHeaderComponent={renderHeader}
        onEndReached={() => { if (hasNextPage && !loading) loadAssets(false); }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loading ? <ActivityIndicator style={{ margin: 20 }} color={theme.colors.primary} /> : null}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      />
    );
  };

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isProcessing}>
            <X color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>{t('wardrobe.selectPhoto')}</Text>
          <View style={{ width: 40 }} />
        </View>
        
        {renderContent()}

        {selectedAsset && !isProcessing && (
          <View style={[styles.selectionFooter, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
            <Image
              source={{ uri: selectedAsset.uri }}
              style={styles.selectedPreview}
              resizeMode="cover"
            />
            <View style={styles.selectionInfo}>
              <Text style={[styles.selectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.selectedPhoto')}
              </Text>
              <Text style={[styles.selectionDetails, { color: theme.colors.textLight }]}>
                {selectedAsset.width} × {selectedAsset.height}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmFooterButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleConfirmSelection}
            >
              <Check color={theme.colors.white} size={24} />
            </TouchableOpacity>
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingOverlay}>
            <View style={[styles.processingContainer, { backgroundColor: theme.colors.card }]}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.processingText, { color: theme.colors.text }]}>{t('common.processing', 'Processing...')}</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  closeButton: { padding: 8, width: 40 },
  headerTitle: { fontSize: 18, fontFamily: 'Montserrat-Bold', textAlign: 'center' },
  gridContainer: { padding: gridSpacing },
  headerContainer: { padding: gridSpacing, flexDirection: 'row' },
  cameraItem: { borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  cameraText: { fontSize: 12, fontFamily: 'Montserrat-Medium', marginTop: 8, textAlign: 'center' },
  assetItem: { margin: gridSpacing, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  assetImage: { width: '100%', height: '100%' },
  selectedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  checkIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionText: { fontSize: 16, fontFamily: 'Montserrat-Regular', textAlign: 'center', marginBottom: 24, lineHeight: 24 },
  permissionButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  permissionButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat-Bold' },
  processingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  processingContainer: { padding: 32, borderRadius: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  processingText: { fontSize: 16, fontFamily: 'Montserrat-Medium', marginTop: 16 },
  selectionFooter: { flexDirection: 'row', alignItems: 'center', padding: 16, borderTopWidth: 1, minHeight: 80 },
  selectedPreview: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
  selectionInfo: { flex: 1 },
  selectionTitle: { fontSize: 14, fontFamily: 'Montserrat-Medium', marginBottom: 2 },
  selectionDetails: { fontSize: 12, fontFamily: 'Montserrat-Regular' },
  confirmFooterButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
});