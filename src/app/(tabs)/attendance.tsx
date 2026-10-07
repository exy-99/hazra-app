import { router, useFocusEffect } from 'expo-router';
import { Users } from 'lucide-react-native';
import { memo, useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateStrip } from '@/components/date-strip';
import { EmptyState } from '@/components/empty-state';
import { StatusPill } from '@/components/status-pill';
import {
  BottomTabInset,
  MaxContentWidth,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { CYCLE, type AttendanceStatus } from '@/constants/status';
import {
  getAttendanceForDate,
  upsertAttendance,
  type AttendanceDateRow,
} from '@/db/attendance';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/utils/dates';

const AttendanceRow = memo(function AttendanceRow({
  name,
  status,
  pending,
  onCycle,
  onPick,
}: {
  name: string;
  status: AttendanceStatus | null;
  pending: boolean;
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
      <View style={pending ? styles.pendingWrap : undefined}>
        <StatusPill status={status} onCycle={onCycle} onPick={onPick} />
      </View>
    </View>
  );
});

export default function AttendanceScreen() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [rows, setRows] = useState<AttendanceDateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);

  async function load() {
    setLoadError(false);
    try {
      const data = await getAttendanceForDate(selectedDate);
      setRows(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [selectedDate]),
  );

  function retry() {
    setLoading(true);
    void load();
  }

  function handleSelectDate(key: string) {
    setSelectedDate(key);
  }

  function goToAdd() {
    router.push('/worker-form');
  }

  async function applyStatus(workerId: string, next: AttendanceStatus) {
    if (pendingIds.has(workerId)) {
      return;
    }
    setPendingIds((prev) => new Set(prev).add(workerId));
    try {
      const current = rows.find((r) => r.worker_id === workerId);
      await upsertAttendance({
        workerId,
        date: selectedDate,
        status: next,
        note: current?.note ?? null,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.worker_id === workerId ? { ...r, status: next } : r,
        ),
      );
      setSaveError(null);
    } catch {
      setSaveError("Couldn't save — try again");
    } finally {
      setPendingIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(workerId);
        return nextSet;
      });
    }
  }

  function cycleMark(workerId: string) {
    const row = rows.find((r) => r.worker_id === workerId);
    if (!row) {
      return;
    }
    const next: AttendanceStatus =
      row.status === null
        ? 'present'
        : CYCLE[(CYCLE.indexOf(row.status) + 1) % CYCLE.length];
    void applyStatus(workerId, next);
  }

  function pickMark(workerId: string, next: AttendanceStatus) {
    void applyStatus(workerId, next);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          Attendance
        </Text>
        <DateStrip selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        {loading ? (
          <ActivityIndicator
            accessibilityLabel="Loading attendance"
            color={theme.primary}
            style={styles.loader}
          />
        ) : loadError ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={Users}
              title="Couldn't load attendance"
              actionLabel="Try again"
              onAction={retry}
            />
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={Users}
              title="No attendance marked for this date"
              actionLabel="Add worker"
              onAction={goToAdd}
            />
          </View>
        ) : (
          <View style={styles.listWrap}>
            {saveError !== null ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.saveError, { color: theme.destructive }]}>
                {saveError}
              </Text>
            ) : null}
            <FlatList
              data={rows}
              keyExtractor={(item) => item.worker_id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <AttendanceRow
                  name={item.name}
                  status={item.status}
                  pending={pendingIds.has(item.worker_id)}
                  onCycle={() => cycleMark(item.worker_id)}
                  onPick={(next) => pickMark(item.worker_id, next)}
                />
              )}
            />
          </View>
        )}
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
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyWrap: {
    flex: 1,
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
  pendingWrap: {
    opacity: 0.6,
  },
  listWrap: {
    flex: 1,
  },
  saveError: {
    ...Type.caption,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  name: {
    ...Type.body,
    fontWeight: '600',
  },
});
