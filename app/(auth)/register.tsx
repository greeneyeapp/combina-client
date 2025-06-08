import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft } from 'lucide-react-native';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/firebaseConfig';

type FormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: data.name });
      }
    } catch (error: any) {
      const errorCode = error.code;
      let errorMessage = t('register.genericError');
      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = t('register.emailInUse');
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = t('register.emailInvalid');
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = t('register.passwordLength');
      }
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.secondary]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t('register.title')}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            {t('register.subtitle')}
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              rules={{
                required: t('register.nameRequired') as string,
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('register.name')}
                  placeholder={t('register.namePlaceholder')}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.name?.message}
                  autoCapitalize="words"
                />
              )}
              name="name"
            />

            <Controller
              control={control}
              rules={{
                required: t('register.emailRequired') as string,
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: t('register.emailInvalid') as string,
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('register.email')}
                  placeholder={t('register.emailPlaceholder')}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
              name="email"
            />

            <Controller
              control={control}
              rules={{
                required: t('register.passwordRequired') as string,
                minLength: {
                  value: 8,
                  message: t('register.passwordLength') as string,
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('register.password')}
                  placeholder={t('register.passwordPlaceholder')}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.password?.message}
                  secureTextEntry
                />
              )}
              name="password"
            />

            <Controller
              control={control}
              rules={{
                required: t('register.confirmPasswordRequired') as string,
                validate: value =>
                  value === password || (t('register.passwordMismatch') as string),
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label={t('register.confirmPassword')}
                  placeholder={t('register.confirmPasswordPlaceholder')}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  error={errors.confirmPassword?.message}
                  secureTextEntry
                />
              )}
              name="confirmPassword"
            />

            <Button
              label={loading ? t('login.loading') : t('register.createAccount')}
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              style={styles.button}
              disabled={loading}
            />
          </View>

          <View style={styles.loginPrompt}>
            <Text style={[styles.loginText, { color: theme.colors.text }]}>
              {t('register.alreadyHaveAccount')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={[styles.loginLink, { color: theme.colors.primary }]}>
                {t('login.title')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: { padding: 8 },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  subtitle: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    marginBottom: 24,
  },
  form: { gap: 16 },
  button: { marginTop: 8 },
  loginPrompt: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  loginText: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
  },
  loginLink: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    marginLeft: 4,
  },
});