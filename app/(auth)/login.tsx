import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
// DİKKAT: Artık @react-native-firebase/auth kullanıyoruz
import auth from '@react-native-firebase/auth';
import HeaderBar from '@/components/common/HeaderBar';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { ArrowLeft } from 'lucide-react-native';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Telefonla giriş için state'ler
  const [confirm, setConfirm] = useState<any>(null); // Onay objesini saklamak için
  const [code, setCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onEmailLogin = async (data: { email: string, password: string }) => {
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(data.email, data.password);
    } catch (error: any) {
      Alert.alert(t('common.error'), t('login.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const signInWithPhoneNumber = async () => {
    setLoading(true);
    try {
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
      setConfirm(confirmation);
    } catch (error) {
       Alert.alert(t('common.error'), t('login.phoneError'));
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    if (!confirm) return;
    setLoading(true);
    try {
      await confirm.confirm(code);
    } catch (error) {
      Alert.alert(t('common.error'), t('login.codeError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('login.title')}
        leftIcon={<ArrowLeft size={24} color={theme.colors.text} />}
        onLeftPress={() => router.back()}
      />
      
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, loginMethod === 'email' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setLoginMethod('email')}>
          <Text style={[styles.toggleText, loginMethod === 'email' && { color: theme.colors.background }]}>{t('login.withEmail')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, loginMethod === 'phone' && { backgroundColor: theme.colors.primary }]}
          onPress={() => setLoginMethod('phone')}>
          <Text style={[styles.toggleText, loginMethod === 'phone' && { color: theme.colors.background }]}>{t('login.withPhone')}</Text>
        </TouchableOpacity>
      </View>

      {loginMethod === 'email' ? (
        <View style={styles.formContainer}>
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
              />
            )}
            name="password"
          />
          <Button
            label={t('login.title')}
            onPress={handleSubmit(onEmailLogin)}
            loading={loading}
            disabled={loading}
            variant="primary"
            style={{ marginTop: 24 }}
          />
        </View>
      ) : (
        <View style={styles.formContainer}>
          {!confirm ? (
            <>
              <Input
                label={t('login.phoneLabel')}
                placeholder={t('login.phonePlaceholder')} // Örn: +90 555 123 4567
                onChangeText={setPhoneNumber}
                value={phoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <Button
                label={t('login.sendCode')}
                onPress={signInWithPhoneNumber}
                loading={loading}
                disabled={loading || !phoneNumber}
                variant="primary"
                style={{ marginTop: 24 }}
              />
            </>
          ) : (
            <>
              <Input
                label={t('login.codeLabel')}
                placeholder="123456"
                onChangeText={setCode}
                value={code}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button
                label={t('login.confirmCode')}
                onPress={confirmCode}
                loading={loading}
                disabled={loading || code.length < 6}
                variant="primary"
                style={{ marginTop: 24 }}
              />
            </>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    formContainer: { padding: 24, gap: 16 },
    toggleContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      margin: 24,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#ccc'
    },
    toggleButton: {
      flex: 1,
      padding: 12,
      alignItems: 'center',
    },
    toggleText: {
      fontFamily: 'Montserrat-Medium',
      fontSize: 16,
    }
});