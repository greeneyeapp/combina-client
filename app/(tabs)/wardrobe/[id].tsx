// app/(tabs)/wardrobe/[id].tsx (Güncellenmiş - Orijinal image sistemi)

import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { ArrowLeft, Edit2, Trash2, Image as ImageIcon } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import { formatDate } from '@/utils/dateUtils';
import useAlertStore from '@/store/alertStore';

export default function ClothingDetailScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clothing, setClothing } = useClothingStore();
  const { show: showAlert } = useAlertStore();
  const [imageError, setImageError] = useState(false);
  const [showingThumbnail, setShowingThumbnail] = useState(false);

  const item = clothing.find((item) => item.id === id);

  if (!item) {
    return null;
  }
  
  const stylesArray = item.style ? item.style.split(',') : [];

  // Gösterilecek image URI'sini belirle
  const getDisplayImageUri = (): string => {
    // Detay görünümünde öncelik sırası:
    // 1. Original image (yüksek kalite)
    // 2. Eski sistem imageUri (backward compatibility)
    // 3. Thumbnail (fallback)
    
    if (item.originalImageUri && !imageError) {
      return item.originalImageUri;
    }
    
    // Backward compatibility için eski imageUri
    if (item.imageUri && !imageError) {
      return item.imageUri;
    }
    
    // Son çare olarak thumbnail
    if (item.thumbnailImageUri) {
      setShowingThumbnail(true);
      return item.thumbnailImageUri;
    }
    
    return '';
  };

  const handleImageError = () => {
    console.warn(`Image load failed for item: ${item.name} (${item.id})`);
    setImageError(true);
  };

  const handleImageLoad = () => {
    if (imageError) {
      setImageError(false);
    }
    if (showingThumbnail) {
      setShowingThumbnail(false);
    }
  };

  const handleEdit = () => {
    router.push(`/wardrobe/edit/${id}`);
  };

  const handleDelete = () => {
    showAlert({
        title: t('wardrobe.deleteTitle'),
        message: t('wardrobe.deleteMessage'),
        buttons: [
            { text: t('common.cancel'), onPress: () => {}, variant: 'outline' },
            {
              text: t('common.delete'),
              onPress: () => {
                const newClothingList = clothing.filter(c => c.id !== id);
                setClothing(newClothingList); 
                console.log('✅ Item removed from store. The wardrobe screen will now re-render itself.');

                if (router.canGoBack()) {
                    router.back();
                }
              },
              variant: 'destructive',
            }
        ]
    });
  };

  const displayUri = getDisplayImageUri();

  const renderImageSection = () => {
    return (
      <View style={styles.imageContainer}>
        {displayUri ? (
          <>
            <Image 
              source={{ uri: displayUri }} 
              style={styles.image}
              resizeMode="cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            
            {/* Quality indicator */}
            {showingThumbnail && (
              <View style={[styles.qualityBadge, { backgroundColor: theme.colors.warning }]}>
                <Text style={styles.qualityBadgeText}>
                  {t('wardrobe.thumbnailQuality')}
                </Text>
              </View>
            )}
            
            {/* Image metadata info */}
            {item.imageMetadata && (
              <View style={[styles.metadataContainer, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <Text style={styles.metadataText}>
                  {item.imageMetadata.width} × {item.imageMetadata.height}
                  {item.imageMetadata.fileSize && 
                    ` • ${Math.round(item.imageMetadata.fileSize / 1024)} KB`
                  }
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background }]}>
            <ImageIcon color={theme.colors.textLight} size={48} />
            <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
              {t('wardrobe.imageNotAvailable')}
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleEdit}
        >
          <Edit2 color={theme.colors.white} size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderImageTypeInfo = () => {
    if (!__DEV__) return null;
    
    let imageSource = '';
    let sourceColor = theme.colors.textLight;
    
    if (item.originalImageUri && !imageError) {
      imageSource = 'Original Gallery Reference';
      sourceColor = theme.colors.success;
    } else if (item.imageUri && !imageError) {
      imageSource = 'Legacy Image URI';
      sourceColor = theme.colors.warning;
    } else if (item.thumbnailImageUri) {
      imageSource = 'Thumbnail Fallback';
      sourceColor = theme.colors.error;
    } else {
      imageSource = 'No Image Available';
      sourceColor = theme.colors.error;
    }
    
    return (
      <View style={[styles.debugInfo, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.debugTitle, { color: theme.colors.text }]}>
          DEBUG: Image Source
        </Text>
        <Text style={[styles.debugText, { color: sourceColor }]}>
          {imageSource}
        </Text>
        {item.galleryAssetId && (
          <Text style={[styles.debugText, { color: theme.colors.textLight }]}>
            Asset ID: {item.galleryAssetId}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('wardrobe.itemDetails')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={() => router.back()}
        rightIcon={<Trash2 color={theme.colors.error} size={24} />}
        onRightPress={handleDelete}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderImageSection()}

        <Text style={[styles.itemName, { color: theme.colors.text }]}>
          {item.name}
        </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.category')}
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {t(`categories.${item.category}`)} 
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.color')}
            </Text>
            <View style={styles.colorRow}>
              <View style={[
                styles.colorCircle, 
                { 
                  backgroundColor: item.color, 
                  borderColor: theme.colors.border 
                }
              ]} />
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {t(`colors.${item.color}`)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.season')}
            </Text>
            <View style={styles.tagContainer}>
              {item.season.map((season) => (
                <View 
                  key={season} 
                  style={[styles.tag, { backgroundColor: theme.colors.primaryLight }]}
                >
                  <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                    {t(`seasons.${season}`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.style')}
            </Text>
            <View style={styles.tagContainer}>
              {stylesArray.map((style) => (
                <View 
                  key={style} 
                  style={[styles.tag, { backgroundColor: theme.colors.secondaryLight }]}
                >
                  <Text style={[styles.tagText, { color: theme.colors.secondary }]}>
                    {t(`styles.${style}`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
                {t('wardrobe.notes')}
              </Text>
              <Text style={[styles.notes, { color: theme.colors.text }]}>
                {item.notes}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.addedOn')}
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {formatDate(item.createdAt, i18n.language)}
            </Text>
          </View>
        </View>

        {renderImageTypeInfo()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  imageContainer: { 
    position: 'relative', 
    width: '100%', 
    height: 300, 
    borderRadius: 16, 
    overflow: 'hidden', 
    marginBottom: 16 
  },
  image: { width: '100%', height: '100%' },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  placeholderText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  qualityBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qualityBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Montserrat-Bold',
  },
  metadataContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    padding: 8,
    borderRadius: 8,
  },
  metadataText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    textAlign: 'center',
  },
  editButton: { 
    position: 'absolute', 
    bottom: 16, 
    right: 16, 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  itemName: { 
    fontFamily: 'PlayfairDisplay-Bold', 
    fontSize: 24, 
    marginBottom: 24 
  },
  detailsContainer: { gap: 16 },
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  detailLabel: { fontFamily: 'Montserrat-Medium', fontSize: 14 },
  detailValue: { fontFamily: 'Montserrat-Bold', fontSize: 14 },
  colorRow: { flexDirection: 'row', alignItems: 'center' },
  colorCircle: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    marginRight: 8, 
    borderWidth: 1 
  },
  tagContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-end', 
    maxWidth: '60%', 
    gap: 8 
  },
  tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  tagText: { fontFamily: 'Montserrat-Medium', fontSize: 12 },
  notesContainer: { marginTop: 8 },
  notes: { 
    fontFamily: 'Montserrat-Regular', 
    fontSize: 14, 
    marginTop: 8, 
    lineHeight: 20 
  },
  debugInfo: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
  },
  debugTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    marginBottom: 4,
  },
  debugText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 10,
    lineHeight: 14,
  },
});