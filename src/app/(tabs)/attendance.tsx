import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateStrip } from '@/components/date-strip';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing, Type } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/utils/dates';

export default function AttendanceScreen() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          Attendance
        </Text>
        <DateStrip selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <ThemedText themeColor="mutedForeground" style={styles.placeholder}>
          Register loads in 03-03
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
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset,
  },
  title: {
    ...Type.h1,
    paddingHorizontal: Spacing.three,
  },
  placeholder: {
    ...Type.body,
    paddingHorizontal: Spacing.three,
  },
});
