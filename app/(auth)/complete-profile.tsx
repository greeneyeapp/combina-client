import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import useAlertStore from '@/store/alertStore';

export default function CompleteProfileScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { updateUserInfo, user } = useAuth();
    const { show: showAlert } = useAlertStore();

    const [formData, setFormData] = useState({
        name: user?.name || '',
        gender: '',
        birthDate: new Date()
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const genderOptions = [
        { label: 'Cinsiyet Seçin', value: '' },
        { label: 'Erkek', value: 'male' },
        { label: 'Kadın', value: 'female' },
        { label: 'Belirtmek İstemiyorum', value: 'other' }
    ];

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData(prev => ({ ...prev, birthDate: selectedDate }));
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            showAlert({
                title: 'Hata',
                message: 'Lütfen adınızı girin',
                buttons: [{ text: 'Tamam' }]
            });
            return false;
        }

        if (!formData.gender) {
            showAlert({
                title: 'Hata',
                message: 'Lütfen cinsiyetinizi seçin',
                buttons: [{ text: 'Tamam' }]
            });
            return false;
        }

        // Yaş kontrolü (13-100 yaş arası)
        const today = new Date();
        const age = today.getFullYear() - formData.birthDate.getFullYear();
        const monthDiff = today.getMonth() - formData.birthDate.getMonth();
        const dayDiff = today.getDate() - formData.birthDate.getDate();
        
        const exactAge = age - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);

        if (exactAge < 13) {
            showAlert({
                title: 'Yaş Sınırı',
                message: 'Bu uygulama 13 yaş ve üzeri kullanıcılar içindir',
                buttons: [{ text: 'Tamam' }]
            });
            return false;
        }

        if (exactAge > 100) {
            showAlert({
                title: 'Geçersiz Tarih',
                message: 'Lütfen geçerli bir doğum tarihi girin',
                buttons: [{ text: 'Tamam' }]
            });
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            console.log('🔄 Updating user info...');
            
            await updateUserInfo({
                name: formData.name.trim(),
                gender: formData.gender,
                birthDate: formData.birthDate.toISOString()
            });

            console.log('✅ User info updated successfully');
            
            showAlert({
                title: 'Başarılı',
                message: 'Profil bilgileriniz güncellendi!',
                buttons: [{
                    text: 'Devam Et',
                    onPress: () => {
                        console.log('🚀 Redirecting to wardrobe...');
                        router.replace('/(tabs)/wardrobe');
                    }
                }]
            });

        } catch (error: any) {
            console.error('❌ Update error:', error);
            showAlert({
                title: 'Hata',
                message: 'Profil güncellenirken bir hata oluştu. Lütfen tekrar deneyin.',
                buttons: [{ text: 'Tamam' }]
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
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            Profili Tamamla
                        </Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                            Kişiselleştirilmiş deneyim için birkaç bilgi daha
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {/* Ad Soyad */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>
                                Ad Soyad
                            </Text>
                            <View style={[styles.inputContainer, { 
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.border
                            }]}>
                                <Text style={[styles.input, { color: theme.colors.text }]}>
                                    {formData.name}
                                </Text>
                            </View>
                        </View>

                        {/* Cinsiyet */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>
                                Cinsiyet
                            </Text>
                            <View style={[styles.inputContainer, { 
                                backgroundColor: theme.colors.surface,
                                borderColor: theme.colors.border
                            }]}>
                                <Picker
                                    selectedValue={formData.gender}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}
                                    style={[styles.picker, { color: theme.colors.text }]}
                                    dropdownIconColor={theme.colors.text}
                                >
                                    {genderOptions.map((option) => (
                                        <Picker.Item 
                                            key={option.value} 
                                            label={option.label} 
                                            value={option.value}
                                            color={theme.colors.text}
                                        />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        {/* Doğum Tarihi */}
                        <View style={styles.inputGroup}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>
                                Doğum Tarihi
                            </Text>
                            <TouchableOpacity
                                style={[styles.inputContainer, { 
                                    backgroundColor: theme.colors.surface,
                                    borderColor: theme.colors.border
                                }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Text style={[styles.input, { color: theme.colors.text }]}>
                                    {formatDate(formData.birthDate)}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            <DateTimePicker
                                value={formData.birthDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                                minimumDate={new Date(1920, 0, 1)}
                            />
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, { 
                                backgroundColor: theme.colors.primary,
                                opacity: loading ? 0.7 : 1
                            }]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    Profili Tamamla
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* Skip Button */}
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={() => router.replace('/(tabs)/wardrobe')}
                        >
                            <Text style={[styles.skipButtonText, { color: theme.colors.textSecondary }]}>
                                Şimdilik Atla
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    title: {
        fontSize: 28,
        fontFamily: 'Montserrat-Bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        fontFamily: 'Montserrat-Regular',
        textAlign: 'center',
        lineHeight: 24,
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontFamily: 'Montserrat-Medium',
        marginBottom: 8,
    },
    inputContainer: {
        borderWidth: 1,
        borderRadius: 12,
        minHeight: 52,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    input: {
        fontSize: 16,
        fontFamily: 'Montserrat-Regular',
        paddingVertical: 4,
    },
    picker: {
        fontSize: 16,
        fontFamily: 'Montserrat-Regular',
    },
    submitButton: {
        height: 52,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 16,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Montserrat-SemiBold',
    },
    skipButton: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 14,
        fontFamily: 'Montserrat-Regular',
        textDecorationLine: 'underline',
    },
});