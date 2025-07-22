// components/common/CustomAlert.tsx - iPad için büyütülmüş ve orantılı tasarım

import React from 'react';
// YENİ: Dimensions modülü eklendi
import { Modal, View, Text, StyleSheet, TouchableOpacity, BackHandler, Dimensions } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import useAlertStore from '@/store/alertStore';
import Button from './Button';

// YENİ: iPad tespiti
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function CustomAlert() {
  const { theme } = useTheme();
  const { isVisible, title, message, buttons, hide } = useAlertStore();

  React.useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isVisible) {
        hide();
        return true;
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
        onPress={hide}
      >
        <View 
          style={[styles.alertBox, { backgroundColor: theme.colors.card }]}
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
                  hide();
                  button.onPress();
                }}
                variant={button.variant || 'primary'}
                style={styles.button}
                // YENİ: Buton boyutu tablet için büyütüldü
                size={isTablet ? 'large' : 'medium'}
              />
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
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
    // DEĞİŞİKLİK: Maksimum genişlik tablet için artırıldı
    maxWidth: isTablet ? 550 : 400,
    borderRadius: 24, // Daha yuvarlak
    padding: isTablet ? 32 : 24, // İç boşluk artırıldı
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: isTablet ? 28 : 22, // Büyütüldü
    marginBottom: 12, // Boşluk artırıldı
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Montserrat-Regular',
    fontSize: isTablet ? 18 : 16, // Büyütüldü
    textAlign: 'center',
    marginBottom: 32, // Boşluk artırıldı
    lineHeight: isTablet ? 28 : 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: isTablet ? 16 : 12,
  },
  button: {
    flex: 1,
  },
});