// app/(auth)/anonymous-signin.tsx - Anonymous kullanıcı girişi için yeni ekran

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function AnonymousSignInScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { signInAnonymously, setAuthFlowActive } = useAuth();
    const { show: showAlert } = useAlertStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(t('authFlow.anonymousSignIn.processing'));

    useEffect(() => {
        setAuthFlowActive(true);
        handleAnonymousSignIn();
    }, []);

    const handleAnonymousSignIn = async () => {
        setIsProcessing(true);
        try {
            setStatusMessage(t('authFlow.anonymousSignIn.creating'));
            
            // TODO: Backend endpoint çağrısı burada yapılacak
            // Şimdilik mock response
            const mockAnonymousUser = {
                uid: `anonymous_${Date.now()}`,
                email: `anonymous_${Date.now()}@guest.app`,
                name: t('profile.guest'),
                fullname: t('profile.guest'),
                displayName: t('profile.guest'),
                gender: null,
                plan: 'free',
                provider: 'anonymous',
                isAnonymous: true
            };

            setStatusMessage(t('authFlow.anonymousSignIn.almostReady'));
            
            // 1 saniye bekle (UX için)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const signedInUser = await signInAnonymously(mockAnonymousUser);
            
            // Complete profile'a yönlendirme (gender seçimi için)
            if (signedInUser && !signedInUser.gender) {
                router.replace('/(auth)/complete-profile');
            } else {
                router.replace('/(tabs)/home');
            }

        } catch (error: any) {
            console.error('❌ Anonymous sign-in error:', error);
            showAlert({
                title: t('common.error'),
                message: t('authFlow.errors.signInFailed'),
                buttons: [{ text: t('common.ok') }]
            });
            router.replace('/(auth)');
        } finally {
            setIsProcessing(false);
            setAuthFlowActive(false);
        }
    };
    
    return (
        <LinearGradient 
            colors={[theme.colors.background, theme.colors.secondary]} 
            style={styles.gradient}
        >
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
                                {t('authFlow.anonymousSignIn.pleaseWait')}
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
    content: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 24 
    },
    loadingContainer: { 
        alignItems: 'center', 
        gap: 24 
    },
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