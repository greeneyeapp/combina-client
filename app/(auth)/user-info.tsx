import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useForm, Controller } from 'react-hook-form';
import { Calendar } from 'lucide-react-native';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';

type FormData = {
  name: string;
  gender: string;
  birthDate: Date;
};

export default function UserInfoScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { updateUserInfo } = useAuth();
  const { show: showAlert } = useAlertStore();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    defaultValues: { 
      name: '', 
      gender: '',
      birthDate: new Date(1990, 0, 1)
    }
  });
  
  const birthDate = watch('birthDate');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updateUserInfo({
        name: data.name,
        gender: data.gender,
        birthDate: data.birthDate.toISOString()
      });

      router.replace('/(tabs)/wardrobe');
    } catch (error: any) {
      showAlert({
        title: t('common.error'),
        message: t('auth.updateInfoError'),
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setValue('birthDate', selectedDate);
    }
  };

  const renderDoneButton = () => (
    <View style={styles.datePickerDoneButtonContainer}>
      <Button
        label={t('common.done')}
        onPress={() => setShowDatePicker(false)}
        variant="primary"
      />
    </View>
  );

  return (
    <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {t('auth.completeProfile')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textLight }]}>
              {t('auth.profileSubtitle')}
            </Text>

            <View style={styles.form}>
              <Controller
                control={control}
                rules={{ required: t('register.nameRequired') as string }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input 
                    label={t('register.name')} 
                    placeholder={t('register.namePlaceholder')} 
                    onBlur={onBlur} 
                    onChangeText={onChange} 
                    value={value} 
                    error={errors.name?.message} 
                    autoCapitalize="words"
                    textContentType="name"
                    autoComplete="name"
                  />
                )}
                name="name"
              />

              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t('register.gender')}
                </Text>
                <Controller
                  control={control}
                  name="gender"
                  rules={{ required: t('register.genderRequired') as string }}
                  render={({ field: { onChange, value } }) => (
                    <View style={styles.genderContainer}>
                      <TouchableOpacity
                        style={[
                          styles.genderButton,
                          { 
                            backgroundColor: value === 'female' ? theme.colors.primary : theme.colors.card,
                            borderColor: theme.colors.border
                          }
                        ]}
                        onPress={() => onChange('female')}
                      >
                        <Text style={[
                          styles.genderText, 
                          { color: value === 'female' ? theme.colors.background : theme.colors.text }
                        ]}>
                          {t('gender.female')}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.genderButton,
                          { 
                            backgroundColor: value === 'male' ? theme.colors.primary : theme.colors.card,
                            borderColor: theme.colors.border
                          }
                        ]}
                        onPress={() => onChange('male')}
                      >
                        <Text style={[
                          styles.genderText, 
                          { color: value === 'male' ? theme.colors.background : theme.colors.text }
                        ]}>
                          {t('gender.male')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                />
                {errors.gender && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.gender.message}</Text>}
              </View>

              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  {t('register.birthDate')}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    { 
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.border
                    }
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar color={theme.colors.textLight} size={20} />
                  <Text style={[styles.dateText, { color: theme.colors.text }]}>
                    {formatDate(birthDate)}
                  </Text>
                </TouchableOpacity>
                {errors.birthDate && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.birthDate.message}</Text>}
              </View>

              {showDatePicker && (
                <View>
                  <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                  />
                  {Platform.OS === 'ios' && renderDoneButton()}
                </View>
              )}

              <Button 
                label={loading ? t('common.saving') : t('auth.continueButton')} 
                onPress={handleSubmit(onSubmit)} 
                variant="primary" 
                style={styles.button} 
                disabled={loading} 
                loading={loading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, textAlign: 'center', marginBottom: 8 },
  subtitle: { fontFamily: 'Montserrat-Regular', fontSize: 16, marginBottom: 24, textAlign: 'center' },
  form: { gap: 16 },
  sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 16, marginBottom: 8 },
  genderContainer: { flexDirection: 'row', gap: 12 },
  genderButton: { flex: 1, paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  genderText: { fontFamily: 'Montserrat-Medium', fontSize: 16 },
  dateButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, gap: 12 },
  dateText: { fontFamily: 'Montserrat-Medium', fontSize: 16 },
  errorText: { fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 4 },
  button: { marginTop: 16 },
  datePickerDoneButtonContainer: { padding: 16 },
});