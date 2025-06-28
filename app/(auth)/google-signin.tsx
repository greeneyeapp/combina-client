import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native'; // Platform eklendi
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

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
    const [promptStarted, setPromptStarted] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: __DEV__ ? androidClientIdDev : androidClientIdProd,
        iosClientId: iosClientId,
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (Platform.OS !== 'web' && request && !promptStarted && !isProcessing) {
            console.log('🚀 Setting Auth Flow to ACTIVE and starting Google prompt...');
            setAuthFlowActive(true);
            setPromptStarted(true);
            promptAsync();
        }
    }, [request, promptStarted, isProcessing]);

    useEffect(() => {
        if (!response) return;

        console.log('✅ Google response received:', response.type);

        if (response.type === 'success' && response.authentication?.accessToken) {
            setIsProcessing(true);
            setStatusMessage(t('authFlow.googleSignIn.processing'));
            handleGoogleSignIn(response.authentication.accessToken);
        } else {
            console.log('Google auth failed or cancelled:', response.type);
            handleError();
        }
    }, [response]);

    const handleError = () => {
        console.log('🔄 Cleaning up auth flow and redirecting...');
        setAuthFlowActive(false);
        setIsProcessing(false);
        setTimeout(() => {
            router.replace('/(auth)');
        }, 100);
    };

    const handleGoogleSignIn = async (accessToken: string) => {
        try {
            setStatusMessage(t('authFlow.googleSignIn.gettingProfile'));

            console.log('🔑 Starting signInWithGoogle...');
            await signInWithGoogle(accessToken);
            console.log('✅ signInWithGoogle completed, cleaning up...');

            setStatusMessage(t('authFlow.googleSignIn.success'));
            setIsProcessing(false);

            console.log('🧹 Cleaning auth flow and redirecting...');
            setAuthFlowActive(false);

            setTimeout(() => {
                router.replace('/(auth)');
            }, 200);

        } catch (error: any) {
            console.error('❌ Google sign-in error:', error);
            handleError();

            const errorMessage = error.message?.includes('Network Error') || error.message?.includes('bağlanılamadı')
                ? t('authFlow.errors.networkError')
                : t('authFlow.errors.signInFailed');

            showAlert({
                title: t('common.error'),
                message: errorMessage,
                buttons: [{ text: t('common.ok') }]
            });
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