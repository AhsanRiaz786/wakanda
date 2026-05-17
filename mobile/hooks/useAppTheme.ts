import { useColorScheme } from 'react-native';
import { darkColors, lightColors, spacing, typography } from '../constants/theme';

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    isDark
  };
}
