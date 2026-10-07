import { memo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateStrip } from '@/components/date-strip';
import { StatusPill } from '@/components/status-pill';
import {
  BottomTabInset,
  MaxContentWidth,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { CYCLE, type AttendanceStatus } from '@/constants/status';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/utils/dates';

// LOCAL-ONLY stub roster. Replaced by real DAO data in 03-03; no DB calls here.
const STUB_WORKERS = [
  { id: 'w1', name: 'Demo A' },
  { id: 'w2', name: 'Demo B' },
  { id: 'w3', name: 'Demo C' },
] as const;

const AttendanceRow = memo(function AttendanceRow({
  name,
  status,
  onCycle,
  onPick,
}: {
  name: string;
  status: AttendanceStatus | null;
  onCycle: () => void;
  onPick: (s: AttendanceStatus) => void;
}): React.JSX.Element {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <Text style={[styles.name, { color: theme.foreground }]}>{name}</Text>
      <StatusPill status={status} onCycle={onCycle} onPick={onPick} />
    </View>
  );
});

export default function AttendanceScreen() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});

  function handleSelectDate(key: string) {
    setSelectedDate(key);
    setMarks({});
  }

  function cycleMark(workerId: string) {
    setMarks((prev) => {
      const current = prev[workerId] ?? null;
      const index = current === null ? -1 : CYCLE.indexOf(current);
      const next = CYCLE[(index + 1) % CYCLE.length];
      return { ...prev, [workerId]: next };
    });
  }

  function pickMark(workerId: string, next: AttendanceStatus) {
    setMarks((prev) => ({ ...prev, [workerId]: next }));
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          Attendance
        </Text>
        <DateStrip selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        <FlatList
          data={STUB_WORKERS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <AttendanceRow
              name={item.name}
              status={marks[item.id] ?? null}
              onCycle={() => cycleMark(item.id)}
              onPick={(next) => pickMark(item.id, next)}
            />
          )}
        />
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
  listContent: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    minHeight: 44,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  name: {
    ...Type.body,
    fontWeight: '600',
  },
});
