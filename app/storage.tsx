// app/storage.tsx - useEffect ile en güvenli hale getirilmiş async işlem yönetimi

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  Zap,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Trash2,
  Settings,
  BarChart3,
  TrendingUp,
  Database,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import Button from '@/components/common/Button';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getFileSystemHealth,
  cleanupOrphanedImages,
  listAllImages
} from '@/utils/fileSystemImageManager';
import {
  performFileSystemMaintenance,
  diagnoseFileSystemHealth,
  getFileSystemStats
} from '@/utils/appInitialization';
import { getCacheAnalytics, forceCacheCleanup, validateAndCleanCaches } from '@/utils/cacheManager';
import { useClothingStore } from '@/store/clothingStore';
import useAlertStore from '@/store/alertStore';
import Toast from 'react-native-toast-message';

// ... (interface StorageStats tanımı burada)
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
  const [activeOperations, setActiveOperations] = useState<Set<string>>(new Set());


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
        buttons: [{ text: t('common.ok') }]
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const performOperation = async (operationType: string, operation: () => Promise<any>) => {
    setActiveOperations(prev => new Set(prev).add(operationType));

    try {
      const result = await operation();

      let titleKey = '';
      let message = '';
      switch (operationType) {
        case 'validate':
          titleKey = 'validationComplete';
          message = t('storage.validationResults', {
            updated: result.updatedCount || 0,
            removed: result.removedCount || 0
          });
          break;
        case 'cleanup':
          titleKey = 'cleanupComplete';
          message = t('storage.cleanupResults', {
            removed: result.removedCount || result.removedFiles || 0,
            freed: Math.round((result.freedSpace || result.freedSpaceKB || 0) / 1024)
          });
          break;
        case 'maintenance':
          titleKey = 'maintenanceComplete';
          message = t('storage.maintenanceResults');
          break;
      }

      if (titleKey && message) {
        Toast.show({
          type: 'success',
          text1: t(`storage.${titleKey}`),
          text2: message,
          position: 'top',
          visibilityTime: 3000,
        });
      }

      await loadStorageStats();
    } catch (error) {
      console.error(`${operationType} operation failed:`, error);
      showAlert({
        title: t('common.error'),
        message: t('storage.operationFailed'),
        buttons: [{ text: t('common.ok') }]
      });
    } finally {
      setActiveOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operationType);
        return newSet;
      });
    }
  };

  const handlePerformMaintenance = () => {
    showAlert({
      title: t('storage.performMaintenance'),
      message: t('storage.maintenanceWarning'),
      buttons: [
        { text: t('common.cancel'), variant: 'outline' },
        {
          text: t('common.continue'),
          onPress: () => {
            performOperation('maintenance', () => performFileSystemMaintenance(t));
          },
          variant: 'primary',
        },
      ],
    });
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

  const renderStatCard = (title: string, value: string, subtitle?: string, icon?: React.ReactNode, color?: string) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card }]}>
      <View style={styles.statHeader}>
        {icon}
        <Text style={[styles.statTitle, { color: theme.colors.textLight }]}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: color || theme.colors.text }]}>{value}</Text>
      {subtitle && <Text style={[styles.statSubtitle, { color: theme.colors.textLight }]}>{subtitle}</Text>}
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
              undefined,
              <HardDrive color={theme.colors.primary} size={20} />
            )}
            {renderStatCard(
              t('storage.fileCount'),
              `${storageStats?.fileSystem.fileCount || 0}`,
              undefined,
              <FileText color={theme.colors.secondary} size={20} />
            )}
            {renderStatCard(
              t('storage.totalItems'),
              `${storageStats?.usage.totalItems || 0}`,
              undefined,
              <Database color={theme.colors.accent} size={20} />
            )}
            {renderStatCard(
              t('storage.averageFileSize'),
              `${storageStats?.cache.averageFileSizeKB || 0} KB`,
              undefined,
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

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t('storage.actions')}
          </Text>

          <View style={styles.actionsGrid}>
            <Button
              label={t('storage.refreshStats')}
              onPress={() => loadStorageStats(true)}
              variant="outline"
              style={styles.actionButton}
              disabled={isRefreshing}
              loading={isRefreshing}
              icon={<RefreshCw color={theme.colors.accent} size={20} />}
            />
            <Button
              label={activeOperations.has('maintenance') ? t('storage.performing') : t('storage.performMaintenance')}
              onPress={handlePerformMaintenance}
              variant="primary"
              style={styles.actionButton}
              disabled={activeOperations.has('maintenance')}
              loading={activeOperations.has('maintenance')}
              icon={<Settings color={theme.colors.white} size={20} />}
            />
          </View>
        </View>
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
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    marginBottom: 12,
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
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 11,
    fontFamily: 'Montserrat-Regular',
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
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  detailsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  issuesTitle: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
  },
  issueText: {
    fontSize: 13,
    fontFamily: 'Montserrat-Regular',
    marginLeft: 8,
    marginBottom: 4,
  },
  emergencyButton: {
    marginTop: 8,
  },
});
