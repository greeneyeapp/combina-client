// app/(tabs)/wardrobe/edit/[id].tsx (Güncellenmiş - Galeri referans sistemi)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { Image as ImageIcon, ArrowLeft, X } from 'lucide-react-native';
import * as MediaLibrary from 'expo-media-library';
import { useForm, Controller } from 'react-hook-form';
import HeaderBar from '@/components/common/HeaderBar';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import CategoryPicker from '@/components/wardrobe/CategoryPicker';
import ColorPicker from '@/components/wardrobe/ColorPicker';
import SeasonPicker from '@/components/wardrobe/SeasonPicker';
import StylePicker from '@/components/wardrobe/StylePicker';
import GalleryPicker from '@/components/common/GalleryPicker';
import useAlertStore from '@/store/alertStore';
import Toast from 'react-native-toast-message';
import {
  processGalleryAsset,
  GalleryImageResult,
  checkGalleryPermissions,
  cleanupUnusedThumbnails
} from '@/utils/galleryImageStorage';

type FormData = {
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string[];
  notes: string;
};

export default function EditClothingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing, updateClothing } = useClothingStore();
  const { userPlan } = useUserPlanStore();
  const { show: showAlert } = useAlertStore();

  const itemToEdit = clothing.find(item => item.id === id);

  const [selectedAsset, setSelectedAsset] = useState<MediaLibrary.Asset | null>(null);
  const [processedImage, setProcessedImage] = useState<GalleryImageResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: { name: '', category: '', color: '', season: [], style: [], notes: '' },
  });

  // Form'u mevcut item verisiyle doldur
  useEffect(() => {
    if (itemToEdit) {
      reset({
        name: itemToEdit.name || '',
        category: itemToEdit.category || '',
        color: itemToEdit.color || '',
        season: itemToEdit.season || [],
        style: itemToEdit.style ? itemToEdit.style.split(',') : [],
        notes: itemToEdit.notes || '',
      });
    } else {
      // Item bulunamazsa geri dön
      console.warn(`Edit screen for item ${id} is being closed because the item no longer exists.`);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/wardrobe');
      }
    }
  }, [itemToEdit, reset, id]);

  const getCurrentImageUri = (): string => {
    if (!itemToEdit) return '';

    // Yeni görselin önceliği varsa
    if (processedImage) {
      return processedImage.thumbnailUri || processedImage.originalUri;
    }

    // Mevcut görsellerin öncelik sırası
    if (itemToEdit.thumbnailImageUri) return itemToEdit.thumbnailImageUri;
    if (itemToEdit.originalImageUri) return itemToEdit.originalImageUri;
    if (itemToEdit.imageUri) return itemToEdit.imageUri; // Legacy support

    return '';
  };

  const handleOpenGalleryPicker = async () => {
    const hasPermission = await checkGalleryPermissions();
    if (hasPermission) {
      setShowGalleryPicker(true);
    } else {
      showAlert({
        title: t('common.error'),
        message: t('permissions.galleryRequired'),
        buttons: [{ text: t('common.ok'), onPress: () => { } }]
      });
    }
  };

  const handleAssetSelected = async (asset: MediaLibrary.Asset) => {
    setIsLoading(true);
    try {
      console.log('Processing new selected asset:', asset.id);

      // Yeni asset'i işle
      const result = await processGalleryAsset(id!, asset);

      setSelectedAsset(asset);
      setProcessedImage(result);
      setImageChanged(true);

      console.log('New asset processed successfully:', {
        originalUri: result.originalUri,
        thumbnailUri: result.thumbnailUri,
        assetId: result.assetId
      });

    } catch (error) {
      console.error('Error processing selected asset:', error);
      showAlert({
        title: t('common.error'),
        message: t('wardrobe.errorProcessingImage'),
        buttons: [{ text: t('common.ok'), onPress: () => { } }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = () => {
    setSelectedAsset(null);
    setProcessedImage(null);
    setImageChanged(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!id || !itemToEdit) return;

    // Görsel kontrolü - yeni görsel seçilmediyse mevcut görsel olmalı
    if (!processedImage && !getCurrentImageUri()) {
      showAlert({
        title: t('common.error'),
        message: t('wardrobe.imageRequired'),
        buttons: [{ text: t('common.ok'), onPress: () => { } }]
      });
      return;
    }

    setIsLoading(true);
    try {
      // Güncellenmiş item objesi
      const updatedItem = {
        ...itemToEdit,
        ...data,
        style: data.style.join(','),
      };

      // Eğer yeni görsel seçildiyse, görsel bilgilerini güncelle
      if (imageChanged && processedImage) {
        // Eski thumbnail'i temizle (eğer varsa)
        if (itemToEdit.thumbnailImageUri) {
          try {
            await cleanupUnusedThumbnails([]);
            console.log('Old thumbnail cleaned up');
          } catch (error) {
            console.warn('Could not cleanup old thumbnail:', error);
          }
        }

        // Yeni görsel bilgilerini ekle
        updatedItem.originalImageUri = processedImage.originalUri;
        updatedItem.thumbnailImageUri = processedImage.thumbnailUri;
        updatedItem.galleryAssetId = processedImage.assetId;
        updatedItem.imageMetadata = processedImage.metadata;
      }

      updateClothing(id, updatedItem);

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('wardrobe.itemUpdatedSuccessfully'),
        position: 'top',
        visibilityTime: 2000,
      });

      router.back();

    } catch (error) {
      console.error("Error updating item: ", error);
      showAlert({
        title: t('common.error'),
        message: t('wardrobe.errorAddingItem'),
        buttons: [{ text: t('common.ok') }]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderImageSection = () => {
    const currentImageUri = getCurrentImageUri();

    if (currentImageUri) {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: currentImageUri }}
            style={styles.clothingImage}
          />
          <TouchableOpacity
            style={[styles.removeImageButton, { backgroundColor: theme.colors.error }]}
            onPress={removeImage}
          >
            <X color={theme.colors.white} size={20} />
          </TouchableOpacity>

          {/* Image info */}
          {(processedImage?.metadata || itemToEdit?.imageMetadata) && (
            <View style={[styles.imageInfo, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.imageInfoText, { color: theme.colors.textLight }]}>
                {processedImage?.metadata.width || itemToEdit?.imageMetadata?.width} × {processedImage?.metadata.height || itemToEdit?.imageMetadata?.height}
                {(processedImage?.metadata.fileSize || itemToEdit?.imageMetadata?.fileSize) &&
                  ` • ${Math.round((processedImage?.metadata.fileSize || itemToEdit?.imageMetadata?.fileSize!) / 1024)} KB`
                }
                {imageChanged && processedImage && (
                  <Text style={[styles.changedIndicator, { color: theme.colors.primary }]}>
                    {' • '}{t('wardrobe.newImage')}
                  </Text>
                )}
              </Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.imagePlaceholderText, { color: theme.colors.textLight }]}>
          {t('wardrobe.addPhoto')}
        </Text>
      </View>
    );
  };

  if (!itemToEdit) {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('wardrobe.editItem')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.imageSection}>
            {renderImageSection()}

            <View style={styles.imageButtonsContainer}>
              <Button
                icon={<ImageIcon color={theme.colors.text} size={20} />}
                label={t('wardrobe.changePhoto')}
                onPress={handleOpenGalleryPicker}
                variant="outline"
                style={styles.imageButton}
                disabled={isLoading}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Controller
              control={control}
              name="name"
              rules={{ required: t('wardrobe.nameRequired') as string }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('wardrobe.name')}
                  placeholder={t('wardrobe.namePlaceholder')}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                  editable={!isLoading}
                />
              )}
            />

            <Controller
              control={control}
              name="category"
              rules={{ required: t('wardrobe.categoryRequired') as string }}
              render={({ field: { onChange, value } }) => (
                <CategoryPicker
                  selectedCategory={value}
                  onSelectCategory={onChange}
                  error={errors.category?.message}
                  gender={userPlan?.gender as 'female' | 'male' | undefined}
                />
              )}
            />

            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.color')}
              </Text>
              <Controller
                control={control}
                name="color"
                rules={{ required: t('wardrobe.colorRequired') as string }}
                render={({ field: { onChange, value } }) => (
                  <ColorPicker
                    selectedColor={value}
                    onSelectColor={onChange}
                    error={errors.color?.message}
                  />
                )}
              />
            </View>

            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.season')}
              </Text>
              <Controller
                control={control}
                name="season"
                rules={{ validate: (value) => value.length > 0 || (t('wardrobe.seasonRequired') as string) }}
                render={({ field: { onChange, value } }) => (
                  <SeasonPicker
                    selectedSeasons={value}
                    onSelectSeason={onChange}
                  />
                )}
              />
              {errors.season && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.season.message}
                </Text>
              )}
            </View>

            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.style')}
              </Text>
              <Controller
                control={control}
                name="style"
                rules={{ validate: (value) => value.length > 0 || (t('wardrobe.styleRequired') as string) }}
                render={({ field: { onChange, value } }) => (
                  <StylePicker
                    selectedStyles={value}
                    onSelectStyles={onChange}
                    multiSelect={true}
                  />
                )}
              />
              {errors.style && (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {errors.style.message}
                </Text>
              )}
            </View>

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('wardrobe.notes')}
                  placeholder={t('wardrobe.notesPlaceholder')}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isLoading}
                />
              )}
            />

            <Button
              label={isLoading ? t('common.saving') : t('wardrobe.saveChanges')}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              style={styles.saveButton}
              disabled={isLoading}
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Galeri Picker Modal */}
      <GalleryPicker
        isVisible={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onSelectImage={handleAssetSelected}
        allowCamera={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  imageSection: { marginBottom: 24 },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16
  },
  clothingImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center'
  },
  imageInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  imageInfoText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  changedIndicator: {
    fontFamily: 'Montserrat-Bold',
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  imagePlaceholderText: { fontFamily: 'Montserrat-Medium', fontSize: 16 },
  imageButtonsContainer: { flexDirection: 'row', justifyContent: 'center' },
  imageButton: { flex: 1, marginHorizontal: 4 },
  formSection: { gap: 16 },
  sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 16, marginBottom: 8 },
  errorText: { fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 4 },
  saveButton: { marginTop: 16 },
});