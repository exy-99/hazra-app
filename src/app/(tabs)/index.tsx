import { router, useFocusEffect } from 'expo-router';
import { Users } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
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
import {
  BottomTabInset,
  MaxContentWidth,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import {
  getAttendanceForDate,
  getDailyCounts,
  type AttendanceDateRow,
  type DailyCounts,
} from '@/db/attendance';
import type { AttendanceStatus } from '@/db/types';
import { useTheme } from '@/hooks/use-theme';
import { summarize } from '@/utils/attendance';
import { formatDisplay, todayKey } from '@/utils/dates';

const PILL_KEYS = ['present', 'absent', 'half_day', 'off_day'] as const;

// DAO rows carry `status: null` until marked. Rest state keeps those rows
// (unmarked counts need them) and every read path null-filters before
// summarizing (Pitfall 5), so the array is typed marked at rest; the
// ingestion cast preserves runtime nulls for the hasWorkers/hasMarks checks.
type MarkedRow = AttendanceDateRow & { status: AttendanceStatus };

function HomeSkeleton(): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.skeletonWrap}>
      <View
        accessibilityLabel="Loading today's attendance"
        style={[styles.ringSkeleton, { backgroundColor: theme.muted }]}
      />
      <View style={styles.pillsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={`home-skeleton-${i}`}
            style={[styles.pillSkeleton, { backgroundColor: theme.muted }]}
          />
        ))}
      </View>
      <View
        accessibilityLabel="Loading actions"
        style={[styles.ctaSkeleton, { backgroundColor: theme.muted }]}
      />
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const [rows, setRows] = useState<MarkedRow[]>([]);
  const [counts, setCounts] = useState<DailyCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  async function load() {
    setLoading(true);
    setLoadError(false);
    try {
      const today = todayKey();
      const [data, daily] = await Promise.all([
        getAttendanceForDate(today),
        getDailyCounts(today),
      ]);
      setRows(data as MarkedRow[]);
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
    }, []),
  );

  function retry() {
    setLoading(true);
    void load();
  }

  const today = todayKey();
  const dateLabel = formatDisplay(today);
  const hasWorkers = rows.length > 0;
  const hasMarks = rows.some((row) => row.status !== null);
  const pct = hasMarks
    ? summarize(rows.filter((r) => r.status !== null)).percentage
    : null;
  const unmarked = counts?.unmarked ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        {loading && counts === null && !loadError ? (
          <ScrollView contentContainerStyle={styles.content}>
            <HomeSkeleton />
          </ScrollView>
        ) : loadError ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={Users}
              title="Couldn't load today's attendance"
              actionLabel="Try again"
              onAction={retry}
            />
          </View>
        ) : !hasWorkers ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={Users}
              title="No workers yet"
              actionLabel="Add worker"
              onAction={() => router.push('/worker-form')}
            />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text
              accessibilityLabel={dateLabel}
              style={[styles.date, { color: theme.mutedForeground }]}>
              {dateLabel}
            </Text>
            <View style={styles.ringWrap}>
              <AttendanceRing value={pct} size={170} />
            </View>
            <View style={styles.pillsRow}>
              {PILL_KEYS.map((key) => {
                const chip = STATUS[key];
                const value = counts?.[key] ?? 0;
                return (
                  <Pressable
                    key={key}
                    accessibilityRole="button"
                    accessibilityLabel={`${value} ${chip.label.toLowerCase()} — open today's register`}
                    android_ripple={{ color: theme.muted }}
                    onPress={() => router.push('/attendance')}
                    style={({ pressed }) => [
                      styles.pillPress,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}>
                    <View
                      style={[
                        styles.pill,
                        {
                          backgroundColor: chip.tint,
                          borderColor: chip.solid,
                        },
                      ]}>
                      <Text style={[styles.pillCount, { color: chip.text }]}>
                        {value}
                      </Text>
                      <Text style={[styles.pillLabel, { color: chip.text }]}>
                        {chip.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.unmarked, { color: theme.mutedForeground }]}>
              {unmarked} unmarked
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark attendance"
              android_ripple={{ color: theme.onAccent }}
              onPress={() => router.push('/attendance')}
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: theme.accent,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Text style={[styles.ctaLabel, { color: theme.onAccent }]}>
                Mark attendance
              </Text>
            </Pressable>
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
    paddingTop: Spacing.two,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  skeletonWrap: {
    gap: Spacing.two,
  },
  date: {
    ...Type.label,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  ringWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pillPress: {
    flex: 1,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minHeight: 44,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  pillCount: {
    ...Type.label,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  pillLabel: {
    ...Type.caption,
    textAlign: 'center',
  },
  unmarked: {
    ...Type.caption,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
  },
  ctaLabel: {
    ...Type.label,
    textAlign: 'center',
  },
  ringSkeleton: {
    alignSelf: 'center',
    width: 170,
    height: 170,
    borderRadius: Radius.pill,
  },
  pillSkeleton: {
    flex: 1,
    height: 44,
    borderRadius: Radius.pill,
  },
  ctaSkeleton: {
    height: 52,
    borderRadius: Radius.md,
  },
});
