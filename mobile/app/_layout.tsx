import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import 'react-native-reanimated';
import { ThemeProvider, useThemeContext } from '../contexts/ThemeContext';
import { PlanProvider } from '../contexts/PlanContext';
import { StatusProvider } from '../contexts/StatusContext';
import { StatusChipOverlay } from '../components/StatusChipOverlay';
import { useStatus } from '../contexts/StatusContext';
import { darkColors, lightColors } from '../constants/theme';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <StatusProvider>
        <PlanProvider>
          <RootLayoutNav />
          <StatusChipOverlay />
        </PlanProvider>
      </StatusProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { isDark } = useThemeContext();
  const colors = isDark ? darkColors : lightColors;
  const { showStatus } = useStatus();

  // Backend health check on mount
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://wakanda-backend.onrender.com/v1';
        const res = await fetch(`${API_BASE}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        if (!cancelled) {
          if (res.ok) {
            showStatus({ type: 'connected', label: 'Backend Connected', duration: 3000 });
          } else {
            showStatus({ type: 'warning', label: 'Backend Degraded', duration: 5000 });
          }
        }
      } catch {
        clearTimeout(timeout);
        if (!cancelled) {
          showStatus({ type: 'disabled', label: 'Backend Offline', duration: 6000 });
        }
      }
    };
    // Small delay so the splash screen is gone before the chip appears
    const t = setTimeout(check, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="incident/[id]" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
