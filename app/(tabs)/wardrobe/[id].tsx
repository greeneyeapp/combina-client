// app/(tabs)/wardrobe/[id].tsx - Asset ID tabanlı görüntüleme
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { ArrowLeft, Edit2, Trash2, ImageOff, RefreshCcw, Image as ImageIcon } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import Button from '@/components/common/Button';
import { formatDate } from '@/utils/dateUtils';
import useAlertStore from '@/store/alertStore';
import { getDisplayImageUri, getImageDebugInfo } from '@/utils/imageDisplayHelper';

export default function ClothingDetailScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clothing, removeClothing } = useClothingStore();
  const { show: showAlert } = useAlertStore();

  const [displayUri, setDisplayUri] = useState<string>('');
  const [isLoadingImage, setIsLoadingImage] = useState(true);
  const [imageLoadError, setImageLoadError] = useState(false);

  const item = clothing.find((item) => item.id === id);

  useEffect(() => {
    if (!item) return;

    const loadDisplayUri = async () => {
      setIsLoadingImage(true);
      setImageLoadError(false);
      
      try {
        console.log('🔍 Loading display URI for item:', getImageDebugInfo(item));
        
        const uri = await getDisplayImageUri(item);
        setDisplayUri(uri);
        
        if (!uri) {
          console.warn('⚠️ No display URI available for item:', item.id);
          setImageLoadError(true);
        }
      } catch (error) {
        console.error('❌ Error loading display URI:', error);
        setImageLoadError(true);
        setDisplayUri('');
      } finally {
        setIsLoadingImage(false);
      }
    };

    loadDisplayUri();
  }, [item?.id, item?.originalImageUri, item?.thumbnailImageUri, item?.isImageMissing]);

  if (!item) {
    return null;
  }
  
  const stylesArray = item.style ? item.style.split(',') : [];

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
                removeClothing(id!);
                console.log('✅ Item removed from store.');

                if (router.canGoBack()) {
                    router.back();
                }
              },
              variant: 'destructive',
            }
        ]
    });
  };

  const renderImageSection = () => {
    if (item.isImageMissing) {
      return (
        <View style={[styles.placeholderContainer, { 
          backgroundColor: theme.colors.card, 
          height: 300, 
          marginBottom: 16 
        }]}>
          <ImageOff color={theme.colors.textLight} size={48} />
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
            {t('wardrobe.imageNotAvailable')}
          </Text>
          <Button
            label={t('wardrobe.changePhoto')}
            onPress={handleEdit}
            variant="primary"
            style={{ marginTop: 24 }}
            icon={<RefreshCcw color={theme.colors.white} size={16} />}
          />
        </View>
      );
    }

    if (isLoadingImage) {
      return (
        <View style={[styles.imageContainer, { 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: theme.colors.card 
        }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textLight, marginTop: 12 }]}>
            {t('common.loading')}
          </Text>
        </View>
      );
    }

    if (imageLoadError || !displayUri) {
      return (
        <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background }]}>
          <ImageIcon color={theme.colors.textLight} size={48} />
          <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>
            {t('wardrobe.imageNotAvailable')}
          </Text>
          <Button
            label={t('wardrobe.changePhoto')}
            onPress={handleEdit}
            variant="primary"
            style={{ marginTop: 16 }}
            icon={<RefreshCcw color={theme.colors.white} size={16} />}
          />
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: displayUri }} 
          style={styles.image}
          resizeMode="cover"
          onError={() => {
            console.warn('🖼️ Image load error for item:', item.id);
            setImageLoadError(true);
            setDisplayUri('');
          }}
          onLoad={() => {
            console.log('✅ Image loaded successfully for item:', item.id);
          }}
        />
        
        <TouchableOpacity 
          style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleEdit}
        >
          <Edit2 color={theme.colors.white} size={20} />
        </TouchableOpacity>
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
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    gap: 12,
    marginBottom: 16
  },
  placeholderText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
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
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
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
});