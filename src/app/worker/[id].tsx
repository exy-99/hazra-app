import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Phone, Users } from 'lucide-react-native';
import { memo, useCallback, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttendanceRing } from '@/components/attendance-ring';
import { EmptyState } from '@/components/empty-state';
import { STATUS } from '@/constants/status';
import { MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { getAttendanceForWorker } from '@/db/attendance';
import type { AttendanceEntry, Worker } from '@/db/types';
import { getWorker } from '@/db/workers';
import { listWorksites } from '@/db/worksites';
import { useTheme } from '@/hooks/use-theme';
import { addDays, formatDisplay, todayKey } from '@/utils/dates';
import { summarize } from '@/utils/attendance';

const PERIODS = [7, 30, 90] as const;
type Period = (typeof PERIODS)[number];

function StatsSkeleton({ muted }: { muted: string }): React.JSX.Element {
  return (
    <View style={styles.statsWrap}>
      <View
        accessibilityLabel="Loading stats"
        style={[styles.ringSkeleton, { backgroundColor: muted }]}
      />
      <View style={styles.countsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={`stat-skeleton-${i}`} style={styles.statSkeleton} />
        ))}
      </View>
      <View style={styles.historySkeletonWrap}>
        {[0, 1, 2].map((i) => (
          <View
            key={`history-skeleton-${i}`}
            accessibilityLabel="Loading history"
            style={[styles.historySkeleton, { backgroundColor: muted }]}
          />
        ))}
      </View>
    </View>
  );
}

const HistoryRow = memo(function HistoryRow({
  entry,
}: {
  entry: AttendanceEntry;
}): React.JSX.Element {
  const theme = useTheme();
  const chip = STATUS[entry.status];

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${formatDisplay(entry.date)}, ${chip.label}`}
      style={[
        styles.historyRow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.historyTop}>
        <Text style={[styles.historyDate, { color: theme.foreground }]}>
          {formatDisplay(entry.date)}
        </Text>
        <View
          style={[
            styles.historyChip,
            { backgroundColor: chip.tint, borderColor: chip.solid },
          ]}>
          <Text style={[styles.historyChipText, { color: chip.text }]}>
            {chip.label}
          </Text>
        </View>
      </View>
      {entry.note !== null ? (
        <Text
          numberOfLines={1}
          style={[styles.historyNote, { color: theme.mutedForeground }]}>
          {entry.note}
        </Text>
      ) : null}
    </View>
  );
});

export default function WorkerProfileScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [period, setPeriod] = useState<Period>(30);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [siteName, setSiteName] = useState<string>('—');
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const rawId = typeof id === 'string' ? id : '';
      const [found, allSites] = await Promise.all([
        getWorker(rawId),
        listWorksites(true),
      ]);
      if (found === null) {
        setNotFound(true);
        setWorker(null);
        setEntries([]);
        return;
      }
      setNotFound(false);
      setWorker(found);
      setSiteName(
        new Map(allSites.map((site) => [site.id, site.name] as const)).get(
          found.worksite_id,
        ) ?? '—',
      );
      const to = todayKey();
      const from = addDays(to, -(period - 1));
      const data = await getAttendanceForWorker(rawId, { from, to });
      setEntries(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [id, period]),
  );

  function retry() {
    setLoading(true);
    void load();
  }

  function goToEdit() {
    if (typeof id !== 'string') {
      return;
    }
    router.push({ pathname: '/worker-form', params: { id } });
  }

  function callPhone() {
    if (worker?.phone) {
      void Linking.openURL(`tel:${worker.phone}`);
    }
  }

  const summary = summarize(entries);
  const removed = worker !== null && worker.is_active === 0;
  const stats = [
    { key: 'present', label: 'Present', value: summary.present, color: STATUS.present.solid },
    { key: 'absent', label: 'Absent', value: summary.absent, color: STATUS.absent.solid },
    { key: 'half_day', label: 'Half', value: summary.half_day, color: STATUS.half_day.solid },
    { key: 'off_day', label: 'Off', value: summary.off_day, color: STATUS.off_day.solid },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {loading && worker === null && !loadError && !notFound ? (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.chipRow}>
              {PERIODS.map((p) => (
                <Pressable
                  key={`period-${p}`}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: period === p }}
                  accessibilityLabel={`Last ${p} days`}
                  android_ripple={{
                    color: period === p ? theme.onPrimary : theme.muted,
                  }}
                  onPress={() => setPeriod(p)}
                  style={({ pressed }) => [
                    styles.chip,
                    period === p
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
                        color:
                          period === p ? theme.onPrimary : theme.foreground,
                      },
                    ]}>
                    {`${p} days`}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View
              style={[styles.nameSkeleton, { backgroundColor: theme.muted }]}
            />
            <StatsSkeleton muted={theme.muted} />
          </ScrollView>
        ) : notFound ? (
          <View style={styles.emptyWrap}>
            <EmptyState icon={Users} title="Worker not found" />
          </View>
        ) : loadError ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={Users}
              title="Couldn't load worker"
              actionLabel="Try again"
              onAction={retry}
            />
          </View>
        ) : worker === null ? (
          <View style={styles.emptyWrap}>
            <EmptyState icon={Users} title="Worker not found" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            {removed ? (
              <View
                accessibilityRole="text"
                accessibilityLabel="Removed worker"
                style={[
                  styles.removedBanner,
                  { backgroundColor: theme.muted },
                ]}>
                <Text
                  style={[
                    styles.removedText,
                    { color: theme.destructive },
                  ]}>
                  Removed
                </Text>
              </View>
            ) : null}
            <Text style={[styles.name, { color: theme.foreground }]}>
              {worker.name}
            </Text>
            <Text style={[styles.meta, { color: theme.mutedForeground }]}>
              {`${worker.role ?? 'Worker'} · ${siteName}`}
            </Text>
            {worker.phone !== null ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Call ${worker.phone}`}
                android_ripple={{ color: theme.muted }}
                onPress={callPhone}
                style={({ pressed }) => [
                  styles.phoneRow,
                  { opacity: pressed ? 0.85 : 1 },
                ]}>
                <Phone size={18} color={theme.primary} />
                <Text style={[styles.phone, { color: theme.primary }]}>
                  {worker.phone}
                </Text>
              </Pressable>
            ) : null}
            <View style={styles.chipRow}>
              {PERIODS.map((p) => {
                const selected = period === p;
                return (
                  <Pressable
                    key={`period-${p}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Last ${p} days`}
                    android_ripple={{
                      color: selected ? theme.onPrimary : theme.muted,
                    }}
                    onPress={() => setPeriod(p)}
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
                          color: selected
                            ? theme.onPrimary
                            : theme.foreground,
                        },
                      ]}>
                      {`${p} days`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {loading ? (
              <StatsSkeleton muted={theme.muted} />
            ) : (
              <>
              <View style={styles.statsWrap}>
                <AttendanceRing value={summary.percentage} />
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
                            { backgroundColor: stat.color },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statValue,
                            { color: theme.foreground },
                          ]}>
                          {stat.value}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.statLabel,
                          { color: theme.mutedForeground },
                        ]}>
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
                {summary.percentage === null && entries.length > 0 ? (
                  <View style={styles.historyEmptyWrap}>
                    <EmptyState
                      icon={Users}
                      title="No attendance recorded yet"
                    />
                  </View>
                ) : null}
                {removed ? null : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Edit worker"
                    android_ripple={{ color: theme.onAccent }}
                    onPress={goToEdit}
                    style={({ pressed }) => [
                      styles.edit,
                      {
                        backgroundColor: theme.accent,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.editLabel,
                        { color: theme.onAccent },
                      ]}>
                      Edit
                    </Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.historyWrap}>
                {entries.length === 0 ? (
                  <EmptyState
                    icon={Users}
                    title="No attendance recorded yet"
                  />
                ) : (
                  <FlatList
                    data={[...entries].reverse()}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={false}
                    contentContainerStyle={styles.historyList}
                    renderItem={({ item }) => (
                      <HistoryRow entry={item} />
                    )}
                  />
                )}
              </View>
              </>
            )}
          </ScrollView>
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
  content: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  removedBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  removedText: {
    ...Type.label,
    textAlign: 'center',
  },
  name: {
    ...Type.h1,
  },
  meta: {
    ...Type.caption,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
  },
  phone: {
    ...Type.body,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
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
  statsWrap: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  countsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
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
  historyEmptyWrap: {
    alignSelf: 'stretch',
  },
  historyWrap: {
    alignSelf: 'stretch',
    paddingVertical: Spacing.two,
  },
  historyList: {
    gap: Spacing.two,
  },
  historyRow: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  historyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  historyDate: {
    ...Type.body,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  historyChip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  historyChipText: {
    ...Type.caption,
    fontWeight: '600',
  },
  historyNote: {
    ...Type.caption,
  },
  historySkeletonWrap: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  historySkeleton: {
    alignSelf: 'stretch',
    height: 72,
    borderRadius: Radius.md,
  },
  edit: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  editLabel: {
    ...Type.label,
    textAlign: 'center',
  },
  nameSkeleton: {
    height: 34,
    width: '60%',
    borderRadius: Radius.md,
  },
  ringSkeleton: {
    width: 120,
    height: 120,
    borderRadius: Radius.pill,
  },
  statSkeleton: {
    flex: 1,
    height: 44,
  },
});
