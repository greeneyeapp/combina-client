import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  Alert
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useInspirationStore } from '@/store/inspirationStore';
import { Trash2 } from 'lucide-react-native';
import EmptyState from '@/components/common/EmptyState';

const { width } = Dimensions.get('window');
const numColumns = 2;
const tileSize = width / numColumns - 16;

const SavedInspirationList = () => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { inspirations, removeInspiration } = useInspirationStore();

  if (inspirations.length === 0) {
    return (
      <EmptyState
        icon="inspiration"
        title={t('inspiration.emptyTitle')}
        message={t('inspiration.emptyMessage')}
      />
    );
  }
  
  const handleDeletePress = (id: string) => {
    Alert.alert(
      t('inspiration.deleteTitle'),
      t('inspiration.deleteMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          onPress: () => removeInspiration(id),
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };


  const renderItem = ({ item }) => {
    return (
      <View 
        style={[
          styles.tileContainer, 
          { backgroundColor: theme.colors.card }
        ]}
      >
        <Image 
          // DEĞİŞİKLİK BURADA: Artık doğru görsel URL'sini kullanıyoruz.
          source={{ uri: item.imageUrl }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        <View style={styles.contentContainer}>
          <Text 
            style={[styles.note, { color: theme.colors.text }]}
            numberOfLines={2}
          >
            {item.note}
          </Text>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeletePress(item.id)}
          >
            <Trash2 color={theme.colors.error} size={18} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={inspirations}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.container}
      columnWrapperStyle={styles.columnWrapper}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  tileContainer: {
    width: tileSize,
    height: tileSize * 1.5,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  image: {
    width: '100%',
    height: '65%',
    backgroundColor: '#f0f0f0',
  },
  contentContainer: {
    padding: 10,
    flex: 1,
    justifyContent: 'space-between',
  },
  note: {
    fontFamily: 'Montserrat-Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
});

export default SavedInspirationList;