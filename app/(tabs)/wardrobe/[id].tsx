// app/(tabs)/wardrobe/[id].tsx - Updated with pattern support

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
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

// Pattern/Color display component
const ColorPatternDisplay = ({ color, size = 16, theme }: {
    color: { name: string; hex: string },
    size?: number,
    theme: any
}) => {
    const circleStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: color.name === 'white' ? 1 : 0,
        borderColor: theme.colors.border,
        overflow: 'hidden' as const,
    };

    const renderContent = () => {
        switch (color.hex) {
            case 'pattern_leopard':
                return <Image source={require('@/assets/patterns/leopard.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_zebra':
                return <Image source={require('@/assets/patterns/zebra.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_snakeskin':
                return <Image source={require('@/assets/patterns/snake.webp')} style={styles.patternImage} resizeMode="cover" />;

            // --- YENİ EKLENEN DESENLER ---
            case 'pattern_striped':
                return <Image source={require('@/assets/patterns/cizgili.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_plaid':
                return <Image source={require('@/assets/patterns/ekose.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_floral':
                return <Image source={require('@/assets/patterns/flowers.webp')} style={styles.patternImage} resizeMode="cover" />;
            case 'pattern_polka_dot':
                return <Image source={require('@/assets/patterns/puantiye.webp')} style={styles.patternImage} resizeMode="cover" />;
            // --- BİTİŞ ---

            default:
                return <View style={{ backgroundColor: color.hex, width: '100%', height: '100%' }} />;
        }
    };

    return (
        <View style={circleStyle}>
            {renderContent()}
        </View>
    );
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
                    setImageLoadError(true);
                    setOriginalImageUri('');
                    return;
                }

                const exists = await checkImageExists(item.originalImagePath, false);

                if (exists) {
                    const uri = getImageUri(item.originalImagePath, false);
                    setOriginalImageUri(uri);
                } else {
                    setImageLoadError(true);
                    setOriginalImageUri('');
                }
            } catch (error) {
                console.error('❌ Error loading original image:', error);
                setImageLoadError(true);
                setOriginalImageUri('');
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

    const handleEdit = () => {
        router.push(`/wardrobe/edit/${id}`);
    };

    const handleDelete = () => {
        showAlert({
            title: t('wardrobe.deleteTitle'),
            message: t('wardrobe.deleteMessage'),
            buttons: [
                { text: t('common.cancel'), onPress: () => { }, variant: 'outline' },
                {
                    text: t('common.delete'),
                    onPress: () => {
                        removeClothing(id!);
                        if (router.canGoBack()) router.back();
                    },
                    variant: 'destructive',
                }
            ]
        });
    };

    const renderImageSection = () => {
        if (!item.originalImagePath) {
            return (
                <View style={[styles.placeholderContainer, { backgroundColor: theme.colors.card, height: 300, marginBottom: 16 }]}>
                    <ImageOff color={theme.colors.textLight} size={48} />
                    <Text style={[styles.placeholderText, { color: theme.colors.textLight }]}>{t('wardrobe.imageNotAvailable')}</Text>
                    <Button label={t('wardrobe.changePhoto')} onPress={handleEdit} variant="primary" style={{ marginTop: 24 }} icon={<RefreshCcw color={theme.colors.white} size={16} />} />
                </View>
            );
        }

        if (isLoadingImage) {
            return (
                <View style={[styles.imageContainer, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.card }]}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={[styles.loadingText, { color: theme.colors.textLight, marginTop: 12 }]}>{t('common.loading')}</Text>
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
                <Image
                    source={{ uri: originalImageUri }}
                    style={styles.image}
                    resizeMode="cover"
                    onError={(error) => {
                        console.error('Original image load error:', error.nativeEvent.error);
                        setImageLoadError(true);
                        setOriginalImageUri('');
                    }}
                />
                <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.primary }]} onPress={handleEdit}>
                    <Edit2 color={theme.colors.white} size={20} />
                </TouchableOpacity>
                <View style={[styles.imageInfo, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.imageInfoText, { color: theme.colors.textLight }]}>
                        {t('wardrobe.storedInApp', 'Stored in app')}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HeaderBar title={t('wardrobe.itemDetails')} leftIcon={<ArrowLeft color={theme.colors.text} size={24} />} onLeftPress={() => router.replace('/(tabs)/wardrobe')} rightIcon={<Trash2 color={theme.colors.error} size={24} />} onRightPress={handleDelete} />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderImageSection()}
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
                                    <View key={colorName} style={[styles.colorTag, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                                        <ColorPatternDisplay color={colorData} size={16} theme={theme} />
                                        <Text style={[styles.detailValue, { color: theme.colors.text, fontSize: 12 }]}>{t(`colors.${colorName}`)}</Text>
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
                    {item.notes && (
                        <View style={styles.notesContainer}>
                            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>{t('wardrobe.notes')}</Text>
                            <Text style={[styles.notes, { color: theme.colors.text }]}>{item.notes}</Text>
                        </View>
                    )}
                    <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>{t('wardrobe.addedOn')}</Text>
                        <Text style={[styles.detailValue, { color: theme.colors.text }]}>{formatDate(item.createdAt, i18n.language)}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 32 },
    imageContainer: { position: 'relative', width: '100%', height: 300, borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
    image: { width: '100%', height: '100%' },
    placeholderContainer: { width: '100%', height: 300, justifyContent: 'center', alignItems: 'center', borderRadius: 16, gap: 12, marginBottom: 16 },
    placeholderText: { fontFamily: 'Montserrat-Medium', fontSize: 16, textAlign: 'center' },
    loadingText: { fontFamily: 'Montserrat-Regular', fontSize: 14, textAlign: 'center' },
    editButton: { position: 'absolute', bottom: 16, right: 16, width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
    imageInfo: { position: 'absolute', bottom: 8, left: 8, padding: 8, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.7)' },
    imageInfoText: { fontSize: 12, fontFamily: 'Montserrat-Regular', color: '#FFFFFF', textAlign: 'center' },
    itemName: { fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, marginBottom: 24 },
    detailsContainer: { gap: 16 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontFamily: 'Montserrat-Medium', fontSize: 14 },
    detailValue: { fontFamily: 'Montserrat-SemiBold', fontSize: 14 },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '65%', gap: 8 },
    tag: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
    tagText: { fontFamily: 'Montserrat-Medium', fontSize: 12 },
    colorTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16, borderWidth: 1 },
    notesContainer: { marginTop: 8 },
    notes: { fontFamily: 'Montserrat-Regular', fontSize: 14, marginTop: 8, lineHeight: 20 },
    patternImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});