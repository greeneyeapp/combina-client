import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useClothingStore } from '@/store/clothingStore';
import { ArrowLeft, Edit2, Trash2 } from 'lucide-react-native';
import HeaderBar from '@/components/common/HeaderBar';
import Button from '@/components/common/Button';
import { formatDate } from '@/utils/dateUtils';

export default function ClothingDetailScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clothing, removeClothing } = useClothingStore();

  const item = clothing.find((item) => item.id === id);

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <HeaderBar
          title={t('wardrobe.itemDetails')}
          leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
          onLeftPress={() => router.back()}
        />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: theme.colors.text }]}>
            {t('wardrobe.itemNotFound')}
          </Text>
          <Button
            label={t('common.goBack')}
            onPress={() => router.back()}
            variant="primary"
            style={styles.backButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const handleEdit = () => {
    router.push(`/wardrobe/edit/${id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      t('wardrobe.deleteTitle'),
      t('wardrobe.deleteMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          onPress: () => {
            removeClothing(id);
            router.back();
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar
        title={t('wardrobe.itemDetails')}
        leftIcon={<ArrowLeft color={theme.colors.text} size={24} />}
        onLeftPress={() => router.back()}
        rightIcon={<Trash2 color={theme.colors.error} size={24} />}
        onRightPress={handleDelete}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.imageUri }} style={styles.image} />
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleEdit}
          >
            <Edit2 color={theme.colors.white} size={20} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.category')}
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {t(`categories.${item.category}`)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.color')}
            </Text>
            <View style={styles.colorRow}>
              <View 
                style={[
                  styles.colorCircle,
                  { backgroundColor: item.color }
                ]} 
              />
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>
                {t(`colors.${item.color}`)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.season')}
            </Text>
            <View style={styles.tagContainer}>
              {item.season.map((season) => (
                <View 
                  key={season} 
                  style={[
                    styles.tag, 
                    { backgroundColor: theme.colors.primaryLight }
                  ]}
                >
                  <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                    {t(`seasons.${season}`)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.style')}
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {t(`styles.${item.style}`)}
            </Text>
          </View>

          {item.notes && (
            <View style={styles.notesContainer}>
              <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
                {t('wardrobe.notes')}
              </Text>
              <Text style={[styles.notes, { color: theme.colors.text }]}>
                {item.notes}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: theme.colors.textLight }]}>
              {t('wardrobe.addedOn')}
            </Text>
            <Text style={[styles.detailValue, { color: theme.colors.text }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    width: '50%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    marginBottom: 24,
  },
  detailsContainer: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 14,
  },
  detailValue: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
  },
  colorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '60%',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  tagText: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 12,
  },
  notesContainer: {
    marginTop: 8,
  },
  notes: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
});