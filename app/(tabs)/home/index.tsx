// app/(tabs)/home/index.tsx - Modal yönlendirme sorunu düzeltildi

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import {
    Shirt,
    Lightbulb,
    Sparkles,
    Crown,
    Plus,
    History,
    HardDrive,
} from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import { useRevenueCat } from '@/context/RevenueCatContext';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const { currentPlan, isLoading: isPlanLoading } = useRevenueCat();

    const getFeatureCards = () => {
        const baseCards = [
            {
                id: 'wardrobe',
                title: t('home.wardrobeTitle', 'Build Your Wardrobe'),
                subtitle: t('home.wardrobeSubtitle', 'Add your clothes to get started'),
                icon: <Shirt size={32} color={theme.colors.white} />,
                gradient: [theme.colors.primary, theme.colors.secondary],
                onPress: () => router.push('/(tabs)/wardrobe'),
            },
            {
                id: 'suggestions',
                title: t('home.suggestionsTitle', 'Get Outfit Ideas'),
                subtitle: t('home.suggestionsSubtitle', 'AI-powered style suggestions'),
                icon: <Lightbulb size={32} color={theme.colors.white} />,
                gradient: ['#F1C93B', '#FF8A65'],
                onPress: () => router.push('/(tabs)/suggestions'),
            },
        ];

        if (currentPlan === 'premium') {
            baseCards.push({
                id: 'history-premium',
                title: t('home.historyTitle', 'Outfit History'),
                subtitle: t('home.historySubtitle', 'Track your style journey'),
                icon: <History size={32} color={theme.colors.white} />,
                gradient: ['#6366F1', '#8B5CF6'],
                onPress: () => router.push('/(tabs)/history'),
            });
        } else {
            baseCards.push({
                id: 'premium',
                title: t('home.premiumTitle', 'Upgrade Style'),
                subtitle: t('home.premiumSubtitle', 'Unlock premium features'),
                icon: <Crown size={32} color={theme.colors.white} />,
                gradient: ['#F59E0B', '#FBBF24'],
                // ÇÖZÜM: router.push yerine router.navigate kullanılıyor.
                onPress: () => router.navigate('/subscription'),
            });
        }

        return baseCards;
    };

    const quickActions = [
        {
            id: 'add-item',
            title: t('home.addItemTitle', 'Add New Item'),
            icon: <Plus size={20} color={theme.colors.primary} />,
            onPress: () => router.push('/wardrobe/add' as any),
        },
        {
            id: 'storage',
            title: t('home.storageTitle', 'Storage Management'),
            icon: <HardDrive size={20} color={theme.colors.primary} />,
            // ÇÖZÜM: router.push yerine router.navigate kullanılıyor.
            onPress: () => router.navigate('/storage'),
        },
    ];

    const renderFeatureCard = (card: ReturnType<typeof getFeatureCards>[0], index: number) => (
        <TouchableOpacity
            key={card.id}
            style={[styles.featureCard, { marginBottom: index === getFeatureCards().length - 1 ? 0 : 16 }]}
            onPress={card.onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={card.gradient}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                <View style={styles.cardContent}>
                    <View style={styles.cardLeft}>
                        <View style={styles.cardIconContainer}>
                            {card.icon}
                        </View>
                        <View style={styles.cardTextContainer}>
                            <Text style={styles.cardTitle}>{card.title}</Text>
                            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                        </View>
                    </View>
                    <View style={styles.cardAction}>
                        <Sparkles size={20} color={theme.colors.white} />
                    </View>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );

    const renderQuickAction = (action: typeof quickActions[0]) => (
        <TouchableOpacity
            key={action.id}
            style={[styles.quickActionCard, { backgroundColor: theme.colors.card }]}
            onPress={action.onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.quickActionIcon, { backgroundColor: theme.colors.primaryLight }]}>
                {action.icon}
            </View>
            <Text style={[styles.quickActionTitle, { color: theme.colors.text }]}>
                {action.title}
            </Text>
        </TouchableOpacity>
    );

    const renderWelcomeSection = () => {
        const welcomeMessage = currentPlan === 'premium'
            ? t('home.premiumWelcome', 'Welcome back, Premium Stylist!')
            : t('home.welcome', 'Welcome to your personal AI stylist!');

        const subtitleMessage = currentPlan === 'premium'
            ? t('home.premiumSubtitle', 'Enjoy unlimited styling with your Premium features')
            : t('home.subtitle', 'Create amazing outfits with what you already own');

        return (
            <View style={styles.headerContent}>
                {currentPlan === 'premium' && (
                    <View style={[styles.premiumBadge, { backgroundColor: 'rgba(255, 215, 0, 0.2)' }]}>
                        <Crown size={16} color="#FFD700" />
                        <Text style={[styles.premiumBadgeText, { color: '#FFD700' }]}>
                            {t('home.premiumBadgeText', 'Premium Member')}
                        </Text>
                    </View>
                )}

                <Text style={[styles.welcomeText, {
                    color: theme.colors.white,
                    textShadowColor: 'rgba(0, 0, 0, 0.3)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 3,
                }]}>
                    {welcomeMessage}
                </Text>
                <Text style={[styles.subtitleText, {
                    color: 'rgba(255, 255, 255, 0.95)',
                    textShadowColor: 'rgba(0, 0, 0, 0.2)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                }]}>
                    {subtitleMessage}
                </Text>
            </View>
        );
    };

    if (isPlanLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <HeaderBar title={t('home.title', 'Discover Style')} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HeaderBar
                title={t('home.title', 'Discover Style')}
                style={{ backgroundColor: theme.colors.background }}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <LinearGradient
                    colors={[
                        theme.colors.primary,
                        theme.colors.secondary,
                        theme.colors.primaryLight
                    ]}
                    style={styles.headerGradientScrollable}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {renderWelcomeSection()}
                </LinearGradient>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        {t('home.featuresTitle', 'Explore Features')}
                    </Text>
                    <View style={styles.featuresContainer}>
                        {getFeatureCards().map(renderFeatureCard)}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        {t('home.quickActionsTitle', 'Quick Actions')}
                    </Text>
                    <View style={styles.quickActionsContainer}>
                        {quickActions.map(renderQuickAction)}
                    </View>
                </View>

                {currentPlan !== 'premium' && (
                    <View style={[styles.upgradeSection, { backgroundColor: theme.colors.primaryLight }]}>
                        <View style={styles.upgradeHeader}>
                            <Crown color={theme.colors.primary} size={24} />
                            <Text style={[styles.upgradeTitle, { color: theme.colors.primary }]}>
                                {t('home.upgradeTitle', 'Ready for More?')}
                            </Text>
                        </View>
                        <Text style={[styles.upgradeText, { color: theme.colors.text }]}>
                            {t('home.upgradeText', 'Upgrade to Premium for unlimited wardrobe items, advanced AI styling, and exclusive features!')}
                        </Text>
                        <TouchableOpacity
                            style={[styles.upgradeButton, { backgroundColor: theme.colors.primary }]}
                            // ÇÖZÜM: Yanlış rota '/profile/subscription' düzeltildi ve router.navigate kullanıldı.
                            onPress={() => router.navigate('/subscription')}
                            activeOpacity={0.8}
                        >
                            <Crown size={16} color={theme.colors.white} />
                            <Text style={styles.upgradeButtonText}>
                                {t('home.upgradeButton', 'Upgrade Now')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradientScrollable: {
        paddingBottom: 24,
        marginBottom: 16,
        borderRadius: 20,
        marginHorizontal: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Montserrat-Medium',
    },
    headerGradient: {
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
    },
    headerContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        alignItems: 'center',
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    premiumBadgeText: {
        fontSize: 12,
        fontFamily: 'Montserrat-Bold',
        marginLeft: 6,
    },
    welcomeText: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay-Bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 14,
        fontFamily: 'Montserrat-Regular',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay-Bold',
        marginBottom: 16,
    },
    featuresContainer: {},
    featureCard: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        backgroundColor: 'transparent',
        borderWidth: 0,
        width: '100%',
    },
    cardGradient: {
        padding: 20,
        minHeight: 100,
        justifyContent: 'center',
        width: '100%',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    cardIconContainer: {
        marginRight: 16,
    },
    cardTextContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontFamily: 'Montserrat-Bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 12,
        fontFamily: 'Montserrat-Regular',
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 16,
    },
    cardAction: {
        marginLeft: 12,
    },
    quickActionsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    quickActionCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    quickActionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    quickActionTitle: {
        fontSize: 14,
        fontFamily: 'Montserrat-SemiBold',
        flex: 1,
    },
    upgradeSection: {
        padding: 20,
        borderRadius: 16,
        marginTop: 8,
        alignItems: 'center',
    },
    upgradeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    upgradeTitle: {
        fontSize: 18,
        fontFamily: 'Montserrat-Bold',
        marginLeft: 8,
    },
    upgradeText: {
        fontSize: 14,
        fontFamily: 'Montserrat-Regular',
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 16,
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        gap: 8,
    },
    upgradeButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Montserrat-Bold',
    },
});