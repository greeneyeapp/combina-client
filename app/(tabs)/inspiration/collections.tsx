import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/context/ThemeContext';
import { useInspirationStore, Collection, Inspiration } from '@/store/inspirationStore';
import HeaderBar from '@/components/common/HeaderBar';
import { Trash2, PlusCircle, ArrowLeft } from 'lucide-react-native';
import useAlertStore from '@/store/alertStore';

interface CollectionContentModalProps {
  openedCol: string | null;
  setOpenedCol: (v: string | null) => void;
  inspirations: Inspiration[];
  collections: Collection[];
  theme: any;
  t: (k: string) => string;
}

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2;
const GRID_SPACING = 6;
const THUMB_SIZE = (CARD_SIZE - GRID_SPACING * 3) / 2;

export default function CollectionsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const rawCollections = useInspirationStore(state => state.collections);
  const { inspirations, addCollection } = useInspirationStore();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [openedCol, setOpenedCol] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const collections = useMemo(() => {
    const hasDefault = rawCollections.some(c => c.id === 'default');
    if (!hasDefault) {
      return [
        { id: 'default', name: 'default', itemIds: [] },
        ...rawCollections,
      ];
    }
    return rawCollections;
  }, [rawCollections]);

  const filteredCollections = collections.filter((col: Collection) => {
    if (!search) return true;
    const items = col.itemIds
      .map((id: string) => inspirations.find((i: Inspiration) => i.id === id))
      .filter(Boolean) as Inspiration[];
    return (
      (col.id === 'default'
        ? t('inspiration.defaultCollection')
        : col.name
      ).toLowerCase().includes(search.toLowerCase()) ||
      items.some((i: Inspiration) => i.note.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const renderCollection = ({ item: col }: { item: Collection }) => {
    const items = col.itemIds
      .map((id: string) => inspirations.find((i: Inspiration) => i.id === id))
      .filter(Boolean) as Inspiration[];

    let gridContent;
    if (items.length === 1) {
      gridContent = (
        <View style={styles.singleGrid}>
          <Image source={{ uri: items[0].imageUrl! }} style={styles.singleImage} resizeMode="cover" />
        </View>
      );
    } else if (items.length === 2) {
      gridContent = (
        <View style={styles.rowGrid}>
          {items.slice(0, 2).map((img, idx) => (
            <Image key={idx} source={{ uri: img.imageUrl! }} style={styles.doubleImage} resizeMode="cover" />
          ))}
        </View>
      );
    } else if (items.length === 3) {
      gridContent = (
        <View style={styles.threeGrid}>
          <View style={styles.rowGrid}>
            {items.slice(0, 2).map((img, idx) => (
              <Image key={idx} source={{ uri: img.imageUrl! }} style={styles.doubleImage} resizeMode="cover" />
            ))}
          </View>
          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <Image source={{ uri: items[2].imageUrl! }} style={styles.singleBottomImage} resizeMode="cover" />
          </View>
        </View>
      );
    } else {
      gridContent = (
        <View style={styles.fourGrid}>
          <View style={styles.rowGrid}>
            {items.slice(0, 2).map((img, idx) => (
              <Image key={idx} source={{ uri: img.imageUrl! }} style={styles.fourImage} resizeMode="cover" />
            ))}
          </View>
          <View style={styles.rowGrid}>
            {items.slice(2, 4).map((img, idx) => (
              <Image key={idx} source={{ uri: img.imageUrl! }} style={styles.fourImage} resizeMode="cover" />
            ))}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.cardWrap}>
        <TouchableOpacity
          onPress={() => setOpenedCol(col.id)}
          style={[styles.colCard, { backgroundColor: theme.colors.card }]}
          activeOpacity={0.85}
        >
          {gridContent}
        </TouchableOpacity>
        <Text
          style={[styles.colTitle, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {col.id === 'default' ? t('inspiration.defaultCollection') : col.name}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <HeaderBar title={t('inspiration.collectionsTitle')} />
      <TextInput
        style={[styles.input, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
        placeholder={t('inspiration.searchPlaceholder')}
        placeholderTextColor={theme.colors.textLight}
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredCollections}
        keyExtractor={(c: Collection) => c.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 64 }}
        renderItem={renderCollection}
        ListEmptyComponent={
          <Text style={{ color: theme.colors.textLight, alignSelf: 'center', marginTop: 48 }}>
            {t('inspiration.noCollections')}
          </Text>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <PlusCircle color={theme.colors.white} size={28} />
      </TouchableOpacity>

      <Modal transparent visible={modalVisible} animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t('inspiration.newCollection')}</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.colors.text }]}
              placeholder={t('inspiration.newCollection')}
              placeholderTextColor={theme.colors.textLight}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              onSubmitEditing={() => {
                if (newName.trim()) {
                  addCollection(newName.trim());
                  setNewName('');
                  setModalVisible(false);
                }
              }}
            />
            <TouchableOpacity
              onPress={() => {
                if (newName.trim()) {
                  addCollection(newName.trim());
                  setNewName('');
                  setModalVisible(false);
                }
              }}
              style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
            >
              <Text style={{ color: theme.colors.white, fontWeight: 'bold', fontSize: 16 }}>{t('common.save')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 12 }}>
              <Text style={{ color: theme.colors.textLight }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CollectionContentModal
        openedCol={openedCol}
        setOpenedCol={setOpenedCol}
        inspirations={inspirations}
        collections={collections}
        theme={theme}
        t={t}
      />
    </SafeAreaView>
  );
}

function CollectionContentModal({
  openedCol,
  setOpenedCol,
  inspirations,
  collections,
  theme,
  t,
}: CollectionContentModalProps) {
  const [search, setSearch] = useState<string>('');
  const { deleteCollection } = useInspirationStore();
  const { show: showAlert } = useAlertStore();

  if (!openedCol) return null;
  const collection = collections.find((c: Collection) => c.id === openedCol);
  if (!collection) return null;
  const items = collection.itemIds
    .map((id: string) => inspirations.find((i: Inspiration) => i.id === id))
    .filter(Boolean) as Inspiration[];
  const filteredItems = items.filter((i: Inspiration) => i.note.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = () => {
    showAlert({
      title: t('inspiration.deleteTitle'),
      message: t('inspiration.deleteCollectionMessage'),
      buttons: [
        { text: t('common.cancel'), variant: 'outline', onPress: () => { } },
        {
          text: t('common.delete'),
          variant: 'destructive',
          onPress: () => {
            deleteCollection(collection.id);
            setOpenedCol(null);
          },
        },
      ],
    });
  };

  return (
    <Modal visible transparent animationType="slide">
      <SafeAreaView style={[styles.modalInnerContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.innerHeader}>
          <TouchableOpacity onPress={() => setOpenedCol(null)} style={{ marginRight: 8 }}>
            <ArrowLeft color={theme.colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.innerTitle, { color: theme.colors.text }]}>
            {collection.id === 'default' ? t('inspiration.defaultCollection') : collection.name}
          </Text>
          {collection.id !== 'default' && (
            <TouchableOpacity onPress={handleDelete} style={{ marginLeft: 'auto', padding: 4 }}>
              <Trash2 color={theme.colors.error} size={22} />
            </TouchableOpacity>
          )}
        </View>
        <TextInput
          style={[styles.innerSearch, { backgroundColor: theme.colors.card, color: theme.colors.text }]}
          placeholder={t('inspiration.searchPlaceholder')}
          placeholderTextColor={theme.colors.textLight}
          value={search}
          onChangeText={setSearch}
        />
        <FlatList
          data={filteredItems}
          keyExtractor={(i: Inspiration) => i.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 64 }}
          renderItem={({ item }: { item: Inspiration }) => (
            <View style={[styles.itemCard, { backgroundColor: theme.colors.card }]}>
              <Image
                source={{ uri: item.imageUrl! }}
                style={styles.itemImg}
                resizeMode="cover"
              />
              <Text style={[styles.itemNote, { color: theme.colors.text }]} numberOfLines={2}>
                {item.note}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: theme.colors.textLight, alignSelf: 'center', marginTop: 48 }}>
              {t('inspiration.noItems')}
            </Text>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    marginHorizontal: 16, marginTop: 8, marginBottom: 4,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    fontFamily: 'Montserrat-Regular', fontSize: 15,
  },
  deleteBtn: { position: 'absolute', top: 8, right: 8, zIndex: 2, padding: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: THUMB_SIZE * 2 + GRID_SPACING * 1,
    marginBottom: 10,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 6,
    backgroundColor: '#222',
    marginRight: GRID_SPACING,
    marginBottom: GRID_SPACING,
    overflow: 'hidden',
  },
  singleGrid: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  singleImage: {
    width: '92%',
    height: '78%',
    borderRadius: 12,
  },
  rowGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  doubleImage: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  threeGrid: {
    width: '100%',
    flex: 1,
    marginBottom: 8,
  },
  singleBottomImage: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  fourGrid: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    marginBottom: 4,
  },
  fourImage: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 10,
    marginBottom: 2,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.17,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  modalBg: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalBox: {
    width: '80%', borderRadius: 16, padding: 20, alignItems: 'center'
  },
  modalTitle: { fontFamily: 'Montserrat-Bold', fontSize: 18, marginBottom: 8 },
  modalInput: {
    width: '100%', borderRadius: 8, padding: 12, fontFamily: 'Montserrat-Regular',
    marginBottom: 12, backgroundColor: '#222', fontSize: 15
  },
  modalBtn: {
    width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8
  },
  modalInnerContainer: { flex: 1 },
  innerHeader: {
    flexDirection: 'row', alignItems: 'center', padding: 18, paddingBottom: 0
  },
  innerTitle: { fontFamily: 'Montserrat-Bold', fontSize: 19 },
  innerSearch: {
    marginHorizontal: 16, marginTop: 14, marginBottom: 0, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8,
    fontFamily: 'Montserrat-Regular', fontSize: 15,
  },
  itemCard: {
    width: CARD_SIZE, borderRadius: 14, padding: 10, marginBottom: 18,
    alignItems: 'center', backgroundColor: '#232323'
  },
  itemImg: {
    width: '100%', height: CARD_SIZE * 0.75, borderRadius: 10, marginBottom: 10,
    backgroundColor: '#222'
  },
  itemNote: { fontFamily: 'Montserrat-Medium', fontSize: 13 },
  cardWrap: {
    alignItems: 'center',
    marginBottom: 10,
    width: CARD_SIZE,
  },
  colCard: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    overflow: 'hidden',
  },
  colTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
  },
});
