import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// Google Auth istemcisi bilgilerini al
if (!Constants.expoConfig?.extra?.googleAuth) {
  throw new Error("Google Auth konfigürasyonu app.json dosyasında eksik! Lütfen kontrol edin.");
}
const { androidClientIdDev, androidClientIdProd, iosClientId } = Constants.expoConfig.extra.googleAuth;

WebBrowser.maybeCompleteAuthSession();

export default function RedirectScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { signInWithGoogle } = useAuth();
    const { show: showAlert } = useAlertStore();
    const params = useLocalSearchParams();

    const [statusMessage, setStatusMessage] = useState(t('authFlow.googleSignIn.redirecting'));

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: __DEV__ ? androidClientIdDev : androidClientIdProd,
        iosClientId: iosClientId,
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        const handleGoogleSignIn = async (accessToken: string) => {
            try {
                setStatusMessage(t('authFlow.googleSignIn.gettingProfile'));
                console.log('🔄 Processing Google access token from redirect screen...');
                
                await signInWithGoogle(accessToken);
                
                console.log('✅ Google sign-in successful. AuthContext will handle navigation.');
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
                router.replace('/(auth)');
            }
        };

        // Eğer bir auth yanıtı varsa, işlemi başlat
        if (response) {
            if (response.type === 'success' && response.authentication?.accessToken) {
                handleGoogleSignIn(response.authentication.accessToken);
            } else if (response.type !== 'dismiss' && response.type !== 'cancel') {
                console.log('Google auth failed or was cancelled:', response.type);
                router.replace('/(auth)');
            } else if (response.type === 'cancel' || response.type === 'dismiss') {
                router.replace('/(auth)');
            }
        } else if (params.code || params.access_token || params.state) {
            // Eğer URL'de parametreler varsa ama hook yanıtı henüz yoksa, promptAsync'i tetikle
            console.log('OAuth params detected, but no response yet. Waiting for hook.');
        } else {
            // Yönlendirme ekranı doğrudan açıldıysa, geri dön
            console.log('Redirect screen opened without OAuth params, redirecting back.');
            router.replace('/(auth)');
        }
    }, [response, params]);

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
                        <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                            {t('authFlow.googleSignIn.pleaseWait')}
                        </Text>
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