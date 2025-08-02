// app/(auth)/anonymous-signin.tsx - Profile complete kontrolü eklendi

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

const ANONYMOUS_USER_ID_KEY = 'anonymous_user_id';

export default function AnonymousSignInScreen() {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const { signInAnonymously, user, isInitialized } = useAuth();
    const { show: showAlert } = useAlertStore();

    const [statusMessage, setStatusMessage] = useState('');
    const [isReturningUser, setIsReturningUser] = useState(false);

    const checkIfReturningUser = async (): Promise<boolean> => {
        try {
            const existingId = await AsyncStorage.getItem(ANONYMOUS_USER_ID_KEY);
            console.log('🔍 Checking existing anonymous ID:', existingId);
            return !!existingId && existingId.startsWith('anon_');
        } catch (error) {
            console.error('❌ Error checking anonymous ID:', error);
            return false;
        }
    };

    // YENİ: Oturum açma işlemini başlatan useEffect
    useEffect(() => {
        const handleAnonymousSignIn = async () => {
            try {
                const isReturning = await checkIfReturningUser();
                setIsReturningUser(isReturning);
                setStatusMessage(isReturning
                    ? t('authFlow.anonymousSignIn.resumingSession')
                    : t('authFlow.anonymousSignIn.creating')
                );

                const existingAnonymousId = await AsyncStorage.getItem(ANONYMOUS_USER_ID_KEY);
                const initialUserData = {
                    language: i18n.language,
                    gender: 'unisex',
                    anonymous_id: existingAnonymousId
                };

                // DÜZELTME: signInAnonymously'nin return değerini al
                const userInfo = await signInAnonymously(initialUserData);
                
                console.log('✅ Anonymous sign-in successful:', {
                    uid: userInfo.uid,
                    profileComplete: userInfo.profile_complete
                });
                
                // DÜZELTME: Profile complete durumuna göre navigation
                console.log('🚀 IMMEDIATE navigation from anonymous-signin...');
                if (userInfo.profile_complete) {
                    console.log('🏠 Anonymous profile complete, redirecting to home IMMEDIATELY');
                    router.replace('/(tabs)/home');
                } else {
                    console.log('📝 Anonymous profile incomplete, redirecting to complete-profile IMMEDIATELY');
                    router.replace('/(auth)/complete-profile');
                }
                
            } catch (error: any) {
                console.error('❌ Anonymous sign-in screen error:', error);
                showAlert({
                    title: t('common.error'),
                    message: t('authFlow.errors.signInFailed'),
                    buttons: [{ text: t('common.ok') }]
                });
                router.replace('/(auth)');
            }
        };

        // Yönlendirme zaten yapıldıysa veya kullanıcı zaten varsa, tekrar başlatma
        if (!user && isInitialized) {
            handleAnonymousSignIn();
        }
    }, [i18n, user, isInitialized]);

    // YENİ: Navigasyon için bekleyen useEffect
    useEffect(() => {
        if (user) {
            console.log('✅ Anonymous user logged in, navigating away from this screen.');
            // Bu ekranı router.replace() ile kapatıyoruz. Yönlendirme AuthContext'ten gelecek.
            // Bu sayede ekran takılı kalmayacak.
        }
    }, [user, isInitialized]);

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
                            {isReturningUser
                                ? t('authFlow.anonymousSignIn.welcomeBack')
                                : t('authFlow.anonymousSignIn.pleaseWait')
                            }
                        </Text>

                        {isReturningUser && (
                            <Text style={[styles.infoText, { color: theme.colors.textLight }]}>
                                {t('authFlow.anonymousSignIn.returningUserInfo')}
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
        gap: 16,
        maxWidth: isTablet ? 400 : 300
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
    infoText: {
        fontFamily: 'Montserrat-Regular',
        fontSize: isTablet ? 14 : 12,
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 8,
        lineHeight: isTablet ? 20 : 16
    }
});