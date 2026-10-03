import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText style={styles.title}>Home</ThemedText>
        <ThemedText themeColor="mutedForeground" style={styles.body}>
          Dashboard coming soon
        </ThemedText>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  title: {
    ...Type.h1,
    textAlign: 'center',
  },
  body: {
    ...Type.body,
    textAlign: 'center',
  },
});
