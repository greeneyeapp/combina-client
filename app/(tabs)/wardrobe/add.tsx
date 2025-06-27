// app/(tabs)/wardrobe/add.tsx (Güncellenmiş tam kod)
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { useUserPlanStore } from '@/store/userPlanStore';
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
import useAlertStore from '@/store/alertStore';
import Toast from 'react-native-toast-message';
import { optimizeAndSaveImage, formatFileSize } from '@/utils/optimizedImageStorage';

type FormData = {
  name: string;
  category: string;
  color: string;
  season: string[];
  style: string[];
  notes: string;
};

export default function AddClothingScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { addClothing } = useClothingStore();
  const { userPlan } = useUserPlanStore();
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { show: showAlert } = useAlertStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      category: '',
      color: '',
      season: [],
      style: [],
      notes: '',
    },
  });

  useFocusEffect(
    useCallback(() => {
      reset({ name: '', category: '', color: '', season: [], style: [], notes: '' });
      setImage(null);
      setIsLoading(false);
      setIsOptimizing(false);
      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: false }), 0);
    }, [reset])
  );

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert({ 
        title: t('common.error'), 
        message: t('permissions.cameraRequired'), 
        buttons: [{ text: t('common.ok'), onPress: () => {} }] 
      });
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({ 
        allowsEditing: true, 
        aspect: [4, 3], 
        quality: 1.0 // En yüksek kalitede al, sonra optimize edeceğiz
      });
      if (!result.canceled) {
        await processSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error taking picture:', error);
      showAlert({ 
        title: t('common.error'), 
        message: t('wardrobe.errorTakingPhoto'), 
        buttons: [{ text: t('common.ok'), onPress: () => {} }] 
      });
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({ 
        title: t('common.error'), 
        message: t('permissions.galleryRequired'), 
        buttons: [{ text: t('common.ok'), onPress: () => {} }] 
      });
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ 
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: true, 
        aspect: [4, 3], 
        quality: 1.0 // En yüksek kalitede al, sonra optimize edeceğiz
      });
      if (!result.canceled) {
        await processSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      showAlert({ 
        title: t('common.error'), 
        message: t('wardrobe.errorPickingPhoto'), 
        buttons: [{ text: t('common.ok'), onPress: () => {} }] 
      });
    }
  };

  const processSelectedImage = async (sourceUri: string) => {
    setIsOptimizing(true);
    try {
      // Görseli optimize et ve kalıcı dizine kaydet
      const result = await optimizeAndSaveImage(sourceUri);
      
      setImage(result.uri);
      
      // Kullanıcıya optimizasyon sonucunu göster
      Toast.show({
        type: 'success',
        text1: t('wardrobe.imageOptimized'),
        text2: t('wardrobe.sizeReduced', { 
          from: formatFileSize(result.originalSize),
          to: formatFileSize(result.compressedSize)
        }),
        position: 'top',
        visibilityTime: 3000,
        topOffset: 50,
      });
      
    } catch (error) {
      console.error('Error processing image:', error);
      showAlert({ 
        title: t('common.error'), 
        message: t('wardrobe.errorProcessingImage'), 
        buttons: [{ text: t('common.ok'), onPress: () => {} }] 
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const removeImage = () => setImage(null);

  const onSubmit = async (data: FormData) => {
    if (!image) {
      showAlert({ 
        title: t('common.error'), 
        message: t('wardrobe.imageRequired'), 
        buttons: [{ text: t('common.ok'), onPress: () => {} }] 
      });
      return;
    }
    if (!data.category) {
      showAlert({ 
        title: t('common.error'), 
        message: t('wardrobe.categoryRequired'), 
        buttons: [{ text: t('common.ok'), onPress: () => {} }] 
      });
      return;
    }
    if (!data.color) {
      showAlert({ 
        title: t('common.error'), 
        message: t('wardrobe.colorRequired'), 
        buttons: [{ text: t('common.ok'), onPress: () => {} }] 
      });
      return;
    }

    setIsLoading(true);
    try {
      const newItem = {
        id: generateUniqueId(),
        name: data.name,
        category: data.category,
        color: data.color,
        season: data.season,
        style: data.style.join(','),
        notes: data.notes,
        imageUri: image, // Bu zaten optimize edilmiş ve kalıcı dizinde
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
      router.back();
    } catch (error) {
      console.error('Error adding clothing item:', error);
      showAlert({ 
        title: t('common.error'), 
        message: t('wardrobe.errorAddingItem'), 
        buttons: [{ text: t('common.ok'), onPress: () => {} }] 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('wardrobe.addItem')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={() => router.back()}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.imageSection}>
            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.clothingImage} />
                <TouchableOpacity style={[styles.removeImageButton, { backgroundColor: theme.colors.error }]} onPress={removeImage}>
                  <X color={theme.colors.white} size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.imagePlaceholderText, { color: theme.colors.textLight }]}>
                  {isOptimizing ? t('wardrobe.optimizingImage') : t('wardrobe.addPhoto')}
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
                disabled={isLoading || isOptimizing} 
              />
              <Button 
                icon={<ImageIcon color={theme.colors.text} size={20} />} 
                label={t('wardrobe.choosePhoto')} 
                onPress={pickImage} 
                variant="outline" 
                style={styles.imageButton} 
                disabled={isLoading || isOptimizing} 
              />
            </View>
            {isOptimizing && (
              <Text style={[styles.optimizingText, { color: theme.colors.textLight }]}>
                {t('wardrobe.optimizingInProgress')}
              </Text>
            )}
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
                  editable={!isLoading && !isOptimizing} 
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
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('wardrobe.color')}</Text>
              <Controller
                control={control}
                name="color"
                rules={{ required: t('wardrobe.colorRequired') as string }}
                render={({ field: { onChange, value } }) => (
                  <ColorPicker selectedColor={value} onSelectColor={onChange} error={errors.color?.message} />
                )}
              />
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
                rules={{ validate: (value) => value.length > 0 || (t('wardrobe.styleRequired') as string) }}
                render={({ field: { onChange, value } }) => (
                  <StylePicker selectedStyles={value} onSelectStyles={onChange} multiSelect={true} />
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
                  editable={!isLoading && !isOptimizing} 
                />
              )}
            />
            <Button 
              label={isLoading ? t('common.saving') : t('wardrobe.saveItem')} 
              onPress={handleSubmit(onSubmit)} 
              variant="primary" 
              style={styles.saveButton} 
              disabled={isLoading || isOptimizing} 
              loading={isLoading}
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
  optimizingText: { 
    fontFamily: 'Montserrat-Regular', 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: 8,
    fontStyle: 'italic'
  },
  formSection: { gap: 16 },
  sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 16, marginBottom: 8 },
  errorText: { fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 4 },
  saveButton: { marginTop: 16 },
});