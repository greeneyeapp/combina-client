// app/(tabs)/wardrobe/add.tsx - Düzeltilmiş focus ve UX sorunları

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
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
import { generateUniqueId } from '@/utils/helpers';
import { useFocusEffect } from '@react-navigation/native';
import useAlertStore from '@/store/alertStore';
import Toast from 'react-native-toast-message';
import { ImagePaths, getImageUri } from '@/utils/fileSystemImageManager';
import { ALL_COLORS } from '@/utils/constants';

type FormData = {
  name: string;
  category: string;
  colors: string[];
  season: string[];
  style: string[];
  notes: string;
};

export default function AddClothingScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { addClothing } = useClothingStore();
  const { userPlan } = useUserPlanStore();
  const [selectedImagePaths, setSelectedImagePaths] = useState<ImagePaths | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { show: showAlert } = useAlertStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      category: '',
      colors: [],
      season: [],
      style: [],
      notes: '',
    },
  });

  const watchedColors = watch('colors', []);

  useFocusEffect(
    useCallback(() => {
      reset({ name: '', category: '', colors: [], season: [], style: [], notes: '' });
      setSelectedImagePaths(null);
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: false }), 0);
    }, [reset])
  );

  const handleOpenGalleryPicker = () => {
    setShowGalleryPicker(true);
  };

  const handleImageSelected = (imagePaths: ImagePaths) => {
    setSelectedImagePaths(imagePaths);
    console.log('✅ Image paths selected for add:', {
      original: imagePaths.originalPath,
      thumbnail: imagePaths.thumbnailPath,
      fileName: imagePaths.fileName
    });
    setShowGalleryPicker(false);
  };

  const removeImage = () => {
    setSelectedImagePaths(null);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedImagePaths) {
      showAlert({
        title: t('common.error'),
        message: t('wardrobe.imageRequired'),
        buttons: [{ text: t('common.ok') }]
      });
      return;
    }
    if (!data.category) {
      showAlert({
        title: t('common.error'),
        message: t('wardrobe.categoryRequired'),
        buttons: [{ text: t('common.ok') }]
      });
      return;
    }
    if (!data.colors || data.colors.length === 0) {
      showAlert({
        title: t('common.error'),
        message: t('wardrobe.colorRequired'),
        buttons: [{ text: t('common.ok') }]
      });
      return;
    }

    setIsLoading(true);
    try {
      const newItem = {
        id: generateUniqueId(),
        name: data.name,
        category: data.category,
        color: data.colors[0],
        colors: data.colors,
        season: data.season,
        style: data.style.join(','),
        notes: data.notes,
        originalImagePath: selectedImagePaths.originalPath,
        thumbnailImagePath: selectedImagePaths.thumbnailPath,
        createdAt: new Date().toISOString(),
      };

      await addClothing(newItem);

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('wardrobe.itemAddedSuccessfully'),
        position: 'top',
        visibilityTime: 2000,
        topOffset: 50,
      });

      router.replace('/(tabs)/wardrobe');
    } catch (error) {
      console.error('❌ Error adding clothing item:', error);
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
    if (selectedImagePaths) {
      const imageUri = getImageUri(selectedImagePaths.originalPath, false);
      
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.clothingImage}
            onError={(error) => {
              console.error('Image load error:', error);
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
              {t('wardrobe.storedInApp')}
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('wardrobe.addItem')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={() => router.replace('/(tabs)/wardrobe')}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <ScrollView
          ref={scrollViewRef}
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
                label={t('wardrobe.choosePhoto')}
                onPress={handleOpenGalleryPicker}
                variant="outline"
                style={styles.imageButton}
                disabled={isLoading}
              />
            </View>
          </View>
          <View style={styles.formSection}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.name')}
              </Text>
              <Controller
                control={control}
                name="name"
                rules={{ required: t('wardrobe.nameRequired') as string }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder={t('wardrobe.namePlaceholder')}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.name?.message}
                    editable={!isLoading}
                    returnKeyType="next"
                    onSubmitEditing={() => {
                      // Klavyeyi kapat ve fokus temizle
                      scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                    }}
                  />
                )}
              />
            </View>

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

            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t('wardrobe.notes')}
              </Text>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder={t('wardrobe.notesPlaceholder')}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!isLoading}
                    returnKeyType="done"
                  />
                )}
              />
            </View>
            <Button
              label={isLoading ? t('common.saving') : t('wardrobe.saveItem')}
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
  imageSection: { marginBottom: 16 },
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
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginTop: 4
  },
  saveButton: {
    marginTop: 16
  },
});