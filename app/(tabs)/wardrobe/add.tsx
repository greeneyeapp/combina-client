import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Camera, Image as ImageIcon, ArrowLeft, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import HeaderBar from '@/components/common/HeaderBar';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import CategoryPicker from '@/components/wardrobe/CategoryPicker';
import ColorPicker from '@/components/wardrobe/ColorPicker';
import SeasonPicker from '@/components/wardrobe/SeasonPicker';
import StylePicker from '@/components/wardrobe/StylePicker';
import { generateUniqueId } from '@/utils/helpers';
import { useFocusEffect } from '@react-navigation/native';

type FormData = {
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string;
  notes: string;
};

export default function AddClothingScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { addClothing } = useClothingStore();
  const [image, setImage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    watch
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      category: '',
      color: '',
      season: [],
      style: '',
      notes: '',
    },
  });

  const watchedCategory = watch('category');
  const watchedColor = watch('color');
  const watchedSeason = watch('season');
  const watchedStyle = watch('style');

  useFocusEffect(
    useCallback(() => {
      reset({
        name: '',
        category: '',
        color: '',
        season: [],
        style: '',
        notes: '',
      });
      setImage(null);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      }, 0);
      return () => { };
    }, [reset])
  );

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert(t('permissions.cameraRequired'));
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error taking picture:', error);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert(t('permissions.galleryRequired'));
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const onSubmit = (data: FormData) => {
    if (!image) {
      alert(t('wardrobe.imageRequired'));
      return;
    }
    const newItem = {
      id: generateUniqueId(),
      name: data.name,
      category: data.category,
      color: data.color,
      season: data.season,
      style: data.style,
      notes: data.notes,
      imageUri: image,
      createdAt: new Date().toISOString(),
    };
    addClothing(newItem);
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('wardrobe.addItem')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={() => router.back()}
      />
      
      {/* DEĞİŞİKLİK 1: KeyboardAvoidingView EKLENDİ */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.imageSection}>
            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.clothingImage} />
                <TouchableOpacity
                  style={[styles.removeImageButton, { backgroundColor: theme.colors.error }]}
                  onPress={removeImage}
                >
                  <X color={theme.colors.white} size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.imagePlaceholderText, { color: theme.colors.textLight }]}>
                  {t('wardrobe.addPhoto')}
                </Text>
              </View>
            )}

            <View style={styles.imageButtonsContainer}>
              <Button
                icon={<Camera color={theme.colors.text} size={20} />}
                label={t('wardrobe.takePhoto')}
                onPress={takePicture}
                variant="outline"
                style={styles.imageButton}
              />
              <Button
                icon={<ImageIcon color={theme.colors.text} size={20} />}
                label={t('wardrobe.choosePhoto')}
                onPress={pickImage}
                variant="outline"
                style={styles.imageButton}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Controller
              control={control}
              rules={{
                required: t('wardrobe.nameRequired') as string,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('wardrobe.name')}
                  placeholder={t('wardrobe.namePlaceholder')}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                />
              )}
              name="name"
            />

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('wardrobe.category')}
            </Text>
            <CategoryPicker
              selectedCategory={watchedCategory}
              onSelectCategory={(category) => setValue('category', category)}
            />
            {errors.category && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.category.message}
              </Text>
            )}

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('wardrobe.color')}
            </Text>
            <ColorPicker
              selectedColor={watchedColor}
              onSelectColor={(color) => setValue('color', color)}
            />
            {errors.color && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.color.message}
              </Text>
            )}

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('wardrobe.season')}
            </Text>
            <SeasonPicker
              selectedSeasons={watchedSeason}
              onSelectSeason={(seasons) => setValue('season', seasons)}
            />
            {errors.season && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.season.message}
              </Text>
            )}

            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t('wardrobe.style')}
            </Text>
            <StylePicker
              selectedStyle={watchedStyle}
              onSelectStyle={(style) => setValue('style', style)}
            />
            {errors.style && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {errors.style.message}
              </Text>
            )}

            <Controller
              control={control}
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
                />
              )}
              name="notes"
            />

            <Button
              label={t('wardrobe.saveItem')}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              style={styles.saveButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // DEĞİŞİKLİK 2: KeyboardAvoidingView için stil eklendi
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  imageSection: {
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  clothingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePlaceholderText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  imageButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  formSection: {
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 16,
  },
});