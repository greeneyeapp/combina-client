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
    const { signInWithGoogle } = useAuth();
    const { show: showAlert } = useAlertStore();
    const [loading, setLoading] = useState(false);


    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: '58339241217-doo7k2mr5219tonptrkmasmsrvja24k9.apps.googleusercontent.com',
        iosClientId: '58339241217-dvfh2fl5p2hfi9a6m0vaqnuf4esf53qk.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
    });

    useEffect(() => {
        console.log('=== Simple Google Auth ===');
        console.log('Request ready:', !!request);
        console.log('Response:', response);

        if (response?.type === 'success') {
            console.log('✅ OAuth Success!');

            if (response.authentication?.accessToken) {
                console.log('✅ Access token received');
                handleGoogleSignIn(response.authentication.accessToken);
            } else {
                console.error('❌ No access token');
                showAlert({
                    title: 'Hata',
                    message: 'Access token alınamadı',
                    buttons: [{ text: 'Tamam', onPress: () => router.back() }]
                });
            }
        } else if (response?.type === 'error') {
            console.error('❌ OAuth Error:', response.error);

            if (response.error?.message?.includes('access_denied')) {
                router.back();
                return;
            }

            showAlert({
                title: 'Hata',
                message: 'Google giriş hatası',
                buttons: [{ text: 'Tamam', onPress: () => router.back() }]
            });
        } else if (response?.type === 'dismiss') {
            router.back();
        }
    }, [response]);

    const handleGoogleSignIn = async (accessToken: string) => {
        setLoading(true);
        try {
            console.log('🔄 Sending token to backend...');

            const userInfo = await signInWithGoogle(accessToken);
            console.log('✅ Backend success');
            console.log('👤 User Info:', userInfo);

            // Backend'den gelen user info'yu kontrol et
            console.log('Gender:', userInfo?.gender);
            console.log('BirthDate:', userInfo?.birthDate);

            if (!userInfo.gender || !userInfo.birthDate) {
                console.log('❌ Missing user info, redirecting to complete-profile');
                router.replace('/(auth)/complete-profile');
            } else {
                console.log('✅ User info complete, redirecting to wardrobe');
                router.replace('/(tabs)/wardrobe');
            }
        } catch (error: any) {
            console.error('❌ Backend error:', error);

            showAlert({
                title: 'Hata',
                message: 'Sunucu hatası',
                buttons: [{ text: 'Tamam', onPress: () => router.back() }]
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (request) {
            console.log('🚀 Starting simple Google auth...');
            promptAsync();
        }
    }, [request]);

    return (
        <LinearGradient colors={[theme.colors.background, theme.colors.secondary]} style={styles.gradient}>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                        {loading ? 'Backend\'e gönderiliyor...' : 'Google ile giriş yapılıyor...'}
                    </Text>

                    {__DEV__ && (
                        <View style={styles.debugContainer}>
                            <Text style={[styles.debugText, { color: theme.colors.text }]}>
                                Method: Simple Web Client
                            </Text>
                            <Text style={[styles.debugText, { color: theme.colors.text }]}>
                                Status: {response?.type || 'Waiting...'}
                            </Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    loadingText: {
        fontFamily: 'Montserrat-Medium',
        fontSize: 16,
        marginTop: 16,
        textAlign: 'center'
    },
    debugContainer: {
        marginTop: 20,
        padding: 15,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 8,
    },
    debugText: {
        fontSize: 12,
        opacity: 0.8,
        marginBottom: 4,
        textAlign: 'center',
    }
});