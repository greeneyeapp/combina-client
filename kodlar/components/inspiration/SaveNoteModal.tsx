import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react-native';
import Button from '@/components/common/Button';

interface SaveNoteModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (note: string) => void;
  pageUrl: string;
  imageUrl: string | null;
}

const SaveNoteModal: React.FC<SaveNoteModalProps> = ({
  isVisible,
  onClose,
  onSave,
  pageUrl,
  imageUrl,
}) => {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [note, setNote] = useState('');

  const handleSave = () => {
    onSave(note);
    setNote('');
  };

  const handleClose = () => {
    onClose();
    setNote('');
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t('inspiration.saveWithNote')}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X color={theme.colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.imagePreviewContainer}>
            <Image 
              source={{ uri: imageUrl || undefined }} 
              style={styles.imagePreview} 
              resizeMode="cover"
            />
          </View>

          <TextInput
            style={[
              styles.noteInput,
              { 
                color: theme.colors.text,
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              },
            ]}
            placeholder={t('inspiration.notePlaceholder')}
            placeholderTextColor={theme.colors.textLight}
            value={note}
            onChangeText={setNote}
            returnKeyType="done"
            onSubmitEditing={handleSave}
            blurOnSubmit={true}
          />

          <View style={styles.buttonContainer}>
            <Button
              label={t('inspiration.saveButton')}
              onPress={handleSave}
              variant="primary"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  modalContainer: {
    width: '90%',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
  },
  closeButton: {
    padding: 4,
  },
  imagePreviewContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#f0f0f0'
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  noteInput: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 50,
    textAlignVertical: 'center',
    marginBottom: 16,
  },
  buttonContainer: {
    alignItems: 'center',
  },
});

export default SaveNoteModal;