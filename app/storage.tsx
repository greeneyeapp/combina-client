// app/storage.tsx - İçerik ortalandı ve butonlar kaldırıldı

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import {
  ArrowLeft,
  HardDrive,
  FileText,
  CheckCircle,
  AlertCircle,
  XCircle,
  Database,
  BarChart3,
} from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import { LinearGradient } from 'expo-linear-gradient';
import { getFileSystemHealth } from '@/utils/fileSystemImageManager';
import { diagnoseFileSystemHealth } from '@/utils/appInitialization';
import { getCacheAnalytics } from '@/utils/cacheManager';
import useAlertStore from '@/store/alertStore';

interface StorageStats {
  fileSystem: {
    totalSizeMB: number;
    fileCount: number;
    isHealthy: boolean;
    issues: string[];
  };
  cache: {
    totalMB: number;
    averageFileSizeKB: number;
    healthScore: number;
    recommendations: string[];
  };
  usage: {
    totalItems: number;
    itemsWithImages: number;
    orphanedFiles: number;
  };
}

export default function StorageManagementScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { show: showAlert } = useAlertStore();

  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const health = await getFileSystemHealth();
      const cacheAnalytics = await getCacheAnalytics(t);
      const diagnosis = await diagnoseFileSystemHealth();

      setStorageStats({
        fileSystem: {
          totalSizeMB: Math.round(health.totalSize / (1024 * 1024) * 100) / 100,
          fileCount: health.totalFiles,
          isHealthy: health.isHealthy,
          issues: health.issues
        },
        cache: {
          totalMB: cacheAnalytics.storage.totalMB,
          averageFileSizeKB: cacheAnalytics.storage.averageFileSizeKB,
          healthScore: cacheAnalytics.performance.healthScore,
          recommendations: cacheAnalytics.performance.recommendations
        },
        usage: {
          totalItems: diagnosis.totalItems,
          itemsWithImages: diagnosis.withValidPaths,
          orphanedFiles: diagnosis.systemHealth.issues.length 
        }
      });
    } catch (error) {
      console.error('Failed to load storage stats:', error);
      showAlert({
        title: t('common.error'),
        message: t('storage.failedToLoad'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getHealthColor = (score: number, isHealthy: boolean) => {
    if (!isHealthy || score < 50) return theme.colors.error;
    if (score < 80) return theme.colors.warning;
    return theme.colors.success || '#4CAF50';
  };

  const getHealthIcon = (score: number, isHealthy: boolean) => {
    if (!isHealthy || score < 50) return <XCircle color={theme.colors.error} size={20} />;
    if (score < 80) return <AlertCircle color={theme.colors.warning} size={20} />;
    return <CheckCircle color={theme.colors.success || '#4CAF50'} size={20} />;
  };

  const getHealthStatus = (score: number, isHealthy: boolean) => {
    if (!isHealthy || score < 50) return t('storage.critical');
    if (score < 80) return t('storage.needsAttention');
    return t('storage.healthy');
  };

  const renderStatCard = (title: string, value: string, icon?: React.ReactNode, color?: string) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.statHeader}>
        {icon}
        <Text style={[styles.statTitle, { color: theme.colors.textLight }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: color || theme.colors.text }]}>{value}</Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar
          title={t('storage.title')}
          leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
          onLeftPress={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textLight }]}>
            {t('common.loading')}
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
        onLeftPress={() => router.back()}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadStorageStats(true)}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('storage.overview')}
          </Text>

          <LinearGradient
            colors={theme.mode === 'dark'
              ? [theme.colors.card, theme.colors.background]
              : [theme.colors.background, theme.colors.card]
            }
            style={[styles.healthCard, { borderColor: theme.colors.border }]}
          >
            <View style={styles.healthHeader}>
              {getHealthIcon(storageStats?.cache.healthScore || 0, storageStats?.fileSystem.isHealthy || false)}
              <View style={styles.healthInfo}>
                <Text style={[styles.healthTitle, { color: theme.colors.text }]}>
                  {t('storage.systemStatus')}
                </Text>
                <Text style={[
                  styles.healthStatus,
                  { color: getHealthColor(storageStats?.cache.healthScore || 0, storageStats?.fileSystem.isHealthy || false) }
                ]}>
                  {getHealthStatus(storageStats?.cache.healthScore || 0, storageStats?.fileSystem.isHealthy || false)}
                </Text>
              </View>
              <Text style={[styles.healthScore, { color: theme.colors.primary }]}>
                {storageStats?.cache.healthScore || 0}%
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.statsGrid}>
            {renderStatCard(
              t('storage.totalSize'),
              `${storageStats?.fileSystem.totalSizeMB || 0} MB`,
              <HardDrive color={theme.colors.primary} size={20} />
            )}
            {renderStatCard(
              t('storage.fileCount'),
              `${storageStats?.fileSystem.fileCount || 0}`,
              <FileText color={theme.colors.secondary} size={20} />
            )}
            {renderStatCard(
              t('storage.totalItems'),
              `${storageStats?.usage.totalItems || 0}`,
              <Database color={theme.colors.accent} size={20} />
            )}
            {renderStatCard(
              t('storage.averageFileSize'),
              `${storageStats?.cache.averageFileSizeKB || 0} KB`,
              <BarChart3 color={theme.colors.primary} size={20} />
            )}
          </View>
        </View>

        {(storageStats?.cache.recommendations.length || 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('storage.recommendations')}
            </Text>
            <View style={[styles.recommendationsCard, { backgroundColor: theme.colors.card }]}>
              {storageStats?.cache.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <AlertCircle color={theme.colors.warning} size={16} />
                  <Text style={[styles.recommendationText, { color: theme.colors.text }]}>
                    {recommendation}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1, // DEĞİŞİKLİK: İçeriğin dikeyde büyümesini sağlar
    justifyContent: 'center', // DEĞİŞİKLİK: İçeriği dikeyde ortalar
    padding: 24,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
    width: '100%', // Genişliğin tam olmasını garantiler
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 16, // Boşluk artırıldı
    textAlign: 'center', // Başlığı ortala
  },
  healthCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  healthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginBottom: 4,
  },
  healthStatus: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
  },
  healthScore: {
    fontSize: 24,
    fontFamily: 'Montserrat-Bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontFamily: 'Montserrat-Bold',
  },
  recommendationsCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    lineHeight: 20,
  },
});