import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/context/AuthContext';
import HeaderBar from '@/components/common/HeaderBar';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', email: '', password: '' },
  });

  const onRegister = async (data) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: data.name });
      }
      // Yönlendirmeyi ana _layout.tsx yapacak
    } catch (error: any) {
      console.error(error);
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('register.title')}
        leftIcon={<ArrowLeft size={24} color={theme.colors.text} />}
        onLeftPress={() => router.back()}
      />
      <View style={styles.formContainer}>
        <Controller
          control={control}
          rules={{ required: t('register.nameRequired') }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('register.name')}
              placeholder={t('register.namePlaceholder')}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.name?.message}
            />
          )}
          name="name"
        />
        <Controller
          control={control}
          rules={{ required: t('register.emailRequired'), pattern: { value: /^\S+@\S+$/i, message: t('register.emailInvalid') } }}
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
          rules={{ required: t('register.passwordRequired'), minLength: { value: 6, message: t('register.passwordLength') } }}
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
        <Button
          label={t('register.createAccount')}
          onPress={handleSubmit(onRegister)}
          loading={loading}
          disabled={loading}
          variant="primary"
          style={{ marginTop: 24 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  formContainer: { padding: 24, gap: 16 },
});
