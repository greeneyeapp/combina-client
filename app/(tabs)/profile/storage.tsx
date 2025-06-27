// app/(tabs)/profile/storage/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft, Trash2, Settings, Info, HardDrive, RefreshCw } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import Button from '@/components/common/Button';
import { 
  getStorageStats, 
  cleanupUnusedImages,
  formatFileSize 
} from '@/utils/optimizedImageStorage';
import { useClothingStore } from '@/store/clothingStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import useAlertStore from '@/store/alertStore';

type ImageQuality = 'low' | 'medium' | 'high';

export default function StorageScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing } = useClothingStore();
  const { show: showAlert } = useAlertStore();
  
  const [storageStats, setStorageStats] = useState({
    totalSize: 0,
    imageCount: 0,
    avgImageSize: 0,
    formattedSize: '0 KB'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [imageQuality, setImageQuality] = useState<ImageQuality>('medium');

  useEffect(() => {
    loadStorageStats();
    loadImageQuality();
  }, []);

  const loadStorageStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      }
      const stats = await getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    } finally {
      if (isRefresh) {
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const loadImageQuality = async () => {
    try {
      const quality = await AsyncStorage.getItem('image_quality');
      setImageQuality((quality as ImageQuality) || 'medium');
    } catch (error) {
      console.error('Error loading image quality:', error);
    }
  };

  const saveImageQuality = async (quality: ImageQuality) => {
    try {
      await AsyncStorage.setItem('image_quality', quality);
      setImageQuality(quality);
      Toast.show({
        type: 'success',
        text1: t('storage.qualityUpdated'),
        text2: t('storage.qualityNote'),
        position: 'top',
        visibilityTime: 3000,
        topOffset: 50,
      });
    } catch (error) {
      console.error('Error saving image quality:', error);
    }
  };

  const handleCleanup = () => {
    showAlert({
      title: t('storage.cleanupTitle'),
      message: t('storage.cleanupWarning'),
      buttons: [
        { text: t('common.cancel'), onPress: () => {}, variant: 'outline' },
        { text: t('storage.cleanup'), onPress: performCleanup, variant: 'destructive' }
      ]
    });
  };

  const performCleanup = async () => {
    setIsCleaning(true);
    try {
      // Biraz bekle ki dosya silme işlemleri tamamlansın
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const activeUris = clothing.map(item => item.imageUri);
      
      const result = await cleanupUnusedImages(activeUris);
      
      await loadStorageStats(); // İstatistikleri yenile (refresh değil)
      
      if (result.deletedCount > 0) {
        Toast.show({
          type: 'success',
          text1: t('storage.cleanupSuccess'),
          text2: t('storage.filesDeleted', { 
            count: result.deletedCount, 
            size: formatFileSize(result.freedSpace) 
          }),
          position: 'top',
          visibilityTime: 4000,
          topOffset: 50,
        });
      } else {
        Toast.show({
          type: 'info',
          text1: t('storage.noFilesToClean'),
          text2: t('storage.allFilesInUse'),
          position: 'top',
          visibilityTime: 3000,
          topOffset: 50,
        });
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('storage.cleanupError'),
        position: 'top',
        visibilityTime: 3000,
        topOffset: 50,
      });
    } finally {
      setIsCleaning(false);
    }
  };

  const getQualityInfo = (quality: ImageQuality) => {
    switch (quality) {
      case 'low':
        return { size: '~200KB', description: t('storage.lowQualityDesc') };
      case 'medium':
        return { size: '~500KB', description: t('storage.mediumQualityDesc') };
      case 'high':
        return { size: '~1MB', description: t('storage.highQualityDesc') };
    }
  };

  const handleBackPress = () => {
    router.push('/(tabs)/profile');
  };

  const handleRefresh = async () => {
    await loadStorageStats(true);
    Toast.show({
      type: 'success',
      text1: t('storage.refreshed'),
      text2: t('storage.statsUpdated'),
      position: 'top',
      visibilityTime: 2000,
      topOffset: 50,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar
          title={t('storage.title')}
          leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
          onLeftPress={handleBackPress}
          rightIcon={
            isRefreshing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <RefreshCw color={theme.colors.text} size={24} />
            )
          }
          onRightPress={isRefreshing ? undefined : handleRefresh}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            {t('storage.calculating')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('storage.title')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={handleBackPress}
        rightIcon={
          isRefreshing ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <RefreshCw color={theme.colors.text} size={24} />
          )
        }
        onRightPress={isRefreshing ? undefined : handleRefresh}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Depolama İstatistikleri */}
        <View style={[styles.statsCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.statsHeader}>
            <HardDrive color={theme.colors.primary} size={24} />
            <Text style={[styles.statsTitle, { color: theme.colors.text }]}>
              {t('storage.usage')}
            </Text>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {storageStats.formattedSize}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>
                {t('storage.totalSize')}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {storageStats.imageCount}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>
                {t('storage.imageCount')}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {formatFileSize(storageStats.avgImageSize)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textLight }]}>
                {t('storage.avgSize')}
              </Text>
            </View>
          </View>
        </View>

        {/* Görsel Kalitesi Ayarları */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Settings color={theme.colors.text} size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('storage.imageQuality')}
            </Text>
          </View>
          
          <View style={styles.qualityOptions}>
            {(['low', 'medium', 'high'] as ImageQuality[]).map((quality) => {
              const info = getQualityInfo(quality);
              const isSelected = imageQuality === quality;
              
              return (
                <TouchableOpacity
                  key={quality}
                  style={[
                    styles.qualityOption,
                    { 
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: isSelected ? theme.colors.primaryLight : 'transparent'
                    }
                  ]}
                  onPress={() => saveImageQuality(quality)}
                >
                  <Text style={[
                    styles.qualityName,
                    { color: isSelected ? theme.colors.primary : theme.colors.text }
                  ]}>
                    {t(`storage.${quality}`)}
                  </Text>
                  <Text style={[styles.qualitySize, { color: theme.colors.textLight }]}>
                    {info.size}
                  </Text>
                  <Text style={[styles.qualityDesc, { color: theme.colors.textLight }]}>
                    {info.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={[styles.infoBox, { backgroundColor: theme.colors.background }]}>
            <Info color={theme.colors.textLight} size={16} />
            <Text style={[styles.infoText, { color: theme.colors.textLight }]}>
              {t('storage.qualityInfo')}
            </Text>
          </View>
        </View>

        {/* Temizlik */}
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <View style={styles.sectionHeader}>
            <Trash2 color={theme.colors.text} size={20} />
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('storage.cleanup')}
            </Text>
          </View>
          
          <Text style={[styles.sectionDesc, { color: theme.colors.textLight }]}>
            {t('storage.cleanupDesc')}
          </Text>
          
          <Button
            label={isCleaning ? t('storage.cleaning') : t('storage.cleanupButton')}
            onPress={handleCleanup}
            variant="outline"
            loading={isCleaning}
            disabled={isCleaning}
            style={styles.cleanupButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontFamily: 'Montserrat-Medium', fontSize: 16 },
  
  statsCard: { padding: 20, borderRadius: 16, marginBottom: 16 },
  statsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statsTitle: { fontFamily: 'Montserrat-Bold', fontSize: 18, marginLeft: 8 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statValue: { fontFamily: 'Montserrat-Bold', fontSize: 20 },
  statLabel: { fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 4 },
  
  section: { padding: 20, borderRadius: 16, marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 16, marginLeft: 8 },
  sectionDesc: { fontFamily: 'Montserrat-Regular', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  
  qualityOptions: { gap: 12, marginBottom: 16 },
  qualityOption: { padding: 16, borderRadius: 12, borderWidth: 1 },
  qualityName: { fontFamily: 'Montserrat-Bold', fontSize: 16 },
  qualitySize: { fontFamily: 'Montserrat-Medium', fontSize: 14, marginTop: 2 },
  qualityDesc: { fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 4 },
  
  infoBox: { flexDirection: 'row', padding: 12, borderRadius: 8, alignItems: 'flex-start' },
  infoText: { flex: 1, fontFamily: 'Montserrat-Regular', fontSize: 12, marginLeft: 8, lineHeight: 16 },
  
  cleanupButton: { marginTop: 8 },
});