// kodlar/app/(auth)/apple-signin.tsx - Çeviri anahtarı düzeltildi

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import * as AppleAuthentication from 'expo-apple-authentication';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function AppleSignInScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { signInWithApple } = useAuth();
    const { show: showAlert } = useAlertStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(t('authFlow.appleSignIn.processing'));

    useEffect(() => {
        if (Platform.OS === 'ios') {
            handleAppleSignIn();
        } else {
            router.replace('/(auth)');
        }
    }, []);

    const handleAppleSignIn = async () => {
        setIsProcessing(true);
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            // DEĞİŞİKLİK: Var olan çeviri anahtarı kullanıldı
            setStatusMessage(t('authFlow.appleSignIn.pleaseWait'));
            const signedInUser = await signInWithApple(credential); 
            
            if (signedInUser && (!signedInUser.gender || !signedInUser.name)) {
                router.replace('/(auth)/complete-profile');
            } else {
                router.replace('/(tabs)/home');
            }

        } catch (error: any) {
            console.error('❌ Apple sign-in error:', error);
            if (error.code !== 'ERR_CANCELED') {
                showAlert({
                    title: t('common.error'),
                    message: t('authFlow.errors.signInFailed'),
                    buttons: [{ text: t('common.ok') }]
                });
            }
            router.replace('/(auth)');
        } finally {
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
                                {t('authFlow.appleSignIn.pleaseWait')}
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
