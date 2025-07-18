// app/(tabs)/wardrobe/edit/[id].tsx - Renk seçimi alanı düzeltildi

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { getImageUri, checkImageExists, deleteImage, commitTempImage, deleteTempImage } from '@/utils/fileSystemImageManager';
import { useFocusEffect } from '@react-navigation/native';
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

  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [imageChanged, setImageChanged] = useState(false);
  const formSubmitted = useRef(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: { name: '', category: '', colors: [], season: [], style: [], notes: '' },
  });

  useEffect(() => {
    return () => {
      if (tempImageUri && !formSubmitted.current) {
        deleteTempImage(tempImageUri);
        console.log('Cancelled edit, cleaned up temp image:', tempImageUri);
      }
    };
  }, [tempImageUri]);
  
  useFocusEffect(
    useCallback(() => {
      formSubmitted.current = false;
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
      
      if (tempImageUri) {
        deleteTempImage(tempImageUri);
      }
      setTempImageUri(null);
      setImageChanged(false);

    }, [id, itemToEdit, reset])
  );
  
  const loadCurrentImage = async () => {
    if (itemToEdit?.originalImagePath) {
        const exists = await checkImageExists(itemToEdit.originalImagePath, false);
        if (exists) {
            const uri = getImageUri(itemToEdit.originalImagePath, false);
            setCurrentImageUri(uri);
        } else {
            setCurrentImageUri('');
        }
    } else {
      setCurrentImageUri('');
    }
  };

  const handleImageSelected = (uri: string) => {
    if (tempImageUri) {
      deleteTempImage(tempImageUri);
    }
    setTempImageUri(uri);
    setImageChanged(true);
    setShowGalleryPicker(false);
  };

  const removeImage = () => {
    if (tempImageUri) deleteTempImage(tempImageUri);
    setTempImageUri(null);
    setCurrentImageUri('');
    setImageChanged(true);
  };

  const onSubmit = async (data: FormData) => {
    if (!id || !itemToEdit) return;

    if (imageChanged && !tempImageUri && !currentImageUri) {
        showAlert({ title: t('common.error'), message: t('wardrobe.imageRequired'), buttons: [{ text: t('common.ok') }] });
        return;
    }

    setIsLoading(true);
    formSubmitted.current = true;

    try {
        const updatedItemData: Partial<typeof itemToEdit> = {
            ...data,
            style: data.style.join(','),
            color: data.colors[0] || itemToEdit.color,
            colors: data.colors,
        };
      
      if (imageChanged && tempImageUri) {
        const finalImagePaths = await commitTempImage(tempImageUri);
        const oldOriginalPath = itemToEdit.originalImagePath;
        const oldThumbnailPath = itemToEdit.thumbnailImagePath;

        updatedItemData.originalImagePath = finalImagePaths.originalPath;
        updatedItemData.thumbnailImagePath = finalImagePaths.thumbnailPath;

        if (oldOriginalPath && oldThumbnailPath) {
          await deleteImage(oldOriginalPath, oldThumbnailPath);
        }
      } else if (imageChanged && !currentImageUri) {
        const oldOriginalPath = itemToEdit.originalImagePath;
        const oldThumbnailPath = itemToEdit.thumbnailImagePath;
        updatedItemData.originalImagePath = '';
        updatedItemData.thumbnailImagePath = '';
        if (oldOriginalPath && oldThumbnailPath) {
            await deleteImage(oldOriginalPath, oldThumbnailPath);
        }
      }
      
      updateClothing(id, updatedItemData);

      Toast.show({ type: 'success', text1: t('common.success'), text2: t('wardrobe.itemUpdatedSuccessfully') });
      router.replace(`/wardrobe/${id}`);
    } catch (error) {
      console.error("❌ Error updating item: ", error);
      showAlert({ title: t('common.error'), message: t('wardrobe.errorAddingItem'), buttons: [{ text: t('common.ok') }] });
    } finally {
      setIsLoading(false);
    }
  };

  const renderImageSection = () => {
    const displayUri = tempImageUri || currentImageUri;

    if (displayUri) {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: displayUri }}
            style={styles.clothingImage}
            onError={(e) => {
                console.error('Image load error:', e.nativeEvent.error);
                if (displayUri === tempImageUri) setTempImageUri(null);
                if (displayUri === currentImageUri) setCurrentImageUri('');
            }}
          />
          <TouchableOpacity style={[styles.removeImageButton, { backgroundColor: theme.colors.error }]} onPress={removeImage}>
            <X color={theme.colors.white} size={20} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
        <TouchableOpacity 
            style={[styles.imagePlaceholder, { backgroundColor: theme.colors.card }]}
            onPress={() => setShowGalleryPicker(true)}
        >
            <ImageIcon color={theme.colors.textLight} size={48} />
            <Text style={[styles.imagePlaceholderText, { color: theme.colors.textLight }]}>{t('wardrobe.addPhoto')}</Text>
        </TouchableOpacity>
    );
  };

  if (!itemToEdit) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('wardrobe.editItem')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={() => router.back()} />

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
                onPress={() => setShowGalleryPicker(true)}
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
              <Controller
                control={control}
                name="colors"
                rules={{ validate: (value) => (value && value.length > 0) || (t('wardrobe.colorRequired') as string) }}
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
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('wardrobe.season')}</Text>
                <Controller
                    control={control}
                    name="season"
                    rules={{ validate: (value) => value.length > 0 || (t('wardrobe.seasonRequired') as string) }}
                    render={({ field: { onChange, value } }) => <SeasonPicker selectedSeasons={value} onSelectSeason={onChange} />}
                />
                {errors.season && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.season.message}</Text>}
            </View>

            <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('wardrobe.style')}</Text>
                <Controller
                    control={control}
                    name="style"
                    rules={{ validate: (value) => value.length > 0 || (t('wardrobe.styleRequired') as string) }}
                    render={({ field: { onChange, value } }) => <StylePicker selectedStyles={value} onSelectStyles={onChange} multiSelect />}
                />
                {errors.style && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.style.message}</Text>}
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
    imageContainer: { position: 'relative', width: '100%', height: 250, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
    clothingImage: { width: '100%', height: '100%' },
    removeImageButton: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    imagePlaceholder: { width: '100%', height: 250, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#ddd' },
    imagePlaceholderText: { fontFamily: 'Montserrat-Medium', fontSize: 16, marginTop: 8 },
    imageButtonsContainer: { flexDirection: 'row', justifyContent: 'center' },
    imageButton: { flex: 1, marginHorizontal: 4 },
    formSection: { gap: 16 },
    sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 16, marginBottom: 8 },
    errorText: { fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 4 },
    saveButton: { marginTop: 16 },
});