// theme.ts
export type Theme = {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    primaryLight: string;
    secondary: string;
    secondaryLight: string;
    accent: string;
    accentLight: string;
    background: string;
    surface: string; // ✅ EKLENDI - Complete Profile'da kullanılıyor
    card: string;
    text: string;
    textLight: string;
    textSecondary: string; // ✅ EKLENDI - Complete Profile'da kullanılıyor
    border: string;
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    error: string;
    errorLight: string;
    white: string;
    black: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    round: number;
  };
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };
};

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    primary: '#F2B6C1', // Blush pink
    primaryLight: '#FCE5E9',
    secondary: '#1E3D59', // Navy blue
    secondaryLight: '#E6EBF0',
    accent: '#F1C93B', // Gold
    accentLight: '#FCF5DA',
    background: '#FFFFFF',
    surface: '#F8F9FA', // ✅ EKLENDI - Input alanları için
    card: '#F8F9FA',
    text: '#2D3748',
    textLight: '#718096',
    textSecondary: '#9CA3AF', // ✅ EKLENDI - İkincil metinler için
    border: '#E2E8F0',
    success: '#48BB78',
    successLight: '#E6F6EF',
    warning: '#ED8936',
    warningLight: '#FBF0EA',
    error: '#E53E3E',
    errorLight: '#FDE8E8',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.23,
      shadowRadius: 2.62,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    primary: '#F2B6C1', // Blush pink (same as light theme)
    primaryLight: '#3A2A2E',
    secondary: '#2E4E6A', // Darker navy blue
    secondaryLight: '#1A2A3A',
    accent: '#F1C93B', // Gold (same as light theme)
    accentLight: '#3A3319',
    background: '#121212',
    surface: '#1E1E1E', // ✅ EKLENDI - Input alanları için (card ile aynı)
    card: '#1E1E1E',
    text: '#E2E8F0',
    textLight: '#A0AEC0',
    textSecondary: '#6B7280', // ✅ EKLENDI - İkincil metinler için (dark mode'da daha koyu)
    border: '#2D3748',
    success: '#48BB78',
    successLight: '#1C3931',
    warning: '#ED8936',
    warningLight: '#3D2B19',
    error: '#E53E3E',
    errorLight: '#3D1A1A',
    white: '#FFFFFF',
    black: '#000000',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.3,
      shadowRadius: 2.0,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.4,
      shadowRadius: 3.62,
      elevation: 5,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.5,
      shadowRadius: 5.65,
      elevation: 9,
    },
  },
};