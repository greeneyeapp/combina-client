// app/(tabs)/wardrobe/add.tsx - iPad için kartlı tasarım ve daha iyi yerleşim

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, KeyboardAvoidingView, Dimensions } from 'react-native'; // Dimensions eklendi
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { useUserPlanStore } from '@/store/userPlanStore';
import { Image as ImageIcon, ArrowLeft, X } from 'lucide-react-native';
import { useForm, Controller, FieldErrors } from 'react-hook-form';
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
import { commitTempImage, deleteTempImage } from '@/utils/fileSystemImageManager';

// YENİ: iPad tespiti için
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

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
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const { show: showAlert } = useAlertStore();
  const formSubmitted = useRef(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const [sectionPositions, setSectionPositions] = useState<Record<string, number>>({});

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      name: '', category: '', colors: [], season: [], style: [], notes: '',
    },
  });

  useEffect(() => {
    return () => {
      if (tempImageUri && !formSubmitted.current) {
        deleteTempImage(tempImageUri);
      }
    };
  }, [tempImageUri]);

  useFocusEffect(
    useCallback(() => {
      formSubmitted.current = false;
      reset({ name: '', category: '', colors: [], season: [], style: [], notes: '' });
      if (tempImageUri) {
        deleteTempImage(tempImageUri);
      }
      setTempImageUri(null);
      setIsLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: false }), 0);
    }, [reset])
  );

  const handleImageSelected = (uri: string) => {
    if (tempImageUri) {
        deleteTempImage(tempImageUri);
    }
    setTempImageUri(uri);
    setShowGalleryPicker(false);
  };

  const removeImage = () => {
    if (tempImageUri) {
      deleteTempImage(tempImageUri);
    }
    setTempImageUri(null);
  };

const onSubmit = async (data: FormData) => {
    // Resim kontrolü onInvalid içinde yapıldığı için buradaki tekrar kaldırıldı.
    setIsLoading(true);
    try {
      const finalImagePaths = await commitTempImage(tempImageUri!);
      formSubmitted.current = true;

      const newItem = {
        id: generateUniqueId(),
        name: data.name,
        category: data.category,
        color: data.colors[0],
        colors: data.colors,
        season: data.season,
        style: data.style.join(','),
        notes: data.notes,
        originalImagePath: finalImagePaths.originalPath,
        thumbnailImagePath: finalImagePaths.thumbnailPath,
        createdAt: new Date().toISOString(),
      };

      await addClothing(newItem);

      Toast.show({
        type: 'success', text1: t('common.success'), text2: t('wardrobe.itemAddedSuccessfully'),
        position: 'top', visibilityTime: 2000, topOffset: 50,
      });

      router.replace('/(tabs)/wardrobe');
    } catch (error) {
      console.error('❌ Error adding clothing item:', error);
      showAlert({ title: t('common.error'), message: t('wardrobe.errorAddingItem'), buttons: [{ text: t('common.ok') }] });
    } finally {
      setIsLoading(false);
    }
  };

  // --- YENİ: Hata durumunda tetiklenecek fonksiyon ---
  const onInvalid = (errors: FieldErrors<FormData>) => {
    // Alanların ekrandaki görsel sırası
    const fieldOrder: (keyof FormData | 'image')[] = ['image', 'name', 'category', 'colors', 'season', 'style'];
    
    let firstErrorField: string | null = null;
    let errorMessage: string | null = null;

    // Önce resmi manuel olarak kontrol et
    if (!tempImageUri) {
        firstErrorField = 'image';
        errorMessage = t('wardrobe.imageRequired');
    } else {
        // react-hook-form hatalarını sırayla kontrol et
        for (const field of fieldOrder) {
            if (errors[field as keyof FormData]) {
                firstErrorField = field;
                errorMessage = errors[field as keyof FormData]?.message || t('wardrobe.formInvalid');
                break;
            }
        }
    }

    if (firstErrorField) {
        const yPos = sectionPositions[firstErrorField];
        if (yPos !== undefined && scrollViewRef.current) {
            // Hatalı alana doğru kaydır (-20px yukarıda boşluk bırak)
            scrollViewRef.current.scrollTo({ y: yPos - 20, animated: true });
        }
        showAlert({
            title: t('common.error'),
            message: errorMessage || t('wardrobe.formInvalid'),
            buttons: [{ text: t('common.ok') }]
        });
    }
  };
  // --- YENİ KOD BİTTİ ---

  const renderImageSection = () => {
    if (tempImageUri) {
      return (
        <View style={styles.imageContainer}>
          <Image source={{ uri: tempImageUri }} style={styles.clothingImage} onError={(e) => console.error('Failed to load temp image:', e.nativeEvent.error)} />
          <TouchableOpacity style={[styles.removeImageButton, { backgroundColor: theme.colors.error }]} onPress={removeImage}>
            <X color={theme.colors.white} size={20} />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <TouchableOpacity style={[styles.imagePlaceholder, { backgroundColor: theme.colors.card }]} onPress={() => setShowGalleryPicker(true)}>
        <ImageIcon color={theme.colors.textLight} size={48} />
        <Text style={[styles.imagePlaceholderText, { color: theme.colors.textLight }]}>{t('wardrobe.addPhoto')}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('wardrobe.addItem')} leftIcon={<ArrowLeft color={theme.colors.text} size={24} />} onLeftPress={() => router.replace('/(tabs)/wardrobe')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* YENİ: Formu ortalayan ve genişliğini sınırlayan container */}
          <View style={styles.formContainer}>
            <View style={[styles.formSectionCard, { backgroundColor: theme.colors.card }]}>
              {renderImageSection()}
              <Button
                icon={<ImageIcon color={theme.colors.text} size={20} />}
                label={tempImageUri ? t('wardrobe.changePhoto') : t('wardrobe.choosePhoto')}
                onPress={() => setShowGalleryPicker(true)}
                variant="outline"
                style={styles.imageButton}
                disabled={isLoading}
              />
            </View>

            <View style={[styles.formSectionCard, { backgroundColor: theme.colors.card }]}>
              <Controller
                control={control} name="name" rules={{ required: t('wardrobe.nameRequired') as string }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('wardrobe.name')} placeholder={t('wardrobe.namePlaceholder')} onBlur={onBlur}
                    onChangeText={onChange} value={value} error={errors.name?.message} editable={!isLoading}
                  />
                )}
              />
            </View>
            
            <View style={[styles.formSectionCard, { backgroundColor: theme.colors.card }]}>
              <Controller
                control={control} name="category" rules={{ required: t('wardrobe.categoryRequired') as string }}
                render={({ field: { onChange, value } }) => (
                  <CategoryPicker
                    selectedCategory={value} onSelectCategory={onChange} error={errors.category?.message}
                    gender={userPlan?.gender as 'female' | 'male' | 'unisex' | undefined}
                  />
                )}
              />
            </View>

            <View style={[styles.formSectionCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('wardrobe.colors')}</Text>
              <Controller
                control={control} name="colors" rules={{ validate: (value) => (value && value.length > 0) || (t('wardrobe.colorRequired') as string) }}
                render={({ field: { onChange, value } }) => (
                  <ColorPicker
                    selectedColors={value || []} onSelectColors={onChange} multiSelect={true}
                    maxColors={3} error={errors.colors?.message}
                  />
                )}
              />
            </View>

            <View style={[styles.formSectionCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('wardrobe.season')}</Text>
              <Controller
                control={control} name="season" rules={{ validate: (value) => value.length > 0 || (t('wardrobe.seasonRequired') as string) }}
                render={({ field: { onChange, value } }) => <SeasonPicker selectedSeasons={value} onSelectSeason={onChange} />}
              />
              {errors.season && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.season.message}</Text>}
            </View>
            
            <View style={[styles.formSectionCard, { backgroundColor: theme.colors.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('wardrobe.style')}</Text>
              <Controller
                control={control} name="style" rules={{ validate: (value) => value.length > 0 || (t('wardrobe.styleRequired') as string) }}
                render={({ field: { onChange, value } }) => <StylePicker selectedStyles={value} onSelectStyles={onChange} multiSelect />}
              />
              {errors.style && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.style.message}</Text>}
            </View>

            <View style={[styles.formSectionCard, { backgroundColor: theme.colors.card }]}>
                <Controller
                  control={control} name="notes"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label={t('wardrobe.notes')} placeholder={t('wardrobe.notesPlaceholder')} onBlur={onBlur}
                      onChangeText={onChange} value={value} multiline numberOfLines={4} textAlignVertical="top" editable={!isLoading}
                    />
                  )}
                />
            </View>
            
            <Button
              label={isLoading ? t('common.saving') : t('wardrobe.saveItem')}
              onPress={handleSubmit(onSubmit, onInvalid)}
              variant="primary" style={styles.saveButton} disabled={isLoading} loading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <GalleryPicker isVisible={showGalleryPicker} onClose={() => setShowGalleryPicker(false)} onSelectImage={handleImageSelected} allowCamera={true} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollView: { flex: 1 },
  // DEĞİŞİKLİK: scrollContent artık formu ortalamak için kullanılıyor
  scrollContent: { 
    flexGrow: 1, 
    alignItems: 'center', // Yatayda ortala
    paddingVertical: 16,
  },
  // YENİ: Formun genişliğini kontrol eden stil
  formContainer: {
    width: '100%',
    maxWidth: isTablet ? 700 : undefined, // Tablette maksimum genişlik 700px
    paddingHorizontal: 16,
    gap: 16, // Kartlar arası boşluk
  },
  // YENİ: Her bir form bölümünü saran kart stili
  formSectionCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2.22,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 350,
    borderRadius: 12, // Kart içine uyumlu
    overflow: 'hidden',
    marginBottom: 16
  },
  clothingImage: { width: '100%', height: '100%' },
  removeImageButton: {
    position: 'absolute', top: 8, right: 8, width: 32, height: 32,
    borderRadius: 16, justifyContent: 'center', alignItems: 'center'
  },
  imagePlaceholder: {
    width: '100%', height: 350, borderRadius: 12, justifyContent: 'center',
    alignItems: 'center', marginBottom: 16, borderWidth: 2,
    borderStyle: 'dashed', borderColor: '#ddd'
  },
  imagePlaceholderText: {
    fontFamily: 'Montserrat-Medium', fontSize: 16, marginTop: 8,
  },
  imageButton: {
    width: '100%' // Butonun kart içinde tam genişlikte olmasını sağlar
  },
  sectionTitle: {
    fontFamily: 'Montserrat-Bold', fontSize: 16, marginBottom: 8,
  },
  errorText: {
    fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 4,
  },
  saveButton: {
    marginTop: 16,
    marginBottom: 32,
  },
});