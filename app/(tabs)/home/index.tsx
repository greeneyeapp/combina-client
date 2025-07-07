// app/(tabs)/home/index.tsx - YENİ ANA SAYFA
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
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
    Palette,
    TrendingUp,
} from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2'li grid için

export default function HomeScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();

    const featureCards = [
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
            gradient: [theme.colors.accent, '#FF6B6B'],
            onPress: () => router.push('/(tabs)/suggestions'),
        },
        {
            id: 'tips',
            title: t('home.tipsTitle', 'Pro Style Tips'),
            subtitle: t('home.tipsSubtitle', 'Learn about color combinations'),
            icon: <Palette size={32} color={theme.colors.white} />,
            gradient: [theme.colors.secondary, theme.colors.primary],
            onPress: () => {
                // TODO: Tips sayfası eklenebilir
                router.push('/(tabs)/suggestions');
            },
        },
        {
            id: 'premium',
            title: t('home.premiumTitle', 'Upgrade Style'),
            subtitle: t('home.premiumSubtitle', 'Unlock premium features'),
            icon: <Crown size={32} color={theme.colors.white} />,
            gradient: ['#FFD700', '#FFA500'],
            onPress: () => router.push('/profile/subscription' as any),
        },
    ];

    const quickActions = [
        {
            id: 'add-item',
            title: t('home.addItemTitle', 'Add New Item'),
            icon: <Plus size={20} color={theme.colors.primary} />,
            onPress: () => router.push('/wardrobe/add' as any),
        },
        {
            id: 'trending',
            title: t('home.trendingTitle', 'Trending Styles'),
            icon: <TrendingUp size={20} color={theme.colors.primary} />,
            onPress: () => router.push('/(tabs)/suggestions'),
        },
    ];

    const renderFeatureCard = (card: typeof featureCards[0]) => (
        <TouchableOpacity
            key={card.id}
            style={[styles.featureCard, { width: cardWidth }]}
            onPress={card.onPress}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={card.gradient}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.cardIconContainer}>
                    {card.icon}
                </View>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                <View style={styles.cardAction}>
                    <Sparkles size={16} color={theme.colors.white} />
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Pembe tonlu header */}
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryLight]}
                style={styles.headerGradient}
            >
                <HeaderBar
                    title={t('home.title', 'Discover Style')}
                    style={{ backgroundColor: 'transparent' }}
                />
                <View style={styles.headerContent}>
                    <Text style={styles.welcomeText}>
                        {t('home.welcome', 'Welcome to your personal AI stylist!')}
                    </Text>
                    <Text style={styles.subtitleText}>
                        {t('home.subtitle', 'Create amazing outfits with what you already own')}
                    </Text>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Feature Cards */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        {t('home.featuresTitle', 'Explore Features')}
                    </Text>
                    <View style={styles.featuresGrid}>
                        {featureCards.map(renderFeatureCard)}
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                        {t('home.quickActionsTitle', 'Quick Actions')}
                    </Text>
                    <View style={styles.quickActionsContainer}>
                        {quickActions.map(renderQuickAction)}
                    </View>
                </View>

                {/* Pro Tips Section */}
                <View style={[styles.tipSection, { backgroundColor: theme.colors.primaryLight }]}>
                    <View style={styles.tipHeader}>
                        <Sparkles color={theme.colors.primary} size={24} />
                        <Text style={[styles.tipTitle, { color: theme.colors.primary }]}>
                            {t('home.tipTitle', 'Style Tip of the Day')}
                        </Text>
                    </View>
                    <Text style={[styles.tipText, { color: theme.colors.text }]}>
                        {t(
                            'home.tipText',
                            'Try mixing different textures and patterns for a more dynamic look. Start with neutral bases and add colorful accessories!'
                        )}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerGradient: {
        paddingBottom: 24,
    },
    headerContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    welcomeText: {
        fontSize: 20,
        fontFamily: 'PlayfairDisplay-Bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 14,
        fontFamily: 'Montserrat-Regular',
        color: 'rgba(255, 255, 255, 0.9)',
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
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 16,
    },
    featureCard: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    cardGradient: {
        padding: 20,
        minHeight: 160,
        justifyContent: 'space-between',
    },
    cardIconContainer: {
        marginBottom: 12,
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
        marginBottom: 8,
    },
    cardAction: {
        alignSelf: 'flex-end',
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
    tipSection: {
        padding: 20,
        borderRadius: 16,
        marginTop: 8,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipTitle: {
        fontSize: 16,
        fontFamily: 'Montserrat-Bold',
        marginLeft: 8,
    },
    tipText: {
        fontSize: 14,
        fontFamily: 'Montserrat-Regular',
        lineHeight: 20,
    },
});