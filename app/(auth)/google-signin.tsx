// kodlar/app/(auth)/google-signin.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

if (!Constants.expoConfig?.extra?.googleAuth) {
    throw new Error("Google Auth konfigürasyonu app.json dosyasında eksik! Lütfen kontrol edin.");
}

const { androidClientIdDev, androidClientIdProd, iosClientId } = Constants.expoConfig.extra.googleAuth;

export default function GoogleSignInScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { signInWithGoogle, setAuthFlowActive } = useAuth();
    const { show: showAlert } = useAlertStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(t('authFlow.googleSignIn.redirecting'));

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: __DEV__ ? androidClientIdDev : androidClientIdProd,
        iosClientId: iosClientId,
        scopes: ['profile', 'email'],
    });

    // Google giriş ekranını tetikle
    useEffect(() => {
        if (request) {
            setAuthFlowActive(true);
            promptAsync().catch(error => {
                console.error("promptAsync error:", error);
                setAuthFlowActive(false);
                router.replace('/(auth)');
            });
        }
    }, [request]);

    // Google'dan gelen cevabı işle
    useEffect(() => {
        if (!response) return;

        if (response.type === 'success' && response.authentication?.accessToken) {
            setIsProcessing(true);
            handleGoogleSignIn(response.authentication.accessToken);
        } else {
            console.log('Google auth failed or cancelled:', response.type);
            setAuthFlowActive(false);
            router.replace('/(auth)');
        }
    }, [response]);

    const handleGoogleSignIn = async (accessToken: string) => {
        try {
            setStatusMessage(t('authFlow.googleSignIn.gettingProfile'));
            
            // ===== 🚀 DEĞİŞİKLİK BURADA 🚀 =====
            // signInWithGoogle'dan kullanıcı bilgisini al.
            const userInfo = await signInWithGoogle(accessToken);

            // Gelen kullanıcı bilgisine göre yönlendirme yap.
            if (userInfo && userInfo.gender && userInfo.birthDate) {
                // Profili tam ise ana sayfaya yönlendir.
                router.replace('/(tabs)/home');
            } else {
                // Profili eksikse tamamlama ekranına yönlendir.
                router.replace('/(auth)/complete-profile');
            }
        } catch (error: any) {
            console.error('❌ Google sign-in error:', error);
            const errorMessage = error.message?.includes('Network Error') || error.message?.includes('bağlanılamadı')
                ? t('authFlow.errors.networkError')
                : t('authFlow.errors.signInFailed');
            showAlert({
                title: t('common.error'),
                message: errorMessage,
                buttons: [{ text: t('common.ok') }]
            });
            // Hata durumunda ana giriş ekranına dön.
            router.replace('/(auth)');
        } finally {
            // Başarılı yönlendirme sonrası bu ekran kapanacağı için auth akışını bitiriyoruz.
            // Hata durumunda zaten yukarıda yönlendirme yapıldı.
            setAuthFlowActive(false);
        }
    };

    return (
        <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.loadingContainer}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.mainStatus, { color: theme.colors.text }]}>
                            {statusMessage}
                        </Text>
                        {isProcessing && (
                            <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                                {t('authFlow.googleSignIn.pleaseWait')}
                            </Text>
                        )}
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    loadingContainer: { alignItems: 'center', gap: 20 },
    iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    mainStatus: { fontFamily: 'Montserrat-Bold', fontSize: 18, textAlign: 'center' },
    stepText: { fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
});