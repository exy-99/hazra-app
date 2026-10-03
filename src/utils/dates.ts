import dayjs from 'dayjs';

/** Local calendar date key (YYYY-MM-DD). Never UTC — see NF-05. */
export function todayKey(): string {
  return dayjs().format('YYYY-MM-DD');
}

/** Convert a Date to its local calendar date key (YYYY-MM-DD). */
export function toDateKey(d: Date): string {
  return dayjs(d).format('YYYY-MM-DD');
}

/** Add (or subtract, with negative n) calendar days to a date key. */
export function addDays(key: string, n: number): string {
  return dayjs(key, 'YYYY-MM-DD').add(n, 'day').format('YYYY-MM-DD');
}

/** Human-readable rendering of a date key; default 'DD MMM YYYY'. */
export function formatDisplay(key: string, fmt: string = 'DD MMM YYYY'): string {
  return dayjs(key, 'YYYY-MM-DD').format(fmt);
}

/** Ascending array of the last n date keys, ending at today. */
export function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(todayKey(), i - (n - 1)));
}
