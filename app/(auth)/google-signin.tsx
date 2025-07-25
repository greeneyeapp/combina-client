// kodlar/app/(auth)/google-signin.tsx - iPad için büyütülmüş ve orantılı tasarım

import React, { useState, useEffect } from 'react';
// YENİ: Dimensions modülü eklendi
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

// YENİ: iPad tespiti
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
                router.replace('/(auth)'); // Prompt başarısız olursa/iptal edilirse geri dön
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
            router.replace('/(auth)'); // Kimlik doğrulama başarılı değilse geri dön
        }
    }, [response]);

    const handleGoogleSignIn = async (accessToken: string) => {
        try {
            setStatusMessage(t('authFlow.googleSignIn.gettingProfile'));
            // signInWithGoogle artık kullanıcı objesini döndürüyor, onu yakalayalım.
            const signedInUser = await signInWithGoogle(accessToken); 
            
            // Başarılı giriş sonrası doğrudan yönlendirme yapalım.
            if (signedInUser && (!signedInUser.gender || !signedInUser.birthDate)) {
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
            router.replace('/(auth)'); // Hata durumunda auth sayfasına geri dön
        } finally {
            setIsProcessing(false);
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

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    loadingContainer: { alignItems: 'center', gap: 24 },
    iconContainer: {
        width: isTablet ? 120 : 80, // Büyüdü
        height: isTablet ? 120 : 80,
        borderRadius: isTablet ? 60 : 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10
    },
    mainStatus: {
        fontFamily: 'Montserrat-Bold',
        fontSize: isTablet ? 24 : 18, // Büyüdü
        textAlign: 'center'
    },
    stepText: {
        fontFamily: 'Montserrat-Regular',
        fontSize: isTablet ? 18 : 14, // Büyüdü
        textAlign: 'center',
        fontStyle: 'italic'
    },
});