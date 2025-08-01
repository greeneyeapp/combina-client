// app/(auth)/complete-profile.tsx - Manuel navigation eklendi

import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Platform, ActivityIndicator, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, ChevronDown, User, CheckCircle, LogOut } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import Input from '@/components/common/Input';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function CompleteProfileScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { updateUserInfo, user, logout } = useAuth();
    const { show: showAlert } = useAlertStore();
    const { checkIfOnboardingCompleted, startOnboarding } = useOnboardingStore();
    const scrollViewRef = useRef<ScrollView>(null);

    const [formData, setFormData] = useState({
        name: '',
        gender: '',
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (user) {
            const userName = user.fullname || user.name || user.displayName || '';
            setFormData(prev => ({
                name: userName,
                gender: user.gender || '',
            }));
        }
    }, [user]);

    const genderOptions = [
        { label: t('gender.male'), value: 'male' },
        { label: t('gender.female'), value: 'female' },
        { label: t('gender.unisex'), value: 'unisex' }
    ];

    const handleNameChange = (text: string) => {
        setFormData(prev => ({ ...prev, name: text }));
        if (errors.name) {
            setErrors(prev => ({ ...prev, name: '' }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) {
            newErrors.name = t('auth.nameRequired');
        } else if (formData.name.trim().length < 2) {
            newErrors.name = t('auth.nameMinLength');
        }
        if (!formData.gender) {
            newErrors.gender = t('auth.genderRequired');
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGenderChange = (value: string) => {
        setFormData(prev => ({ ...prev, gender: value }));
        if (errors.gender) {
            setErrors(prev => ({ ...prev, gender: '' }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            const firstErrorKey = Object.keys(errors)[0];
            const firstErrorMessage = errors[firstErrorKey] || t('authFlow.errors.updateFailed');
            showAlert({
                title: t('common.error'),
                message: firstErrorMessage,
                buttons: [{ text: t('common.ok') }]
            });
            return;
        }

        setLoading(true);
        try {
            const updatedUser = await updateUserInfo({
                name: formData.name.trim(),
                gender: formData.gender,
            });

            Toast.show({
                type: 'success',
                text1: t('common.success'),
                text2: t('authFlow.completeProfile.success'),
                position: 'top'
            });

            // DÜZELTME: Profile update sonrası immediate navigation
            console.log('✅ Profile completed, navigating to home IMMEDIATELY...');
            router.replace('/(tabs)/home');

        } catch (error) {
            showAlert({
                title: t('common.error'),
                message: t('authFlow.errors.updateFailed'),
                buttons: [{ text: t('common.ok') }]
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={[theme.colors.background, theme.colors.secondary]}
            style={styles.gradient}
        >
            <SafeAreaView style={styles.container}>
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.contentWrapper}>
                        <View style={styles.header}>
                            <View style={[styles.progressContainer, { backgroundColor: theme.colors.surface }]}>
                                <View style={[styles.progressBar, { backgroundColor: theme.colors.primary }]} />
                            </View>
                            <Text style={[styles.title, { color: theme.colors.text }]}>
                                {t('authFlow.completeProfile.title')}
                            </Text>
                            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                                {t('authFlow.completeProfile.subtitle')}
                            </Text>
                        </View>
                        <View style={styles.formContainer}>
                            <View style={[styles.formCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={styles.cardHeader}>
                                    <User color={theme.colors.primary} size={isTablet ? 24 : 20} />
                                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                        {t('register.name')} <Text style={styles.required}>*</Text>
                                    </Text>
                                </View>
                                <Input value={formData.name} onChangeText={handleNameChange} error={errors.name} containerStyle={{ padding: 0, margin: 0 }} />
                                <Text style={[styles.helpText, { color: theme.colors.textSecondary, marginLeft: 0, marginTop: 8 }]}>
                                    {t('authFlow.completeProfile.nameFromAccount')}
                                </Text>
                            </View>
                            <View style={[styles.formCard, { backgroundColor: theme.colors.surface, borderColor: errors.gender ? theme.colors.error : 'transparent', borderWidth: errors.gender ? 1 : 0 }]}>
                                <View style={styles.cardHeader}>
                                    <View style={[styles.genderIcon, { backgroundColor: theme.colors.primaryLight }]}><Text style={[styles.genderEmoji, { color: theme.colors.primary }]}>{formData.gender === 'male' ? '👨' : formData.gender === 'female' ? '👩' : '👤'}</Text></View>
                                    <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{t('register.gender')} <Text style={styles.required}>*</Text></Text>
                                    {formData.gender && <CheckCircle color={theme.colors.success} size={isTablet ? 20 : 16} />}
                                </View>
                                <View style={styles.genderOptions}>
                                    {genderOptions.map(option => (
                                        <TouchableOpacity key={option.value} style={[styles.genderOption, { backgroundColor: formData.gender === option.value ? theme.colors.primaryLight : theme.colors.background, borderColor: formData.gender === option.value ? theme.colors.primary : theme.colors.border, }]} onPress={() => handleGenderChange(option.value)} activeOpacity={0.7}>
                                            <Text style={[styles.genderOptionText, { color: formData.gender === option.value ? theme.colors.primary : theme.colors.text }]}>{option.label}</Text>
                                            {formData.gender === option.value && (<CheckCircle color={theme.colors.primary} size={isTablet ? 20 : 16} />)}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {errors.gender && (<Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.gender}</Text>)}
                            </View>
                        </View>
                        <View style={styles.actionSection}>
                            <TouchableOpacity style={[styles.submitButton, { backgroundColor: theme.colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
                                {loading ? (<ActivityIndicator size="small" color="#FFFFFF" />) : (<Text style={styles.submitButtonText}>{t('authFlow.completeProfile.title')}</Text>)}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.logoutButton} onPress={logout}><LogOut color={theme.colors.textSecondary} size={16} /><Text style={[styles.logoutText, { color: theme.colors.textSecondary }]}>{t('profile.logout')}</Text></TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

// Styles remain the same
const styles = StyleSheet.create({
    gradient: { flex: 1 },
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    contentWrapper: {
        width: '100%',
        maxWidth: isTablet ? 600 : undefined,
        alignSelf: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 10,
    },
    progressContainer: { width: 80, height: 4, borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
    progressBar: { width: '60%', height: '100%', borderRadius: 2 },
    title: {
        fontSize: isTablet ? 36 : 28,
        fontFamily: 'PlayfairDisplay-Bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: isTablet ? 18 : 16,
        fontFamily: 'Montserrat-Regular',
        textAlign: 'center',
        lineHeight: isTablet ? 28 : 22,
        paddingHorizontal: 20,
    },
    formContainer: { flex: 1, gap: 20 },
    formCard: {
        borderRadius: 20,
        padding: isTablet ? 24 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    cardTitle: {
        fontSize: isTablet ? 18 : 16,
        fontFamily: 'Montserrat-SemiBold',
        flex: 1,
    },
    cardContent: { marginLeft: isTablet ? 40 : 32 },
    helpText: { fontSize: isTablet ? 14 : 12, fontFamily: 'Montserrat-Regular', fontStyle: 'italic' },
    genderIcon: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    genderEmoji: { fontSize: 14, fontWeight: 'bold' },
    genderOptions: { gap: 12 },
    genderOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: isTablet ? 20 : 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    genderOptionText: {
        fontSize: isTablet ? 18 : 16,
        fontFamily: 'Montserrat-Medium',
    },
    actionSection: { marginTop: 32, gap: 16 },
    submitButton: {
        height: isTablet ? 64 : 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: isTablet ? 18 : 16,
        fontFamily: 'Montserrat-Bold',
    },
    errorText: {
        fontSize: isTablet ? 14 : 12,
        fontFamily: 'Montserrat-Regular',
        marginTop: 8,
        marginLeft: 40,
    },
    required: { color: '#FF6B6B', fontSize: isTablet ? 18 : 16 },
    logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, gap: 8 },
    logoutText: { fontFamily: 'Montserrat-Medium', fontSize: isTablet ? 16 : 14, textDecorationLine: 'underline' },
});