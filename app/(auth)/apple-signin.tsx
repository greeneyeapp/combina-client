// kodlar/app/(auth)/apple-signin.tsx - iPad için büyütülmüş ve orantılı tasarım

import React, { useState, useEffect } from 'react';
// YENİ: Dimensions modülü eklendi
import { View, Text, StyleSheet, ActivityIndicator, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import * as AppleAuthentication from 'expo-apple-authentication';

// YENİ: iPad tespiti
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function AppleSignInScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { signInWithApple, setAuthFlowActive } = useAuth();
    const { show: showAlert } = useAlertStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(t('authFlow.appleSignIn.processing'));

    useEffect(() => {
        if (Platform.OS === 'ios') {
            setAuthFlowActive(true);
            handleAppleSignIn();
        } else {
            router.replace('/(auth)');
        }
    }, []);

    const handleAppleSignIn = async () => {
        setIsProcessing(true);
        let isSuccess = false;
        try {
            const credential = await AppleAuthentication.signInAsync({
                requestedScopes: [
                    AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                    AppleAuthentication.AppleAuthenticationScope.EMAIL,
                ],
            });

            setStatusMessage(t('authFlow.appleSignIn.pleaseWait'));
            await signInWithApple(credential);

        } catch (error: any) {
            console.error('❌ Apple sign-in error:', error);
            if (error.code !== 'ERR_CANCELED') {
                showAlert({
                    title: t('common.error'),
                    message: t('authFlow.errors.signInFailed'),
                    buttons: [{ text: t('common.ok') }]
                });
            }
        } finally {
            setIsProcessing(false);
            setAuthFlowActive(false);
            if (!isSuccess) {
                router.replace('/(auth)');
            }
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