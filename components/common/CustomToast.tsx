// components/common/CustomToast.tsx - iPad için büyütülmüş ve orantılı tasarım

import React from 'react';
// YENİ: Dimensions modülü eklendi
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

// YENİ: iPad tespiti
const { width } = Dimensions.get('window');
const isTablet = width >= 768;

interface CustomToastProps extends BaseToastProps {
  type?: 'success' | 'error' | 'info';
}

const CustomToast = ({ text1, text2, type = 'info' }: CustomToastProps) => (
  <View style={[
    styles.container,
    type === 'success' ? styles.success : type === 'error' ? styles.error : styles.info
  ]}>
    <Text style={styles.text}>{text1}</Text>
    {text2 ? <Text style={styles.text2}>{text2}</Text> : null}
  </View>
);

// DEĞİŞİKLİK: Tüm stiller tablet için dinamik hale getirildi
const styles = StyleSheet.create({
  container: {
    minHeight: isTablet ? 60 : 48,
    borderRadius: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: isTablet ? 14 : 10,
    marginHorizontal: isTablet ? 24 : 8,
    marginTop: 16,
    elevation: 5,
    // YENİ: Tablette daha geniş bir toast mesajı
    width: 'auto',
    maxWidth: isTablet ? 600 : '95%',
    alignSelf: 'center',
  },
  success: { backgroundColor: '#41C97F' },
  error: { backgroundColor: '#F24D61' },
  info: { backgroundColor: '#2996F5' },
  text: { 
    color: '#fff', 
    fontFamily: 'Montserrat-Bold', 
    fontSize: isTablet ? 18 : 15 // Büyüdü
  },
  text2: { 
    color: '#fff', 
    fontFamily: 'Montserrat-Regular', 
    fontSize: isTablet ? 15 : 13, // Büyüdü
    marginTop: 4 
  },
});

export default CustomToast;