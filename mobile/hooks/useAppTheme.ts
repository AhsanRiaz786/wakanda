import { darkColors, lightColors, spacing, typography } from '../constants/theme';
import { useThemeContext } from '../contexts/ThemeContext';

export function useAppTheme() {
  const { isDark, mode, setMode } = useThemeContext();
  return {
    colors: isDark ? darkColors : lightColors,
    spacing,
    typography,
    isDark,
    themeMode: mode,
    setThemeMode: setMode,
  };
}
