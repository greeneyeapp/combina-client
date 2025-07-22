// app/(tabs)/wardrobe/[id].tsx - iPad için nihai ve tam düzeltilmiş kod

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { ArrowLeft, Edit2, Trash2, ImageOff, RefreshCcw, Image as ImageIcon } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import Button from '@/components/common/Button';
import { formatDate } from '@/utils/dateUtils';
import useAlertStore from '@/store/alertStore';
import { getImageUri, checkImageExists } from '@/utils/fileSystemImageManager';
import { ALL_COLORS } from '@/utils/constants';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// Pattern/Color display component (Değişiklik yok)
const ColorPatternDisplay = ({ color, size = 16, theme }: {
    color: { name: string; hex: string },
    size?: number,
    theme: any
}) => {
    const circleStyle = {
        width: size, height: size, borderRadius: size / 2,
        borderWidth: color.name === 'white' ? 1 : 0,
        borderColor: theme.colors.border,
        overflow: 'hidden' as const,
    };
    const renderContent = () => {
        switch (color.hex) {
            case 'pattern_leopard': return <Image source={require('@/assets/patterns/leopard.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_zebra': return <Image source={require('@/assets/patterns/zebra.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_snakeskin': return <Image source={require('@/assets/patterns/snake.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_striped': return <Image source={require('@/assets/patterns/cizgili.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_plaid': return <Image source={require('@/assets/patterns/ekose.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_floral': return <Image source={require('@/assets/patterns/flowers.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_polka_dot': return <Image source={require('@/assets/patterns/puantiye.webp')} style={styles.patternImage} resizeMode="cover" />;
            default: return <View style={{ backgroundColor: color.hex, width: '100%', height: '100%' }} />;
        }
    };
    return <View style={circleStyle}>{renderContent()}</View>;
};

export default function ClothingDetailScreen() {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { clothing, removeClothing } = useClothingStore();
    const { show: showAlert } = useAlertStore();
    const [originalImageUri, setOriginalImageUri] = useState<string>('');
    const [isLoadingImage, setIsLoadingImage] = useState(true);
    const [imageLoadError, setImageLoadError] = useState(false);
    const item = clothing.find((item) => item.id === id);

    useEffect(() => {
        if (!item) return;
        const loadOriginalImage = async () => {
            setIsLoadingImage(true);
            setImageLoadError(false);
            try {
                if (!item.originalImagePath) {
                    setImageLoadError(true); setOriginalImageUri(''); return;
                }
                const exists = await checkImageExists(item.originalImagePath, false);
                if (exists) {
                    const uri = getImageUri(item.originalImagePath, false);
                    setOriginalImageUri(uri);
                } else {
                    setImageLoadError(true); setOriginalImageUri('');
                }
            } catch (error) {
                console.error('❌ Error loading original image:', error);
                setImageLoadError(true); setOriginalImageUri('');
            } finally {
                setIsLoadingImage(false);
            }
        };
        loadOriginalImage();
    }, [item?.id, item?.originalImagePath]);

    if (!item) {
        return null;
    }

    const itemColors = item.colors && item.colors.length > 0 ? item.colors : [item.color];
    const stylesArray = item.style ? item.style.split(',') : [];
    const handleEdit = () => { router.push(`/wardrobe/edit/${id}`); };
    const handleDelete = () => {
        showAlert({
            title: t('wardrobe.deleteTitle'), message: t('wardrobe.deleteMessage'),
            buttons: [
                { text: t('common.cancel'), onPress: () => { }, variant: 'outline' },
                { text: t('common.delete'), onPress: () => { removeClothing(id!); if (router.canGoBack()) router.back(); }, variant: 'destructive' }
            ]
        });
    };

    const renderImageSection = () => {
        if (!item.originalImagePath) {
            return (
                <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.card }]}>
                    <ImageOff color={theme.colors.textLight} size={48} />
                    <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>{t('wardrobe.imageNotAvailable')}</Text>
                    <Button label={t('wardrobe.changePhoto')} onPress={handleEdit} variant="primary" style={{ marginTop: 24 }} icon={<RefreshCcw color={theme.colors.white} size={16} />} />
                </View>
            );
        }
        if (isLoadingImage) {
            return (
                <View style={[styles.imageContainer, styles.imageLoading, { backgroundColor: theme.colors.card }]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            );
        }
        if (imageLoadError || !originalImageUri) {
            return (
                <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.background }]}>
                    <ImageIcon color={theme.colors.textLight} size={48} />
                    <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>{t('wardrobe.imageNotAvailable')}</Text>
                    <Button label={t('wardrobe.changePhoto')} onPress={handleEdit} variant="primary" style={{ marginTop: 16 }} icon={<RefreshCcw color={theme.colors.white} size={16} />} />
                </View>
            );
        }
        return (
            <View style={styles.imageContainer}>
                <Image source={{ uri: originalImageUri }} style={styles.image} resizeMode="cover"
                    onError={(error) => {
                        console.error('Original image load error:', error.nativeEvent.error);
                        setImageLoadError(true); setOriginalImageUri('');
                    }}
                />
                <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.primary }]} onPress={handleEdit}>
                    <Edit2 color={theme.colors.white} size={20} />
                </TouchableOpacity>
            </View>
        );
    };

    // BU FONKSİYONU GÜNCELLEYİN
    const renderDetailsSection = () => (
        <View style={styles.detailsSection}>
            <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
            <View style={styles.detailsContainer}>
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>{t('wardrobe.category')}</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{t(`categories.${item.category}`)}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>{t('wardrobe.color', { count: itemColors.length })}</Text>
                    <View style={styles.tagContainer}>
                        {itemColors.map((colorName) => {
                            const colorData = ALL_COLORS.find(c => c.name === colorName);
                            if (!colorData) return null;
                            return (
                                <View key={colorName} style={[styles.colorTag, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                                    <ColorPatternDisplay color={colorData} size={16} theme={theme} />
                                    <Text style={[styles.detailValue, { color: theme.colors.text, marginLeft: 8 }]}>{t(`colors.${colorName}`)}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>{t('wardrobe.season')}</Text>
                    <View style={styles.tagContainer}>
                        {item.season.map((season) => (
                            <View key={season} style={[styles.tag, { backgroundColor: theme.colors.primaryLight }]}>
                                <Text style={[styles.tagText, { color: theme.colors.primary }]}>{t(`seasons.${season}`)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>{t('wardrobe.style')}</Text>
                    <View style={styles.tagContainer}>
                        {stylesArray.map((style) => (
                            <View key={style} style={[styles.tag, { backgroundColor: theme.colors.secondaryLight }]}>
                                <Text style={[styles.tagText, { color: theme.colors.secondary }]}>{t(`styles.${style}`)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
                {/* DEĞİŞİKLİK BURADA: Notes bölümü artık diğerleriyle aynı yapıyı kullanıyor */}
                {item.notes && (
                    <View style={[styles.detailRow, { alignItems: 'flex-start' }]}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>{t('wardrobe.notes')}</Text>
                        <Text style={[styles.notesValue, { color: theme.colors.text }]}>{item.notes}</Text>
                    </View>
                )}
                <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>{t('wardrobe.addedOn')}</Text>
                    <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatDate(item.createdAt, i18n.language)}</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HeaderBar title={t('wardrobe.itemDetails')} leftIcon={<ArrowLeft color={theme.colors.text} size={24} />} onLeftPress={() => router.replace('/(tabs)/wardrobe')} rightIcon={<Trash2 color={theme.colors.error} size={24} />} onRightPress={handleDelete} />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.contentWrapper}>
                    <View style={[styles.detailCard, { backgroundColor: theme.colors.card, padding: isTablet ? 8 : 4 }]}>
                        {renderImageSection()}
                    </View>
                    <View style={[styles.detailCard, { backgroundColor: theme.colors.card }]}>
                        {renderDetailsSection()}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// BU STİLLERİ GÜNCELLEYİN
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: {
        padding: 16,
        flexGrow: 1,
    },
    contentWrapper: {
        width: '100%',
        alignSelf: 'center',
        maxWidth: isTablet ? 700 : undefined,
        gap: 16,
        flex: 1,
        justifyContent: 'center',
    },
    detailCard: {
        borderRadius: 20,
        padding: isTablet ? 24 : 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    imageContainer: {
        position: 'relative',
        width: '100%',
        aspectRatio: 4 / 3, 
        borderRadius: 16,
        overflow: 'hidden',
    },
    imageLoading: {
        justifyContent: 'center',
        alignItems: 'center',
        aspectRatio: 4 / 3,
        borderRadius: 16,
    },
    image: { width: '100%', height: '100%' },
    placeholderContainer: { 
        width: '100%', 
        aspectRatio: 4 / 3,
        justifyContent: 'center', 
        alignItems: 'center', 
        borderRadius: 16, 
        gap: 12 
    },
    placeholderText: { fontFamily: 'Montserrat-Medium', fontSize: 16, textAlign: 'center' },
    editButton: { 
        position: 'absolute', bottom: 12, right: 12, width: 48, height: 48,
        borderRadius: 24, justifyContent: 'center', alignItems: 'center', 
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 
    },
    detailsSection: {},
    itemName: { 
        fontFamily: 'PlayfairDisplay-Bold', 
        fontSize: isTablet ? 40 : 24, 
        marginBottom: 32,
        textAlign: 'center',
    },
    detailsContainer: { gap: 24 },
    detailRow: { 
        flexDirection: 'row', justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottomWidth: 1,
        paddingBottom: 24,
        borderColor: '#eee'
    },
    detailLabel: { 
        fontFamily: 'Montserrat-Bold',
        fontSize: isTablet ? 18 : 14, 
        marginRight: 16,
    },
    detailValue: { 
        fontFamily: 'Montserrat-Regular',
        fontSize: isTablet ? 18 : 14, 
    },
    tagContainer: { 
        flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', 
        maxWidth: '70%', gap: 10 
    },
    tag: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
    tagText: { 
        fontFamily: 'Montserrat-Medium', 
        fontSize: isTablet ? 16 : 12 
    },
    colorTag: { 
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, 
        paddingVertical: 8, borderRadius: 18, borderWidth: 1, gap: 4 
    },
    // YENİ: Sağa hizalanmış notlar için özel stil
    notesValue: {
        fontFamily: 'Montserrat-Regular',
        fontSize: isTablet ? 18 : 14,
        lineHeight: isTablet ? 26 : 22,
        textAlign: 'right', // Metni sağa hizala
        flex: 1, // Esneklik vererek satırda kalan alanı doldurmasını sağla
    },
    patternImage: {
        width: '100%', height: '100%', resizeMode: 'cover',
    },
});