import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, BackHandler } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import useAlertStore from '@/store/alertStore';
import Button from './Button';

export default function CustomAlert() {
  const { theme } = useTheme();
  const { isVisible, title, message, buttons, hide } = useAlertStore();

  // Modal açıkken Android geri tuşuna basılırsa kapat
  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isVisible) {
        hide();
        return true; // Geri tuşu olayını burada bitir
      }
      return false;
    });
    return () => backHandler.remove();
  }, [isVisible, hide]);

  if (!isVisible) {
    return null;
  }

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={hide}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={hide} // Arka plana tıklayınca kapat
      >
        <View 
          style={[styles.alertBox, { backgroundColor: theme.colors.card }]}
          // Alert kutusuna tıklamanın arka planı kapatmasını engelle
          onStartShouldSetResponder={() => true}
        >
          <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: theme.colors.textLight }]}>{message}</Text>
          
          <View style={styles.buttonContainer}>
            {buttons.map((button, index) => (
              <Button
                key={index}
                label={button.text}
                onPress={() => {
                  hide(); // Butona basınca önce alert'i kapat
                  button.onPress(); // Sonra butonun kendi fonksiyonunu çalıştır
                }}
                variant={button.variant || 'primary'}
                style={styles.button}
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  button: {
    flex: 1,
  },
});