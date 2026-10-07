import { router, useFocusEffect } from 'expo-router';
import { Users } from 'lucide-react-native';
import { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateStrip } from '@/components/date-strip';
import { EmptyState } from '@/components/empty-state';
import { NoteField } from '@/components/note-field';
import { StatusPicker, StatusPill } from '@/components/status-pill';
import { MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { CYCLE, STATUS, type AttendanceStatus } from '@/constants/status';
import {
  getAttendanceForDate,
  getDailyCounts,
  upsertAttendance,
  type AttendanceDateRow,
  type DailyCounts,
} from '@/db/attendance';
import type { Worksite } from '@/db/types';
import { listWorksites } from '@/db/worksites';
import { useTheme } from '@/hooks/use-theme';
import { todayKey } from '@/utils/dates';

const AttendanceRow = memo(function AttendanceRow({
  name,
  status,
  note,
  pending,
  onCycle,
  onPick,
  onSaveNote,
  onNoteExpandChange,
}: {
  name: string;
  status: AttendanceStatus | null;
  note: string | null;
  pending: boolean;
  onCycle: () => void;
  onPick: (s: AttendanceStatus) => void;
  onSaveNote: (text: string | null) => Promise<void>;
  onNoteExpandChange?: (expanded: boolean) => void;
}): React.JSX.Element {
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.topRow}>
        <Text
          numberOfLines={1}
          style={[styles.name, { color: theme.foreground }]}>
          {name}
        </Text>
        <View style={pending ? styles.pendingWrap : undefined}>
          <StatusPill
            status={status}
            onCycle={onCycle}
            onOpenPicker={() => setPickerOpen(true)}
          />
        </View>
      </View>
      {pickerOpen ? (
        <StatusPicker
          onPick={(next) => {
            setPickerOpen(false);
            onPick(next);
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
      <NoteField note={note} onSave={onSaveNote} onExpandChange={onNoteExpandChange} />
    </View>
  );
});

function CountsHeader({ counts }: { counts: DailyCounts }): React.JSX.Element {
  const theme = useTheme();
  const stats = [
    { key: 'present', label: 'Present', value: counts.present, color: STATUS.present.solid },
    { key: 'absent', label: 'Absent', value: counts.absent, color: STATUS.absent.solid },
    { key: 'half_day', label: 'Half', value: counts.half_day, color: STATUS.half_day.solid },
    { key: 'off_day', label: 'Off', value: counts.off_day, color: STATUS.off_day.solid },
    { key: 'unmarked', label: 'Unmarked', value: counts.unmarked, color: null },
  ] as const;
  return (
    <View style={styles.countsRow}>
      {stats.map((stat) => (
        <View
          key={stat.key}
          style={styles.stat}
          accessibilityLabel={`${stat.value} ${stat.label.toLowerCase()}`}>
          <View style={styles.statTop}>
            <View
              style={[
                styles.dot,
                { backgroundColor: stat.color ?? theme.mutedForeground },
              ]}
            />
            <Text style={[styles.statValue, { color: theme.foreground }]}>
              {stat.value}
            </Text>
          </View>
          <Text style={[styles.statLabel, { color: theme.mutedForeground }]}>
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function AttendanceScreen() {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [sites, setSites] = useState<Worksite[]>([]);
  const [rows, setRows] = useState<AttendanceDateRow[]>([]);
  const [counts, setCounts] = useState<DailyCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState<string | null>(null);
  // Collapse the worksite filter chips when the list scrolls or a note
  // editor is open, so the header stops hogging vertical space. The
  // status counts row (CountsHeader) always stays visible.
  const [scrolledPastTop, setScrolledPastTop] = useState(false);
  const [noteOpenIds, setNoteOpenIds] = useState<Set<string>>(new Set());
  const chipsCollapsed = scrolledPastTop || noteOpenIds.size > 0;

  function handleListScroll(y: number) {
    const past = y > 8;
    setScrolledPastTop((prev) => (prev === past ? prev : past));
  }

  const handleNoteExpand = useCallback((workerId: string, expanded: boolean) => {
    setNoteOpenIds((prev) => {
      if (expanded) {
        if (prev.has(workerId)) {
          return prev;
        }
        const next = new Set(prev);
        next.add(workerId);
        return next;
      }
      if (!prev.has(workerId)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(workerId);
      return next;
    });
  }, []);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const scope = selectedSite ? { worksiteId: selectedSite } : {};
      const [active, data, daily] = await Promise.all([
        listWorksites(),
        getAttendanceForDate(selectedDate, scope),
        getDailyCounts(selectedDate, scope),
      ]);
      setSites(active);
      setRows(data);
      setCounts(daily);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [selectedDate, selectedSite]),
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

  function goToWorksiteForm() {
    router.push('/worksite-form');
  }

  async function applyStatus(workerId: string, next: AttendanceStatus) {
    if (pendingIds.has(workerId)) {
      return;
    }
    setPendingIds((prev) => new Set(prev).add(workerId));
    try {
      const row = rows.find((r) => r.worker_id === workerId);
      await upsertAttendance({
        workerId,
        date: selectedDate,
        status: next,
        note: row?.note ?? null,
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

  async function saveNote(workerId: string, text: string | null) {
    const row = rows.find((r) => r.worker_id === workerId);
    if (!row || pendingIds.has(workerId)) {
      return;
    }
    // A note NEEDS a status row — default an unmarked row to 'present'
    // (row.note stays untouched; only the new text is written).
    const status = row.status ?? 'present';
    setPendingIds((prev) => new Set(prev).add(workerId));
    try {
      await upsertAttendance({
        workerId,
        date: selectedDate,
        status,
        note: text,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.worker_id === workerId ? { ...r, status, note: text } : r,
        ),
      );
      setSaveError(null);
    } catch {
      setSaveError("Couldn't save — try again");
      throw new Error('save-note-failed');
    } finally {
      setPendingIds((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(workerId);
        return nextSet;
      });
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={[styles.title, { color: theme.foreground }]}>
          Attendance
        </Text>
        <DateStrip selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        {chipsCollapsed ? null : (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          layout={LinearTransition.duration(200)}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {[{ id: null as string | null, name: 'All' }].concat(
            sites.map((site) => ({ id: site.id as string | null, name: site.name })),
          ).map((chip) => {
            const selected =
              chip.id === null ? selectedSite === null : selectedSite === chip.id;
            const label = chip.id === null ? 'All' : chip.name;
            return (
              <Pressable
                key={chip.id ?? '__all__'}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                android_ripple={{
                  color: selected ? theme.onPrimary : theme.muted,
                }}
                onPress={() => setSelectedSite(chip.id)}
                style={({ pressed }) => [
                  styles.chip,
                  selected
                    ? {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                      }
                    : {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                  { opacity: pressed ? 0.85 : 1 },
                ]}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: selected ? theme.onPrimary : theme.foreground,
                    },
                  ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        </Animated.View>
        )}
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
            {sites.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No worksites yet"
                actionLabel="Add worksite"
                onAction={goToWorksiteForm}
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No attendance marked for this date"
                actionLabel="Add worker"
                onAction={goToAdd}
              />
            )}
          </View>
        ) : (
          <Animated.View
            style={styles.listWrap}
            layout={LinearTransition.duration(200)}>
            {counts !== null ? <CountsHeader counts={counts} /> : null}
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
              onScroll={(e) => handleListScroll(e.nativeEvent.contentOffset.y)}
              scrollEventThrottle={16}
              renderItem={({ item: row }) => (
                <AttendanceRow
                  name={row.name}
                  status={row.status}
                  note={row.note}
                  pending={pendingIds.has(row.worker_id)}
                  onCycle={() => cycleMark(row.worker_id)}
                  onPick={(next) => pickMark(row.worker_id, next)}
                  onSaveNote={(text) => saveNote(row.worker_id, text)}
                  onNoteExpandChange={(expanded) =>
                    handleNoteExpand(row.worker_id, expanded)
                  }
                />
              )}
            />
          </Animated.View>
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
    gap: Spacing.two,
    minHeight: 44,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  pendingWrap: {
    opacity: 0.6,
  },
  chipRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  chipText: {
    ...Type.label,
  },
  countsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  statValue: {
    ...Type.caption,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...Type.caption,
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
    flex: 1,
    ...Type.body,
    fontWeight: '600',
  },
});
