import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Spacing, Type } from '@/constants/theme';
import { initDatabase } from '@/db/index';
import { useTheme } from '@/hooks/use-theme';
import { useFonts } from '@expo-google-fonts/inter';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

SplashScreen.preventAutoHideAsync();

let initialized = false;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Fonts load inside the bundle (no network). A font error must not freeze the
  // app: D-29 falls back to system fonts. The gate opens once db resolves AND
  // fonts have either loaded or errored.
  const uiReady = dbReady && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (initialized) return;
    initialized = true;
    (async () => {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (error) {
        setDbError(error instanceof Error ? error.message : String(error));
      } finally {
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, [attempt]);

  function retryInit() {
    initialized = false;
    setDbError(null);
    setAttempt((a) => a + 1);
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {dbError ? (
        <View style={[styles.errorContainer, { backgroundColor: theme.background }]}>
          <Text style={[styles.errorTitle, { color: theme.foreground }]}>
            Couldn&apos;t start
          </Text>
          <Text style={[styles.errorBody, { color: theme.mutedForeground }]}>{dbError}</Text>
          <Pressable
            accessibilityRole="button"
            android_ripple={{ color: theme.onAccent }}
            onPress={retryInit}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
            ]}>
            <Text style={[styles.retryLabel, { color: theme.onAccent }]}>Try again</Text>
          </Pressable>
        </View>
      ) : uiReady ? (
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.surface },
            headerTintColor: theme.primary,
            headerTitleStyle: { ...Type.h2, color: theme.foreground },
            contentStyle: { backgroundColor: theme.background },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="worksites" options={{ title: 'Worksites' }} />
          <Stack.Screen name="worksite-form" options={{ title: 'Worksite' }} />
          <Stack.Screen name="worker-form" options={{ title: 'Worker' }} />
          <Stack.Screen name="worker/[id]" options={{ title: 'Worker' }} />
          <Stack.Screen name="export" options={{ title: 'Export' }} />
          <Stack.Screen name="backup" options={{ title: 'Backup' }} />
        </Stack>
      ) : null}
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
  retryButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    borderRadius: 12,
    marginTop: Spacing.two,
  },
  retryLabel: {
    ...Type.label,
    textAlign: 'center',
  },
});
