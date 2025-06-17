import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft } from 'lucide-react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { router } from 'expo-router';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import useAlertStore from '@/store/alertStore';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '' },
  });
  const { show: showAlert } = useAlertStore();

  const onSubmit = async (data: { email: string }) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      showAlert({
        title: t('forgotPassword.successTitle'),
        message: t('forgotPassword.successMessage'),
        buttons: [{
          text: t('common.ok'),
          onPress: () => router.replace('/(auth)/login'),
        }]
      });
    } catch (error: any) {
      let errorMessage = t('forgotPassword.genericError');
      if (error.code === 'auth/user-not-found') {
        errorMessage = t('forgotPassword.userNotFound');
      }
      showAlert({
        title: t('common.error'),
        message: errorMessage,
        buttons: [{ text: t('common.ok'), onPress: () => {} }]
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
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('forgotPassword.title')}</Text>
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
            <Text style={[styles.subtitle, { color: theme.colors.text }]}>{t('forgotPassword.subtitle')}</Text>
            <View style={styles.form}>
              <Controller
                control={control}
                rules={{
                  required: t('register.emailRequired') as string,
                  pattern: { value: /\S+@\S+\.\S+/, message: t('register.emailInvalid') as string }
                }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('forgotPassword.emailLabel')}
                    placeholder={t('forgotPassword.emailPlaceholder')}
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
              <Button
                label={loading ? t('login.loading') : t('forgotPassword.sendLink')}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                variant="primary"
                style={styles.button}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
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
  button: { marginTop: 8 },
});