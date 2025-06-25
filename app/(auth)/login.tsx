import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft } from 'lucide-react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebaseConfig';
import { router } from 'expo-router';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import useAlertStore from '@/store/alertStore';
import { useOnboardingStore } from '@/store/onboardingStore';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  
  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });
  
  const { show: showAlert } = useAlertStore();
  const { checkIfOnboardingCompleted, startOnboarding } = useOnboardingStore();

  const onEmailLogin = async (data: { email: string; password: string }) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);

      if (!userCredential.user.emailVerified) {
        showAlert({
          title: t('login.emailNotVerifiedTitle'),
          message: t('login.emailNotVerified'),
          buttons: [{ text: t('common.ok'), onPress: () => { } }]
        });
        await auth.signOut();
        return;
      }

      router.replace('/(tabs)/wardrobe');

      setTimeout(async () => {
        try {
          const hasCompleted = await checkIfOnboardingCompleted();
          if (!hasCompleted) {
            setTimeout(() => {
              startOnboarding();
            }, 1000);
          }
        } catch (error) {
          console.error('Onboarding check failed:', error);
        }
      }, 500);

    } catch (error: any) {
      showAlert({
        title: t('common.error'),
        message: t('login.loginError'),
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
          <Text style={[styles.title, { color: theme.colors.text }]}>{t('login.title')}</Text>
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
            <View style={styles.form}>
              <Controller
                control={control}
                rules={{ required: t('register.emailRequired') as string }}
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
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCorrect={false}
                    spellCheck={false}
                    autoFocus={false}
                    importantForAutofill="yes"
                  />
                )}
                name="email"
              />
              <Controller
                control={control}
                rules={{ required: t('register.passwordRequired') as string }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t('register.password')}
                    placeholder={t('register.passwordPlaceholder')}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                    secureTextEntry
                    textContentType="password"
                    autoComplete="current-password"
                    autoCorrect={false}
                    spellCheck={false}
                    importantForAutofill="yes"
                  />
                )}
                name="password"
              />
              <Button
                label={loading ? t('login.loading') : t('login.title')}
                onPress={handleSubmit(onEmailLogin)}
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
    padding: 24,
  },
  subtitle: { fontFamily: 'Montserrat-Regular', fontSize: 16, marginBottom: 24, textAlign: 'center' },
  form: { gap: 16 },
  button: { marginTop: 8 },
});