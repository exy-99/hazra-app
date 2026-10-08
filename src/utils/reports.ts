import type { AttendanceSummary } from '@/utils/attendance';
import { addDays, formatDisplay } from '@/utils/dates';

export type ReportPeriod = 7 | 30 | 90 | 'custom';

export interface ReportRange {
  from: string;
  to: string;
}

export function rangeForPeriod(period: 7 | 30 | 90, today: string): ReportRange {
  return { from: addDays(today, -(period - 1)), to: today };
}

export function isValidRange(from: string, to: string, today: string): boolean {
  return from <= to && to <= today && from <= today;
}

export function listDatesInRange(from: string, to: string): string[] {
  if (from > to) {
    return [];
  }
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export interface DateBucket {
  key: string;
  label: string;
  dates: string[];
}

// Weekly buckets are from-anchored 7-day chunks (deterministic, locale-free) — RESEARCH A2.
export function bucketDates(dates: string[], maxDailyBars = 31): DateBucket[] {
  if (dates.length <= maxDailyBars) {
    return dates.map((date) => ({
      key: date,
      label: formatDisplay(date, 'D MMM'),
      dates: [date],
    }));
  }
  const buckets: DateBucket[] = [];
  for (let start = 0; start < dates.length; start += 7) {
    const chunk = dates.slice(start, start + 7);
    const first = chunk[0];
    const last = chunk[chunk.length - 1];
    buckets.push({
      key: first,
      label: `${formatDisplay(first, 'D MMM')}–${formatDisplay(last, 'D MMM')}`,
      dates: chunk,
    });
  }
  return buckets;
}

export interface PerWorkerStat {
  workerId: string;
  name: string;
  summary: AttendanceSummary;
}

export function sortWorkersHighestFirst(rows: PerWorkerStat[]): PerWorkerStat[] {
  return [...rows].sort((a, b) => {
    const diff = (b.summary.percentage ?? -1) - (a.summary.percentage ?? -1);
    if (diff !== 0) {
      return diff;
    }
    return a.name.localeCompare(b.name);
  });
}

export function bottomThree(rows: PerWorkerStat[]): PerWorkerStat[] {
  return rows
    .filter((row) => row.summary.percentage !== null)
    .sort((a, b) => {
      const diff = (a.summary.percentage ?? 0) - (b.summary.percentage ?? 0);
      if (diff !== 0) {
        return diff;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 3);
}
