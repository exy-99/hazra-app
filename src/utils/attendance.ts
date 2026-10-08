import type { AttendanceStatus } from '@/db/types';

/** Per-status counts plus the PRD §9 attendance percentage. */
export interface AttendanceSummary {
  present: number;
  absent: number;
  half_day: number;
  off_day: number;
  denominator: number;
  percentage: number | null;
}

/** Attendance-% floor: the profile ring turns accent below this (roadmap criterion #3). */
export const ATTENDANCE_PCT_FLOOR = 75;

/**
 * Summarize a worker's entries into counts + attendance %.
 * off_day is excluded from the denominator (PRD §9); half_day counts 0.5.
 * Zero countable days → percentage null (callers render "—", never NaN or 0%).
 */
export function summarize(entries: Pick<{ status: AttendanceStatus }, 'status'>[]): AttendanceSummary {
  let present = 0;
  let absent = 0;
  let half_day = 0;
  let off_day = 0;
  for (const entry of entries) {
    switch (entry.status) {
      case 'present':
        present += 1;
        break;
      case 'absent':
        absent += 1;
        break;
      case 'half_day':
        half_day += 1;
        break;
      case 'off_day':
        off_day += 1;
        break;
    }
  }
  const denominator = present + absent + half_day;
  const percentage =
    denominator === 0 ? null : Math.round(((present + 0.5 * half_day) / denominator) * 100 * 100) / 100;
  return { present, absent, half_day, off_day, denominator, percentage };
}
