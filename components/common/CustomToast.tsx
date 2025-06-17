import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

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

const styles = StyleSheet.create({
  container: {
    minHeight: 48, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
    marginHorizontal: 8, marginTop: 16, elevation: 5,
  },
  success: { backgroundColor: '#41C97F' },
  error: { backgroundColor: '#F24D61' },
  info: { backgroundColor: '#2996F5' },
  text: { color: '#fff', fontFamily: 'Montserrat-Bold', fontSize: 15 },
  text2: { color: '#fff', fontFamily: 'Montserrat-Regular', fontSize: 13, marginTop: 2 },
});
export default CustomToast;
