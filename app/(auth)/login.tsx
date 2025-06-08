import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { signInWithEmailAndPassword, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { app, auth } from '@/firebaseConfig';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import HeaderBar from '@/components/common/HeaderBar';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { ArrowLeft } from 'lucide-react-native';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  
  const recaptchaVerifier = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onEmailLogin = async (data: { email: string, password: string }) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
    } catch (error: any) {
      Alert.alert(t('common.error'), t('login.loginError'));
    } finally {
      setLoading(false);
    }
  };
  
  const sendVerificationCode = async () => {
    setLoading(true);
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verId = await phoneProvider.verifyPhoneNumber(phoneNumber, recaptchaVerifier.current!);
      setVerificationId(verId);
      Alert.alert(t('login.codeSentTitle'), t('login.codeSentMessage'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmVerificationCode = async () => {
    if (!verificationId) return;
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
    } catch (error: any) {
      Alert.alert(t('common.error'), t('login.codeError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FirebaseRecaptchaVerifierModal ref={recaptchaVerifier} firebaseConfig={app.options} />
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
          {!verificationId ? (
            <>
              <Input
                label={t('login.phoneLabel')}
                placeholder={t('login.phonePlaceholder')}
                onChangeText={setPhoneNumber}
                value={phoneNumber}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <Button
                label={t('login.sendCode')}
                onPress={sendVerificationCode}
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
                onChangeText={setVerificationCode}
                value={verificationCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button
                label={t('login.confirmCode')}
                onPress={confirmVerificationCode}
                loading={loading}
                disabled={loading || verificationCode.length < 6}
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