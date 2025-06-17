import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import Button from '@/components/common/Button';
import { useInspirationStore } from '@/store/inspirationStore';
import SelectionDropdown from '@/components/common/SelectionDropdown';
// 👇 toast import
import Toast from 'react-native-toast-message';

interface Props {
  isVisible: boolean;
  onClose: () => void;
  pageUrl: string;
  imageUrl: string | null;
}

export default function SaveNoteModal({ isVisible, onClose, pageUrl, imageUrl }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const rawCollections = useInspirationStore(state => state.collections);
  const { toggleInCollection, addInspiration } = useInspirationStore();

  const [note, setNote] = useState('');
  const [selectedCol, setSelectedCol] = useState('');

  // Her zaman default koleksiyon başta ve varsa storage'dan, yoksa ekliyoruz
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

  const options = collections.map(c => ({
    label: c.id === 'default' ? t('inspiration.defaultCollection') : c.name,
    value: c.id,
  }));

  const handleSave = () => {
    const newInsp = {
      id: Date.now().toString(),
      url: pageUrl,
      imageUrl,
      note,
      createdAt: new Date().toISOString(),
    };
    addInspiration(newInsp);
    const targetCol = selectedCol || 'default';
    toggleInCollection(newInsp.id, targetCol);

    // 👇 Toast mesajı burada!
    Toast.show({
      type: 'success',
      text1: t('inspiration.saveSuccessTitle', 'Saved!'),
      text2: t('inspiration.saveSuccessMessage', 'Inspiration saved to your collection.'),
      position: 'top',
      visibilityTime: 1800,
      topOffset: 50,
    });

    onClose();
    setNote('');
    setSelectedCol('');
  };

  const handleDropdownSelect = (value: string) => {
    setSelectedCol(value);
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{t('inspiration.saveWithNote')}</Text>
            <TouchableOpacity onPress={onClose}><X color={theme.colors.text} size={24} /></TouchableOpacity>
          </View>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.image} />
          ) : null}
          <TextInput
            style={[
              styles.input,
              { backgroundColor: theme.colors.card, borderColor: theme.colors.border, color: theme.colors.text },
            ]}
            placeholder={t('inspiration.notePlaceholder')}
            placeholderTextColor={theme.colors.textLight}
            value={note}
            onChangeText={setNote}
          />
          <SelectionDropdown
            label={t('inspiration.selectCollection')}
            options={options}
            selectedValue={selectedCol}
            onSelect={handleDropdownSelect}
            searchable={false}
          />
          <Button label={t('inspiration.saveButton')} onPress={handleSave} variant="primary" />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modal: { height: '70%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontFamily: 'Montserrat-Bold', fontSize: 18 },
  image: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  input: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12, fontFamily: 'Montserrat-Regular' },
});
