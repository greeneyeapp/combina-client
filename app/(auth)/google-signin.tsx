import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleSignInScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { signInWithGoogle, setAuthFlowActive } = useAuth();
    const { show: showAlert } = useAlertStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(t('authFlow.googleSignIn.redirecting'));
    const [promptStarted, setPromptStarted] = useState(false);

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: '58339241217-doo7k2mr5219tonptrkmasmsrvja24k9.apps.googleusercontent.com',
        iosClientId: '58339241217-dvfh2fl5p2hfi9a6m0vaqnuf4esf53qk.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (request && !promptStarted && !isProcessing) {
            console.log('🚀 Setting Auth Flow to ACTIVE and starting Google prompt...');
            setAuthFlowActive(true);
            setPromptStarted(true);
            promptAsync();
        }
    }, [request, promptStarted, isProcessing]);

    useEffect(() => {
        if (!response) {
            return;
        }

        console.log('✅ Google response received:', response.type);

        if (response.type === 'success' && response.authentication?.accessToken) {
            setIsProcessing(true);
            setStatusMessage(t('authFlow.googleSignIn.processing'));
            handleGoogleSignIn(response.authentication.accessToken);

        } else if (response.type === 'error') {
            console.log('OAuth error:', response.error);
            setAuthFlowActive(false);
            router.replace('/(auth)');
            
        } else if (response.type === 'dismiss') {
            console.log('OAuth dismissed by user');
            setAuthFlowActive(false);
            router.replace('/(auth)');
            
        } else {
            console.log('Unexpected OAuth response:', response);
            setAuthFlowActive(false);
            router.replace('/(auth)');
        }
    }, [response]);

    const handleGoogleSignIn = async (accessToken: string) => {
        try {
            setStatusMessage(t('authFlow.googleSignIn.gettingProfile'));
            
            await signInWithGoogle(accessToken);
            
            // Success! The navigation logic is handled by _layout.tsx
            // which will react to the user state change and redirect appropriately
            setStatusMessage(t('authFlow.googleSignIn.success'));
            
        } catch (error: any) {
            console.error('Google sign-in error:', error);
            
            setIsProcessing(false);
            setAuthFlowActive(false);
            
            const errorMessage = error.message?.includes('Network Error') || error.message?.includes('bağlanılamadı')
                ? t('authFlow.errors.networkError')
                : t('authFlow.errors.signInFailed');
            
            showAlert({ 
                title: t('common.error'), 
                message: errorMessage, 
                buttons: [{ 
                    text: t('common.ok'), 
                    onPress: () => router.replace('/(auth)') 
                }] 
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