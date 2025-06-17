// wardrobe/edit/[id].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { Camera, Image as ImageIcon, ArrowLeft, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker'; // ImagePicker ekledik
import { useForm, Controller } from 'react-hook-form';
import HeaderBar from '@/components/common/HeaderBar';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import CategoryPicker from '@/components/wardrobe/CategoryPicker';
import ColorPicker from '@/components/wardrobe/ColorPicker';
import SeasonPicker from '@/components/wardrobe/SeasonPicker';
import StylePicker from '@/components/wardrobe/StylePicker';
import useAlertStore from '@/store/alertStore';
import { CATEGORY_HIERARCHY } from '@/utils/constants'; // CATEGORY_HIERARCHY import edildi

type FormData = {
  name: string;
  category: string; // Bu artık detaylı kategori olacak
  color: string;
  season: string[];
  style: string;
  notes: string;
};

export default function EditClothingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { clothing, updateClothing } = useClothingStore();
  const { show: showAlert } = useAlertStore();

  const [itemToEdit] = useState(() => clothing.find(item => item.id === id));
  const [image, setImage] = useState<string | null>(itemToEdit?.imageUri || null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset, // reset eklendi
    watch, // watch eklendi
  } = useForm<FormData>({
    defaultValues: {
      name: itemToEdit?.name || '',
      category: itemToEdit?.category || '',
      color: itemToEdit?.color || '',
      season: itemToEdit?.season || [],
      style: itemToEdit?.style || '',
      notes: itemToEdit?.notes || '',
    },
  });

  const selectedCategory = watch('category'); // Form'daki kategori değerini izle

  useEffect(() => {
    if (!itemToEdit) {
      showAlert({
        title: t('common.error'),
        message: t('wardrobe.itemNotFound'),
        buttons: [{ text: t('common.ok'), onPress: () => router.back() }]
      });
    } else {
      // itemToEdit mevcutsa, form alanlarını sıfırla/doldur
      reset({
        name: itemToEdit.name || '',
        category: itemToEdit.category || '',
        color: itemToEdit.color || '',
        season: itemToEdit.season || [],
        style: itemToEdit.style || '',
        notes: itemToEdit.notes || '',
      });
      setImage(itemToEdit.imageUri || null);
    }
  }, [itemToEdit, reset]);

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert({ title: t('common.error'), message: t('permissions.cameraRequired'), buttons: [{ text: t('common.ok'), onPress: () => { } }] });
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
      showAlert({ title: t('common.error'), message: t('permissions.galleryRequired'), buttons: [{ text: t('common.ok'), onPress: () => { } }] });
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
  const removeImage = () => setImage(null);

  const onSubmit = (data: FormData) => {
    if (!image) {
      showAlert({ title: t('common.error'), message: t('wardrobe.imageRequired'), buttons: [{ text: t('common.ok'), onPress: () => { } }] });
      return;
    }
    if (!id) return;

    updateClothing(id, {
      ...itemToEdit!, // itemToEdit'in var olduğunu varsayıyoruz (useEffect kontrolü sayesinde)
      ...data,
      imageUri: image,
    });
    showAlert({
      title: t('common.success'),
      message: t('wardrobe.itemUpdatedSuccessfully'),
      buttons: [{ text: t('common.ok'), onPress: () => router.back() }]
    });
  };

  if (!itemToEdit) return null;

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
                />
              )}
            />

            <View>
              <Controller
                control={control}
                name="category"
                rules={{ required: t('wardrobe.categoryRequired') as string }}
                render={({ field: { onChange, value } }) => (
                  <CategoryPicker
                    selectedCategory={value}
                    onSelectCategory={onChange}
                    error={errors.category?.message}
                  />
                )}
              />
            </View>

            {/* Diğer alanlar (Color, Season, Style, Notes) değişiklik olmadan kalabilir */}
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('wardrobe.color')}</Text>
              <Controller
                control={control}
                name="color"
                rules={{ required: t('wardrobe.colorRequired') as string }}
                render={({ field: { onChange, value } }) => (
                  <ColorPicker selectedColor={value} onSelectColor={onChange} />
                )}
              />
              {errors.color && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.color.message}</Text>}
            </View>

            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('wardrobe.season')}</Text>
              <Controller
                control={control}
                name="season"
                rules={{ validate: (value) => value.length > 0 || (t('wardrobe.seasonRequired') as string) }}
                render={({ field: { onChange, value } }) => (
                  <SeasonPicker selectedSeasons={value} onSelectSeason={onChange} />
                )}
              />
              {errors.season && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.season.message}</Text>}
            </View>

            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('wardrobe.style')}</Text>
              <Controller
                control={control}
                name="style"
                rules={{ required: t('wardrobe.styleRequired') as string }}
                render={({ field: { onChange, value } }) => (
                  <StylePicker selectedStyle={value} onSelectStyle={onChange} />
                )}
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
                />
              )}
            />

            <Button
              label={t('wardrobe.saveChanges')}
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
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  imageSection: { marginBottom: 24 },
  imageContainer: { position: 'relative', width: '100%', height: 250, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  clothingImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImageButton: { position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  imagePlaceholder: { width: '100%', height: 250, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  imagePlaceholderText: { fontFamily: 'Montserrat-Medium', fontSize: 16 },
  imageButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  imageButton: { flex: 1, marginHorizontal: 4 },
  formSection: { gap: 16 },
  sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 16, marginBottom: 8 },
  errorText: { fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: -8, marginBottom: 8 },
  saveButton: { marginTop: 16 },
});