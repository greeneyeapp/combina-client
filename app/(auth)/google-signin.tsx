// kodlar/app/(auth)/google-signin.tsx - Yönlendirme mantığı iyileştirilmiş

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
    const { signInWithGoogle, setAuthFlowActive } = useAuth();
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
            setAuthFlowActive(true);
            promptAsync().catch(error => {
                console.error("promptAsync error:", error);
                setAuthFlowActive(false);
                router.replace('/(auth)');
            });
        }
    }, [request]);

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
            setStatusMessage(t('authFlow.googleSignIn.verifying'));
            const signedInUser = await signInWithGoogle(accessToken); 
            
            // DÖNEN KULLANICI BİLGİSİNE GÖRE YÖNLENDİRME
            if (signedInUser && (!signedInUser.gender || !signedInUser.name)) {
                router.replace('/(auth)/complete-profile');
            } else {
                router.replace('/(tabs)/home');
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
            router.replace('/(auth)');
        } finally {
            setIsProcessing(false);
            setAuthFlowActive(false);
        }
    };
    
    // ... (Geri kalan kod aynı)
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