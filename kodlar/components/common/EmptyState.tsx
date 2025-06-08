import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Shirt, History, Layout } from 'lucide-react-native';
import Button from './Button';

interface EmptyStateProps {
  icon: 'shirt' | 'history' | 'inspiration';
  title: string;
  message: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  message,
  buttonText,
  onButtonPress,
}) => {
  const { theme } = useTheme();

  const renderIcon = () => {
    const size = 64;
    const color = theme.colors.textLight;

    switch (icon) {
      case 'shirt':
        return <Shirt size={size} color={color} />;
      case 'history':
        return <History size={size} color={color} />;
      case 'inspiration':
        return <Layout size={size} color={color} />;
      default:
        return <Shirt size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>{renderIcon()}</View>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        {title}
      </Text>
      <Text style={[styles.message, { color: theme.colors.textLight }]}>
        {message}
      </Text>
      {buttonText && onButtonPress && (
        <Button
          label={buttonText}
          onPress={onButtonPress}
          variant="primary"
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Montserrat-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '80%',
  },
});

export default EmptyState;