import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { Spacing, Type } from '@/constants/theme';
import { initDatabase } from '@/db/index';
import { useTheme } from '@/hooks/use-theme';

SplashScreen.preventAutoHideAsync();

let initialized = false;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    if (initialized) return;
    initialized = true;
    (async () => {
      try {
        await initDatabase();
      } catch (error) {
        setDbError(error instanceof Error ? error.message : String(error));
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {dbError ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.errorTitle, { color: theme.foreground }]}>
            Couldn&apos;t start
          </Text>
          <Text style={[styles.errorBody, { color: theme.mutedForeground }]}>{dbError}</Text>
        </View>
      ) : (
        <AppTabs />
      )}
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  errorTitle: {
    ...Type.h1,
    textAlign: 'center',
  },
  errorBody: {
    ...Type.body,
    textAlign: 'center',
  },
});
