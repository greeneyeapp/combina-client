import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft } from 'lucide-react-native';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { auth } from '@/firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import useAlertStore from '@/store/alertStore';
import GenderPicker from '@/components/common/GenderPicker';
import axios from 'axios';
import API_URL from '@/config';

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: string;
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', gender: '' }
  });
  const password = watch('password');
  const { show: showAlert } = useAlertStore();

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      if (user) {
        await updateProfile(user, { displayName: data.name });

        const idToken = await user.getIdToken();

        const tokenResponse = await axios.post(`${API_URL}/token`, { id_token: idToken });
        const customJwt = tokenResponse.data.access_token;

        await axios.post(
          `${API_URL}/api/users/init-profile`,
          { fullname: data.name, gender: data.gender },
          { headers: { Authorization: `Bearer ${customJwt}` } }
        );

        await sendEmailVerification(user);

        showAlert({
          title: t('common.confirm'),
          message: t('register.emailVerificationSent'),
          buttons: [{
            text: t('common.ok'),
            onPress: async () => {
              await auth.signOut();
              router.replace('/(auth)');
            }
          }]
        });
      }
    } catch (error: any) {
      let errorMessage = t('register.genericError');
      if (error.code === 'auth/email-already-in-use') errorMessage = t('register.emailInUse');
      else if (error.code === 'auth/invalid-email') errorMessage = t('register.emailInvalid');
      else if (error.code === 'auth/weak-password') errorMessage = t('register.passwordLength');
      else console.error("Registration Error: ", error.response?.data || error.message);

      showAlert({
        title: t('common.error'),
        message: errorMessage,
        buttons: [{ text: t('common.ok'), onPress: () => { } }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('register.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.subtitle, { color: theme.colors.text }]}>{t('register.subtitle')}</Text>
            <View style={styles.form}>
              <Controller
                control={control}
                rules={{ required: t('register.nameRequired') as string }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input label={t('register.name')} placeholder={t('register.namePlaceholder')} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.name?.message} autoCapitalize="words" />
                )}
                name="name"
              />
              <Controller
                control={control}
                rules={{
                  required: t('register.emailRequired') as string,
                  pattern: { value: /\S+@\S+\.\S+/, message: t('register.emailInvalid') as string }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input label={t('register.email')} placeholder={t('register.emailPlaceholder')} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.email?.message} keyboardType="email-address" autoCapitalize="none" />
                )}
                name="email"
              />

              <View>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{t('register.gender')}</Text>
                <Controller
                  control={control}
                  name="gender"
                  rules={{ required: t('register.genderRequired') as string }}
                  render={({ field: { onChange, value } }) => (
                    <GenderPicker selectedValue={value} onSelect={onChange} />
                  )}
                />
                {errors.gender && <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.gender.message}</Text>}
              </View>

              <Controller
                control={control}
                rules={{
                  required: t('register.passwordRequired') as string,
                  minLength: { value: 8, message: t('register.passwordLength') as string }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input label={t('register.password')} placeholder={t('register.passwordPlaceholder')} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.password?.message} secureTextEntry />
                )}
                name="password"
              />
              <Controller
                control={control}
                rules={{
                  required: t('register.confirmPasswordRequired') as string,
                  validate: value => value === password || (t('register.passwordMismatch') as string)
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input label={t('register.confirmPassword')} placeholder={t('register.confirmPasswordPlaceholder')} onBlur={onBlur} onChangeText={onChange} value={value} error={errors.confirmPassword?.message} secureTextEntry />
                )}
                name="confirmPassword"
              />
              <Button label={loading ? t('login.loading') : t('register.createAccount')} onPress={handleSubmit(onSubmit)} variant="primary" style={styles.button} disabled={loading} />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 },
  backButton: { padding: 8 },
  title: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24 },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24
  },
  subtitle: { fontFamily: 'Montserrat-Regular', fontSize: 16, marginBottom: 24, textAlign: 'center' },
  form: { gap: 16 },
  sectionTitle: { fontFamily: 'Montserrat-Bold', fontSize: 16, marginBottom: 8, },
  errorText: { fontFamily: 'Montserrat-Regular', fontSize: 12, marginTop: 4, color: 'red' },
  button: { marginTop: 8 },
});