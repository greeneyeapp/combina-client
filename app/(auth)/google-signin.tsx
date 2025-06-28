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

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: '58339241217-doo7k2mr5219tonptrkmasmsrvja24k9.apps.googleusercontent.com',
        iosClientId: '58339241217-dvfh2fl5p2hfi9a6m0vaqnuf4esf53qk.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        if (request) {
            console.log('🚀 Setting Auth Flow to ACTIVE and starting Google prompt...');
            setAuthFlowActive(true);
            promptAsync();
        }
    }, [request]);

    useEffect(() => {
        if (!response) {
            return;
        }

        console.log('✅ Google response received.');

        if (response.type === 'success' && response.authentication?.accessToken) {
            // Immediately navigate to a stable screen to prevent the 404 error.
            // The main auth screen is a safe place to land temporarily.
            router.replace('/(auth)');

            // In the background, process the token. _layout.tsx will handle the final redirect.
            handleGoogleSignIn(response.authentication.accessToken).finally(() => {
                console.log('✅ Auth flow ended. Setting Auth Flow to INACTIVE.');
                setAuthFlowActive(false);
            });

        } else if (response.type === 'error' || response.type === 'dismiss') {
            console.log('OAuth dismissed or failed, navigating back.');
            setAuthFlowActive(false); // End the flow
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/(auth)');
            }
        } else {
            // Handle other unexpected responses
            setAuthFlowActive(false);
            showAlert({ title: 'Hata', message: 'Giriş sırasında beklenmedik bir hata oluştu.', buttons: [{ text: 'Tamam', onPress: () => router.replace('/(auth)') }] });
        }
    }, [response]);

    const handleGoogleSignIn = async (accessToken: string) => {
        try {
            await signInWithGoogle(accessToken);
            // The navigation logic is now fully handled by _layout.tsx
            // which will react to the user state change.
        } catch (error: any) {
            // The user has already been sent to the '(auth)' screen,
            // so showing an alert here is safe.
            showAlert({ title: 'Hata', message: 'Sunucu ile iletişimde bir sorun oluştu.', buttons: [{ text: 'Tamam' }] });
        }
    };

    // This UI will only be visible for a very short time before the Google prompt appears.
    return (
        <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.loadingContainer}>
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.mainStatus, { color: theme.colors.text }]}>
                            Google'a yönlendiriliyor...
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
    loadingContainer: { alignItems: 'center', gap: 20 },
    iconContainer: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    mainStatus: { fontFamily: 'Montserrat-Bold', fontSize: 18, textAlign: 'center' },
    stepText: { fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
});
