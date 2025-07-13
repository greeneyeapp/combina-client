// app/(tabs)/wardrobe/edit/[id].tsx - File system based image editing

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { Image as ImageIcon, ArrowLeft, X } from 'lucide-react-native';
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
import { ImagePaths, getImageUri, checkImageExists, deleteImage } from '@/utils/fileSystemImageManager';
import { ALL_COLORS } from '@/utils/constants';

type FormData = {
  name: string;
  category: string;
  colors: string[];
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

  const [selectedImagePaths, setSelectedImagePaths] = useState<ImagePaths | null>(null);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: { name: '', category: '', colors: [], season: [], style: [], notes: '' },
  });

  const watchedColors = watch('colors', []);

  useEffect(() => {
    if (itemToEdit) {
      const itemColors = itemToEdit.colors && itemToEdit.colors.length > 0
        ? itemToEdit.colors
        : [itemToEdit.color];

      reset({
        name: itemToEdit.name || '',
        category: itemToEdit.category || '',
        colors: itemColors,
        season: itemToEdit.season || [],
        style: itemToEdit.style ? itemToEdit.style.split(',') : [],
        notes: itemToEdit.notes || '',
      });
      loadCurrentImage();
    } else {
      router.back();
    }
  }, [itemToEdit, reset, id]);

  const loadCurrentImage = async () => {
    if (!itemToEdit) return;

    try {
      if (!itemToEdit.originalImagePath) {
        setCurrentImageUri('');
        return;
      }

      // Check if original image exists
      const exists = await checkImageExists(itemToEdit.originalImagePath, false);
      
      if (exists) {
        const uri = getImageUri(itemToEdit.originalImagePath, false);
        setCurrentImageUri(uri);
        console.log('✅ Loaded current image for edit');
      } else {
        setCurrentImageUri('');
        console.log('⚠️ Current image file missing');
      }
    } catch (error) {
      console.error('❌ Error loading current image:', error);
      setCurrentImageUri('');
    }
  };

  const handleOpenGalleryPicker = () => {
    setShowGalleryPicker(true);
  };

  const handleImageSelected = async (imagePaths: ImagePaths) => {
    // If we're replacing an existing image, we'll delete the old one after successful save
    setSelectedImagePaths(imagePaths);
    setCurrentImageUri(getImageUri(imagePaths.originalPath, false));
    setImageChanged(true);
    setShowGalleryPicker(false);
    
    console.log('✅ New image selected for edit:', {
      original: imagePaths.originalPath,
      thumbnail: imagePaths.thumbnailPath,
      fileName: imagePaths.fileName
    });
  };

  const removeImage = () => {
    setSelectedImagePaths(null);
    setCurrentImageUri('');
    setImageChanged(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!id || !itemToEdit) return;

    if (imageChanged && !selectedImagePaths && !currentImageUri) {
      showAlert({
        title: t('common.error'),
        message: t('wardrobe.imageRequired'),
        buttons: [{ text: t('common.ok'), onPress: () => { } }]
      });
      return;
    }

    setIsLoading(true);
    try {
      const updatedItemData = {
        ...itemToEdit,
        ...data,
        style: data.style.join(','),
        color: data.colors[0] || itemToEdit.color,
        colors: data.colors,
      };

      // Handle image changes
      if (imageChanged && selectedImagePaths) {
        // Store old image paths for cleanup
        const oldOriginalPath = itemToEdit.originalImagePath;
        const oldThumbnailPath = itemToEdit.thumbnailImagePath;

        // Update with new image paths
        updatedItemData.originalImagePath = selectedImagePaths.originalPath;
        updatedItemData.thumbnailImagePath = selectedImagePaths.thumbnailPath;

        // Update the item first
        updateClothing(id, updatedItemData);

        // Clean up old images after successful update
        if (oldOriginalPath && oldThumbnailPath) {
          try {
            await deleteImage(oldOriginalPath, oldThumbnailPath);
            console.log('✅ Cleaned up old image files');
          } catch (error) {
            console.error('⚠️ Failed to clean up old image files:', error);
            // Don't fail the update because of cleanup issues
          }
        }
      } else if (imageChanged && !selectedImagePaths) {
        // User removed the image - this shouldn't happen as we require images
        // But handle gracefully
        updatedItemData.originalImagePath = '';
        updatedItemData.thumbnailImagePath = '';
        updateClothing(id, updatedItemData);
      } else {
        // No image changes, just update other fields
        updateClothing(id, updatedItemData);
      }

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('wardrobe.itemUpdatedSuccessfully'),
        position: 'top',
        visibilityTime: 2000,
      });

      router.replace('/(tabs)/wardrobe');

    } catch (error) {
      console.error("❌ Error updating item: ", error);
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
    if (imageChanged && !selectedImagePaths && !currentImageUri) {
      return (
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.imagePlaceholderText, { color: theme.colors.textLight }]}>
            {t('wardrobe.addPhoto')}
          </Text>
        </View>
      );
    }

    if (currentImageUri) {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: currentImageUri }}
            style={styles.clothingImage}
            onError={(error) => {
              console.error('❌ Image load error:', error.nativeEvent.error);
              console.log('Failed URI:', currentImageUri);
            }}
          />
          <TouchableOpacity
            style={[styles.removeImageButton, { backgroundColor: theme.colors.error }]}
            onPress={removeImage}
          >
            <X color={theme.colors.white} size={20} />
          </TouchableOpacity>
          <View style={[styles.imageInfo, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.imageInfoText, { color: theme.colors.textLight }]}>
              {imageChanged ? t('wardrobe.newImage', 'New image') : t('wardrobe.storedInApp', 'Stored in app')}
            </Text>
          </View>
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

  if (!itemToEdit) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('wardrobe.editItem')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={() => router.replace('/(tabs)/wardrobe')} />

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
                  gender={userPlan?.gender as 'female' | 'male' | 'unisex' | undefined}
                />
              )}
            />

            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.colors')}
              </Text>

              {watchedColors.length > 0 && (
                <View style={[styles.selectedColorsHeader, { backgroundColor: theme.colors.primaryLight }]}>
                  <Text style={[styles.selectedColorsHeaderText, { color: theme.colors.primary }]}>
                    {t('wardrobe.colorSelectionInfo', { 
                      selected: watchedColors.length, 
                      max: 3 
                    })}
                  </Text>
                  <View style={styles.selectedColorsPreview}>
                    {watchedColors.map(colorName => {
                      const colorData = ALL_COLORS.find(c => c.name === colorName);
                      return (
                        <View
                          key={colorName}
                          style={[
                            styles.previewColorCircle,
                            {
                              backgroundColor: colorData?.hex || '#CCCCCC',
                              borderColor: colorData?.name === 'white' ? theme.colors.border : 'transparent',
                              borderWidth: colorData?.name === 'white' ? 1 : 0
                            }
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
              )}

              <Controller
                control={control}
                name="colors"
                rules={{
                  validate: (value) => (value && value.length > 0) || (t('wardrobe.colorRequired') as string)
                }}
                render={({ field: { onChange, value } }) => (
                  <ColorPicker
                    selectedColors={value || []}
                    onSelectColors={onChange}
                    multiSelect={true}
                    maxColors={3}
                    error={errors.colors?.message}
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

      <GalleryPicker
        isVisible={showGalleryPicker}
        onClose={() => setShowGalleryPicker(false)}
        onSelectImage={handleImageSelected}
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
  clothingImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
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
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  imageInfoText: {
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
    color: '#FFFFFF',
    textAlign: 'center'
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  imagePlaceholderText: { 
    fontFamily: 'Montserrat-Medium', 
    fontSize: 16 
  },
  imageButtonsContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center' 
  },
  imageButton: { 
    flex: 1, 
    marginHorizontal: 4 
  },
  formSection: { 
    gap: 16 
  },
  sectionTitle: { 
    fontFamily: 'Montserrat-Bold', 
    fontSize: 16, 
    marginBottom: 8 
  },
  selectedColorsHeader: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedColorsHeaderText: {
    fontSize: 14,
    fontFamily: 'Montserrat-SemiBold',
    marginBottom: 8,
  },
  selectedColorsPreview: {
    flexDirection: 'row',
    gap: 6,
  },
  previewColorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  errorText: { 
    fontFamily: 'Montserrat-Regular', 
    fontSize: 12, 
    marginTop: 4 
  },
  saveButton: { 
    marginTop: 16 
  },
});