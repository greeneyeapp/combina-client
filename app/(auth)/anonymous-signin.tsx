// app/(auth)/anonymous-signin.tsx - NIHAI VE DÜZELTİLMİŞ VERSİYON

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
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const { signInAnonymously } = useAuth();
    const { show: showAlert } = useAlertStore();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState(t('authFlow.anonymousSignIn.processing'));

    useEffect(() => {
        handleAnonymousSignIn();
    }, []);

    const handleAnonymousSignIn = async () => {
        setIsProcessing(true);
        try {
            setStatusMessage(t('authFlow.anonymousSignIn.creating'));
            
            const initialUserData = {
              language: i18n.language,
              gender: 'unisex'
            };

            // Giriş işlemini tetikle. Yönlendirme kararını AuthContext verecek.
            await signInAnonymously(initialUserData);

            // Bu ekranda artık hiçbir yönlendirme kodu yok.
            
        } catch (error: any) {
            console.error('❌ Anonymous sign-in screen error:', error);
            showAlert({
                title: t('common.error'),
                message: t('authFlow.errors.signInFailed'),
                buttons: [{ text: t('common.ok') }]
            });
            // Hata durumunda güvenli bir şekilde ana giriş ekranına dön.
            router.replace('/(auth)');
        }
        // finally bloğu, yönlendirme merkezi olarak AuthContext'te olduğu için
        // gereksiz hale geldi.
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
                        <Text style={[styles.stepText, { color: theme.colors.textSecondary }]}>
                            {t('authFlow.anonymousSignIn.pleaseWait')}
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
