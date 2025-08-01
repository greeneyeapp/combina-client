// kodlar/app/(auth)/google-signin.tsx - Yönlendirme mantığı kaldırıldı

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Dimensions } from 'react-native';
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

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

WebBrowser.maybeCompleteAuthSession();

if (!Constants.expoConfig?.extra?.googleAuth) {
    throw new Error("Google Auth konfigürasyonu app.json dosyasında eksik! Lütfen kontrol edin.");
}

const { androidClientIdDev, androidClientIdProd, iosClientId } = Constants.expoConfig.extra.googleAuth;

export default function GoogleSignInScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { signInWithGoogle } = useAuth();
    const { show: showAlert } = useAlertStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(t('authFlow.googleSignIn.redirecting'));

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: __DEV__ ? androidClientIdDev : androidClientIdProd,
        iosClientId: iosClientId,
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (request) {
            promptAsync().catch(error => {
                console.error("promptAsync error:", error);
                router.replace('/(auth)');
            });
        }
    }, [request]);

    useEffect(() => {
        if (!response) return;
        if (response.type === 'success' && response.authentication?.accessToken) {
            setIsProcessing(true);
            handleGoogleSignIn(response.authentication.accessToken);
        } else if (response.type !== 'dismiss' && response.type !== 'cancel') { // Kullanıcı iptali normal bir durum
            console.log('Google auth failed or was cancelled:', response.type);
            router.replace('/(auth)');
        } else if (response.type === 'cancel' || response.type === 'dismiss') {
             router.replace('/(auth)');
        }
    }, [response]);

    const handleGoogleSignIn = async (accessToken: string) => {
        try {
            setStatusMessage(t('authFlow.googleSignIn.gettingProfile'));
            // --- DÜZELTME: Sadece giriş fonksiyonunu çağır. Yönlendirmeyi AuthContext yapacak. ---
            await signInWithGoogle(accessToken);
            // Yönlendirme kodu buradan tamamen kaldırıldı. AuthContext yönlendirmeyi yönetecek.
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
            // Bu ekran yönlendirme sonrası kaybolacağı için isProcessing'i false yapmaya gerek kalmayabilir,
            // ama güvenlik için kalabilir.
            setIsProcessing(false);
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
    loadingContainer: { alignItems: 'center', gap: 24 },
    iconContainer: {
        width: isTablet ? 120 : 80,
        height: isTablet ? 120 : 80,
        borderRadius: isTablet ? 60 : 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    mainStatus: {
        fontFamily: 'Montserrat-Bold',
        fontSize: isTablet ? 24 : 18,
        textAlign: 'center'
    },
    stepText: {
        fontFamily: 'Montserrat-Regular',
        fontSize: isTablet ? 18 : 14,
        textAlign: 'center',
        fontStyle: 'italic'
    },
});
