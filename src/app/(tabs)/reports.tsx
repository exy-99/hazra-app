import { router, useFocusEffect } from 'expo-router';
import { CalendarDays, Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AttendanceRing } from '@/components/attendance-ring';
import { CalendarSheet } from '@/components/calendar-sheet';
import { EmptyState } from '@/components/empty-state';
import { ReportRow } from '@/components/report-row';
import { TrendChart, type BucketSummary } from '@/components/trend-chart';
import { STATUS } from '@/constants/status';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, Type } from '@/constants/theme';
import { getAttendanceForWorker } from '@/db/attendance';
import type { AttendanceEntry } from '@/db/types';
import { listWorkers } from '@/db/workers';
import type { Worksite } from '@/db/types';
import { listWorksites } from '@/db/worksites';
import { useTheme } from '@/hooks/use-theme';
import { formatDisplay, todayKey } from '@/utils/dates';
import { summarize, type AttendanceSummary } from '@/utils/attendance';
import {
  bottomThree,
  bucketDates,
  isValidRange,
  listDatesInRange,
  rangeForPeriod,
  sortWorkersHighestFirst,
  type PerWorkerStat,
  type ReportPeriod,
  type ReportRange,
} from '@/utils/reports';

const PERIODS = [7, 30, 90] as const;

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
            key={`row-skeleton-${i}`}
            accessibilityLabel="Loading rows"
            style={[styles.rowSkeleton, { backgroundColor: muted }]}
          />
        ))}
      </View>
      <View
        accessibilityLabel="Loading trend"
        style={[styles.chartSkeleton, { backgroundColor: muted }]}
      />
    </View>
  );
}

export default function ReportsScreen() {
  const theme = useTheme();
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [period, setPeriod] = useState<ReportPeriod>(30);
  const [customRange, setCustomRange] = useState<ReportRange | null>(null);
  const [draftFrom, setDraftFrom] = useState<string | null>(null);
  const [draftTo, setDraftTo] = useState<string | null>(null);
  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [sites, setSites] = useState<Worksite[]>([]);
  const [aggregate, setAggregate] = useState<AttendanceSummary | null>(null);
  const [sorted, setSorted] = useState<PerWorkerStat[]>([]);
  const [lowest, setLowest] = useState<PerWorkerStat[]>([]);
  const [trend, setTrend] = useState<BucketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const today = todayKey();
  const preset = period === 'custom' ? null : rangeForPeriod(period, today);
  const from = preset !== null ? preset.from : (customRange?.from ?? rangeForPeriod(30, today).from);
  const to = preset !== null ? preset.to : (customRange?.to ?? today);
  const customTouched = draftFrom !== null || draftTo !== null;
  const customValid =
    draftFrom !== null && draftTo !== null && isValidRange(draftFrom, draftTo, today);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const [active, workers] = await Promise.all([
        listWorksites(),
        listWorkers(selectedSite ? { worksiteId: selectedSite } : {}),
      ]);
      setSites(active);
      const entriesByWorker: AttendanceEntry[][] = await Promise.all(
        workers.map((w) => getAttendanceForWorker(w.id, { from, to })),
      );
      const allFlat = entriesByWorker.flat();
      setAggregate(summarize(allFlat));
      const perWorker: PerWorkerStat[] = workers.map((w, i) => ({
        workerId: w.id,
        name: w.name,
        summary: summarize(entriesByWorker[i]),
      }));
      setSorted(sortWorkersHighestFirst(perWorker));
      setLowest(bottomThree(perWorker));
      const dates = listDatesInRange(from, to);
      const buckets = bucketDates(dates);
      const byDate: Record<string, AttendanceEntry[]> = {};
      for (const entry of allFlat) {
        const list = byDate[entry.date];
        if (list) {
          list.push(entry);
        } else {
          byDate[entry.date] = [entry];
        }
      }
      const trendData: BucketSummary[] = buckets.map((b) => {
        const dayEntries = b.dates.flatMap((d) => byDate[d] ?? []);
        return {
          key: b.key,
          label: b.label,
          percentage: summarize(dayEntries).percentage,
        };
      });
      setTrend(trendData);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [selectedSite, from, to]),
  );

  function goToProfile(id: string) {
    router.push({ pathname: '/worker/[id]', params: { id } });
  }

  function retry() {
    setLoading(true);
    void load();
  }

  function applyCustom() {
    if (!customValid || draftFrom === null || draftTo === null) {
      return;
    }
    setCustomRange({ from: draftFrom, to: draftTo });
    setPeriod('custom');
  }

  const stats =
    aggregate === null
      ? []
      : ([
          { key: 'present', label: 'Present', value: aggregate.present, color: STATUS.present.solid },
          { key: 'absent', label: 'Absent', value: aggregate.absent, color: STATUS.absent.solid },
          { key: 'half_day', label: 'Half', value: aggregate.half_day, color: STATUS.half_day.solid },
          { key: 'off_day', label: 'Off', value: aggregate.off_day, color: STATUS.off_day.solid },
        ] as const);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: theme.foreground }]}>Reports</Text>
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
                  accessibilityLabel={chip.id === null ? 'All worksites' : label}
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
          <View style={styles.rangeWrap}>
            <View style={styles.chipRowInline}>
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
                          color: selected ? theme.onPrimary : theme.foreground,
                        },
                      ]}>
                      {`Last ${p} days`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Custom from date, ${draftFrom !== null ? formatDisplay(draftFrom) : 'not selected'}`}
              android_ripple={{ color: theme.muted }}
              onPress={() => setFromOpen(true)}
              style={({ pressed }) => [
                styles.dateField,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <CalendarDays size={18} color={theme.primary} />
              <Text style={[styles.dateFieldLabel, { color: theme.foreground }]}>
                {draftFrom !== null ? formatDisplay(draftFrom) : 'Select'}
              </Text>
              <Text style={[styles.dateFieldCaption, { color: theme.mutedForeground }]}>
                From
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Custom to date, ${draftTo !== null ? formatDisplay(draftTo) : 'not selected'}`}
              android_ripple={{ color: theme.muted }}
              onPress={() => setToOpen(true)}
              style={({ pressed }) => [
                styles.dateField,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <CalendarDays size={18} color={theme.primary} />
              <Text style={[styles.dateFieldLabel, { color: theme.foreground }]}>
                {draftTo !== null ? formatDisplay(draftTo) : 'Select'}
              </Text>
              <Text style={[styles.dateFieldCaption, { color: theme.mutedForeground }]}>
                To
              </Text>
            </Pressable>
            {customTouched && !customValid ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.hint, { color: theme.destructive }]}>
                Choose From on or before To, both on or before today.
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Apply custom range"
              accessibilityState={{ disabled: !customValid }}
              android_ripple={{ color: theme.onPrimary }}
              disabled={!customValid}
              onPress={applyCustom}
              style={({ pressed }) => [
                styles.save,
                {
                  backgroundColor: theme.primary,
                  opacity: customValid ? (pressed ? 0.85 : 1) : 0.5,
                },
              ]}>
              <Text style={[styles.saveLabel, { color: theme.onPrimary }]}>Save</Text>
            </Pressable>
          </View>
          {loading && aggregate === null && !loadError ? (
            <StatsSkeleton muted={theme.muted} />
          ) : loadError ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={Users}
                title="Couldn't load reports"
                actionLabel="Try again"
                onAction={retry}
              />
            </View>
          ) : aggregate !== null ? (
            loading ? (
              <StatsSkeleton muted={theme.muted} />
            ) : (
              <View style={styles.statsWrap}>
                <AttendanceRing value={aggregate.percentage} size={120} />
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
                {aggregate.percentage === null ? (
                  <View style={styles.historyEmptyWrap}>
                    <EmptyState icon={Users} title="No attendance recorded yet" />
                  </View>
                ) : null}
              </View>
            )
          ) : null}
          {/* Per-worker list + bottom-3 (05-03), derived from the 05-02 dataset */}
          {aggregate !== null && !loading ? (
            <View style={styles.listWrap}>
              {lowest.length > 0 ? (
                <View style={styles.section}>
                  <Text
                    accessibilityRole="header"
                    style={[styles.sectionTitle, { color: theme.foreground }]}>
                    Frequently absent
                  </Text>
                  <View style={styles.list}>
                    {lowest.map((item) => (
                      <ReportRow
                        key={item.workerId}
                        workerId={item.workerId}
                        name={item.name}
                        summary={item.summary}
                        onOpen={goToProfile}
                      />
                    ))}
                  </View>
                </View>
              ) : null}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.foreground }]}>
                  All workers
                </Text>
                <Text
                  style={[
                    styles.sectionCount,
                    { color: theme.mutedForeground },
                  ]}>
                  {`${sorted.length} workers`}
                </Text>
                <FlatList
                  data={sorted}
                  keyExtractor={(item) => item.workerId}
                  scrollEnabled={false}
                  contentContainerStyle={styles.list}
                  renderItem={({ item }) => (
                    <ReportRow
                      workerId={item.workerId}
                      name={item.name}
                      summary={item.summary}
                      onOpen={goToProfile}
                    />
                  )}
                />
              </View>
            </View>
          ) : null}
          {/* Trend section (05-04), derived from the shared 05-02 dataset */}
          {aggregate !== null && !loading ? (
            <View style={styles.section}>
              <Text
                accessibilityRole="header"
                style={[styles.sectionTitle, { color: theme.foreground }]}>
                Trends
              </Text>
              <TrendChart buckets={trend} />
            </View>
          ) : null}
        </ScrollView>
        <CalendarSheet
          visible={fromOpen}
          selectedKey={draftFrom}
          maxDate={todayKey()}
          daysBack={120}
          onPick={(key) => {
            setDraftFrom(key);
            setFromOpen(false);
          }}
          onClose={() => setFromOpen(false)}
        />
        <CalendarSheet
          visible={toOpen}
          selectedKey={draftTo}
          maxDate={todayKey()}
          daysBack={120}
          onPick={(key) => {
            setDraftTo(key);
            setToOpen(false);
          }}
          onClose={() => setToOpen(false)}
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
  },
  content: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  title: {
    ...Type.h1,
  },
  emptyWrap: {
    paddingVertical: Spacing.two,
  },
  chipRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  chipRowInline: {
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
  rangeWrap: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  dateFieldLabel: {
    ...Type.body,
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  dateFieldCaption: {
    ...Type.caption,
  },
  hint: {
    ...Type.caption,
  },
  save: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  saveLabel: {
    ...Type.label,
    textAlign: 'center',
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
  ringSkeleton: {
    width: 120,
    height: 120,
    borderRadius: Radius.pill,
  },
  statSkeleton: {
    flex: 1,
    height: 44,
  },
  historySkeletonWrap: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  listWrap: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  section: {
    alignSelf: 'stretch',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  sectionTitle: {
    ...Type.h2,
  },
  sectionCount: {
    ...Type.caption,
    fontVariant: ['tabular-nums'],
  },
  list: {
    gap: Spacing.two,
  },
  rowSkeleton: {
    alignSelf: 'stretch',
    height: 72,
    borderRadius: Radius.md,
  },
  chartSkeleton: {
    alignSelf: 'stretch',
    height: 200,
    borderRadius: Radius.md,
  },
});
