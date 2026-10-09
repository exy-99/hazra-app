import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { CalendarDays, Download, Users } from 'lucide-react-native';
import { memo, useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { MonthSheet } from '@/components/month-sheet';
import { CYCLE, STATUS } from '@/constants/status';
import {
  BottomTabInset,
  MaxContentWidth,
  Radius,
  Spacing,
  Type,
} from '@/constants/theme';
import { getAttendanceForWorker } from '@/db/attendance';
import type { AttendanceStatus, Worker, Worksite } from '@/db/types';
import { getWorker, listWorkers } from '@/db/workers';
import { getWorksite, listWorksites } from '@/db/worksites';
import { useTheme } from '@/hooks/use-theme';
import { summarize } from '@/utils/attendance';
import { formatDisplay, todayKey } from '@/utils/dates';
import {
  buildRegisterCsv,
  buildRegisterPdfHtml,
  buildWorkerCsv,
  buildWorkerPdfHtml,
  monthLabel,
  monthRange,
  registerFilename,
  workerFilename,
  type PdfTheme,
  type RegisterCsvRow,
  type WorkerCsvEntry,
} from '@/utils/export';
import {
  copyBinaryFile,
  deleteFile,
  printHtmlToPdf,
  shareFile,
  writeTextFile,
} from '@/utils/files';

/**
 * Normalize a raw `?month=` display string to a local YYYY-MM key clamped
 * to the current month, so future months are impossible by construction.
 */
function normalizeMonth(raw: string | undefined, current: string): string {
  if (raw !== undefined && /^\d{4}-\d{2}$/.test(raw) && raw <= current) {
    return raw;
  }
  return current;
}

const PickRow = memo(function PickRow({
  title,
  detail,
  selected,
  onSelect,
}: {
  title: string;
  detail: string | null;
  selected: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      android_ripple={{ color: selected ? theme.onPrimary : theme.muted }}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.pickRow,
        selected
          ? { backgroundColor: theme.primary, borderColor: theme.primary }
          : { backgroundColor: theme.surface, borderColor: theme.border },
        { opacity: pressed ? 0.85 : 1 },
      ]}>
      <Text
        style={[
          styles.pickTitle,
          { color: selected ? theme.onPrimary : theme.foreground },
        ]}>
        {title}
      </Text>
      {detail !== null ? (
        <Text
          style={[
            styles.pickDetail,
            { color: selected ? theme.onPrimary : theme.mutedForeground },
          ]}>
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
});

const PreviewRow = memo(function PreviewRow({
  date,
  workerName,
  status,
  note,
}: {
  date: string;
  workerName: string | null;
  status: AttendanceStatus;
  note: string | null;
}): React.JSX.Element {
  const theme = useTheme();
  const chip = STATUS[status];
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${formatDisplay(date)}, ${chip.label}`}
      style={[
        styles.sampleRow,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}>
      <View style={styles.sampleTop}>
        <Text style={[styles.sampleDate, { color: theme.foreground }]}>
          {formatDisplay(date)}
        </Text>
        <View
          style={[
            styles.sampleChip,
            { backgroundColor: chip.tint, borderColor: chip.solid },
          ]}>
          <Text style={[styles.sampleChipText, { color: chip.text }]}>
            {chip.label}
          </Text>
        </View>
      </View>
      {workerName !== null ? (
        <Text style={[styles.sampleNote, { color: theme.mutedForeground }]}>
          {workerName}
        </Text>
      ) : null}
      {note !== null && note !== '' ? (
        <Text
          numberOfLines={1}
          style={[styles.sampleNote, { color: theme.mutedForeground }]}>
          {note}
        </Text>
      ) : null}
    </View>
  );
});

function PreviewSkeleton({ muted }: { muted: string }): React.JSX.Element {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((i) => (
        <View
          key={`preview-skeleton-${i}`}
          accessibilityLabel="Loading preview"
          style={[styles.skeletonRow, { backgroundColor: muted }]}
        />
      ))}
    </View>
  );
}

export default function ExportScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    workerId?: string;
    worksiteId?: string;
    month?: string;
  }>();
  const paramWorker = typeof params.workerId === 'string' ? params.workerId : null;
  const paramSite = typeof params.worksiteId === 'string' ? params.worksiteId : null;
  const paramMonth = typeof params.month === 'string' ? params.month : undefined;
  const currentMonth = todayKey().slice(0, 7);

  const [selectedScope, setSelectedScope] = useState<'worker' | 'worksite'>(
    paramSite !== null ? 'worksite' : 'worker',
  );
  const [selectedWorker, setSelectedWorker] = useState<string | null>(paramWorker);
  const [selectedSite, setSelectedSite] = useState<string | null>(paramSite);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    normalizeMonth(paramMonth, currentMonth),
  );
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf'>('csv');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [sites, setSites] = useState<Worksite[]>([]);
  const [entries, setEntries] = useState<WorkerCsvEntry[]>([]);
  const [regRows, setRegRows] = useState<RegisterCsvRow[]>([]);
  const [regWorkerCount, setRegWorkerCount] = useState(0);
  const [workerName, setWorkerName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savedUri, setSavedUri] = useState<string | null>(null);
  const [savedScope, setSavedScope] = useState<'worker' | 'worksite' | null>(null);
  const [savedFormat, setSavedFormat] = useState<'csv' | 'pdf' | null>(null);
  const [monthOpen, setMonthOpen] = useState(false);
  // WR-01: synchronous re-entry lock. `exporting` state updates
  // asynchronously, so two taps in the same tick both see `false`;
  // this ref closes that gap (reset in the `finally` below).
  const exportLock = useRef(false);
  // WR-02: generation counter — rapid scope/worker/site/month changes
  // leave multiple load() promises in flight; a stale resolution landing
  // last must not overwrite newer state (e.g. notFound/data mismatch).
  const loadGen = useRef(0);

  async function loadSiteRegister(
    siteId: string,
    name: string,
    isActive: number,
  ): Promise<void> {
    const { from, to } = monthRange(selectedMonth);
    const siteWorkers = await listWorkers(
      isActive === 1
        ? { worksiteId: siteId }
        : { worksiteId: siteId, includeInactive: true },
    );
    const perWorker = await Promise.all(
      siteWorkers.map((w) => getAttendanceForWorker(w.id, { from, to })),
    );
    const rows: RegisterCsvRow[] = perWorker.flatMap((list, i) =>
      list.map((e) => ({
        date: e.date,
        workerName: siteWorkers[i].name,
        status: e.status,
        note: e.note,
      })),
    );
    rows.sort((a, b) =>
      a.date < b.date
        ? -1
        : a.date > b.date
          ? 1
          : a.workerName.localeCompare(b.workerName),
    );
    setRegRows(rows);
    setRegWorkerCount(siteWorkers.length);
    setSiteName(name);
  }

  async function load() {
    const gen = ++loadGen.current;
    const isStale = () => gen !== loadGen.current;
    setLoading(true);
    setLoadError(false);
    try {
      const [activeWorkers, activeSites] = await Promise.all([
        listWorkers({}),
        listWorksites(),
      ]);
      if (isStale()) {
        return;
      }
      setWorkers(activeWorkers);
      setSites(activeSites);
      if (selectedScope === 'worker') {
        const rawW = selectedWorker;
        if (rawW === null) {
          const first = activeWorkers[0] ?? null;
          if (first === null) {
            setEntries([]);
            setWorkerName('');
            setNotFound(false);
          } else {
            setSelectedWorker(first.id);
            const data = await getAttendanceForWorker(first.id);
            if (isStale()) {
              return;
            }
            setEntries(
              data.map((e) => ({ date: e.date, status: e.status, note: e.note })),
            );
            setWorkerName(first.name);
            setNotFound(false);
          }
        } else {
          const found = await getWorker(rawW);
          if (isStale()) {
            return;
          }
          if (found === null) {
            setNotFound(true);
            setEntries([]);
            setWorkerName('');
          } else {
            setNotFound(false);
            const data = await getAttendanceForWorker(rawW);
            if (isStale()) {
              return;
            }
            setEntries(
              data.map((e) => ({ date: e.date, status: e.status, note: e.note })),
            );
            setWorkerName(found.name);
          }
        }
      } else {
        const rawS = selectedSite;
        if (rawS === null) {
          const first = activeSites[0] ?? null;
          if (first === null) {
            setRegRows([]);
            setRegWorkerCount(0);
            setSiteName('');
            setNotFound(false);
          } else {
            setSelectedSite(first.id);
            await loadSiteRegister(first.id, first.name, first.is_active);
            if (isStale()) {
              return;
            }
            setNotFound(false);
          }
        } else {
          const site = await getWorksite(rawS);
          if (isStale()) {
            return;
          }
          if (site === null) {
            setNotFound(true);
            setRegRows([]);
            setRegWorkerCount(0);
            setSiteName('');
          } else {
            setNotFound(false);
            await loadSiteRegister(site.id, site.name, site.is_active);
            if (isStale()) {
              return;
            }
          }
        }
      }
    } catch {
      if (isStale()) {
        return;
      }
      setLoadError(true);
    } finally {
      if (!isStale()) {
        setLoading(false);
      }
    }
  }

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [selectedScope, selectedWorker, selectedSite, selectedMonth]),
  );

  function retry() {
    setLoading(true);
    void load();
  }

  async function handleExport(): Promise<void> {
    if (exportLock.current) {
      return;
    }
    exportLock.current = true;
    setExporting(true);
    setExportError(null);
    let tempUri: string | null = null;
    let destUri: string | null = null;
    try {
      const pdfTheme: PdfTheme = {
        background: theme.background,
        surface: theme.surface,
        foreground: theme.foreground,
        mutedForeground: theme.mutedForeground,
        border: theme.border,
        primary: theme.primary,
      };
      if (selectedScope === 'worker') {
        const filename = workerFilename(workerName, todayKey(), selectedFormat);
        const content =
          selectedFormat === 'csv' ? buildWorkerCsv(entries) : null;
        const html =
          selectedFormat === 'pdf'
            ? buildWorkerPdfHtml({
                title: `${workerName} attendance`,
                entries,
                theme: pdfTheme,
              })
            : null;
        if (Platform.OS === 'web' && selectedFormat === 'csv' && content !== null) {
          const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setSavedName(filename);
          setSavedUri(url);
          return;
        }
        if (content !== null) {
          destUri = await writeTextFile(filename, content);
        } else if (html !== null) {
          tempUri = await printHtmlToPdf(html);
          destUri = await copyBinaryFile(tempUri, filename);
          await deleteFile(tempUri);
          tempUri = null;
        }
        setSavedName(filename);
        setSavedUri(destUri);
      } else {
        const filename = registerFilename(siteName, selectedMonth, selectedFormat);
        const content =
          selectedFormat === 'csv' ? buildRegisterCsv(regRows) : null;
        const html =
          selectedFormat === 'pdf'
            ? buildRegisterPdfHtml({
                title: `${siteName} register`,
                subtitle: `${siteName} · ${monthLabel(selectedMonth)}`,
                rows: regRows,
                theme: pdfTheme,
              })
            : null;
        if (Platform.OS === 'web' && selectedFormat === 'csv' && content !== null) {
          const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          setSavedName(filename);
          setSavedUri(url);
          return;
        }
        if (content !== null) {
          destUri = await writeTextFile(filename, content);
        } else if (html !== null) {
          tempUri = await printHtmlToPdf(html);
          destUri = await copyBinaryFile(tempUri, filename);
          await deleteFile(tempUri);
          tempUri = null;
        }
        setSavedName(filename);
        setSavedUri(destUri);
      }
      setSavedScope(selectedScope);
      setSavedFormat(selectedFormat);
    } catch {
      if (tempUri !== null) {
        await deleteFile(tempUri);
      }
      if (destUri !== null) {
        await deleteFile(destUri);
      }
      setExportError("Couldn't export — try again");
    } finally {
      exportLock.current = false;
      setExporting(false);
    }
  }

  async function handleShare(): Promise<void> {
    if (savedUri === null) {
      return;
    }
    try {
      const result = await shareFile(savedUri);
      if (result === 'unavailable') {
        return;
      }
    } catch {
      // Share-sheet dismiss changes nothing; stay on the success card.
    }
  }

  function resetExport(): void {
    setSavedName(null);
    setSavedUri(null);
    setSavedScope(null);
    setSavedFormat(null);
    setExportError(null);
  }

  const siteNames = new Map(sites.map((s) => [s.id, s.name] as const));
  const summary = summarize(entries);
  const scopeCount = selectedScope === 'worker' ? entries.length : regRows.length;
  const countLine =
    selectedScope === 'worker'
      ? `${entries.length} days · ${summary.present} present · ${summary.absent} absent · ${summary.half_day} half day · ${summary.off_day} off day`
      : `${regWorkerCount} workers · ${regRows.length} marks · ${monthLabel(selectedMonth)}`;
  const workerSamples = [...entries].slice(-5).reverse();
  const registerSamples = regRows.slice(0, 5);
  const ctaLabel =
    selectedScope === 'worker' ? 'Export worker history' : 'Export monthly register';
  // WR-07: once the success card shows for the current scope+format,
  // the CTA stays disabled — a repeat tap would write a deterministic
  // duplicate file. "Export another" (resetExport) re-enables it.
  const ctaDisabled = exporting || scopeCount === 0 || showSuccess;
  const showSuccess =
    savedName !== null &&
    savedUri !== null &&
    savedScope === selectedScope &&
    savedFormat === selectedFormat;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={[styles.title, { color: theme.foreground }]}>Export</Text>
          <Text style={[styles.caption, { color: theme.mutedForeground }]}>
            Payroll-ready files saved to Downloads.
          </Text>
          <View style={styles.scopeRow}>
            {(
              [
                { key: 'worker', label: 'Worker' },
                { key: 'worksite', label: 'Worksite month' },
              ] as const
            ).map((chip) => {
              const selected = selectedScope === chip.key;
              return (
                <Pressable
                  key={chip.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={chip.label}
                  android_ripple={{
                    color: selected ? theme.onPrimary : theme.muted,
                  }}
                  onPress={() => setSelectedScope(chip.key)}
                  style={({ pressed }) => [
                    styles.scopeChip,
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
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {selectedScope === 'worker' ? (
            workers.length === 0 && !loading ? (
              <View style={styles.emptyWrap}>
                <EmptyState
                  icon={Users}
                  title="No workers at this worksite"
                  actionLabel="Add worker"
                  onAction={() => router.push('/worker-form')}
                />
              </View>
            ) : (
              <FlatList
                data={workers}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.list}
                renderItem={({ item }) => (
                  <PickRow
                    title={item.name}
                    detail={`${item.role ?? 'Worker'} · ${siteNames.get(item.worksite_id) ?? '—'}`}
                    selected={item.id === selectedWorker}
                    onSelect={() => setSelectedWorker(item.id)}
                  />
                )}
              />
            )
          ) : sites.length === 0 && !loading ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={Users}
                title="No worksites yet"
                actionLabel="Add worksite"
                onAction={() => router.push('/worksite-form')}
              />
            </View>
          ) : (
            <FlatList
              data={sites}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.list}
              renderItem={({ item }) => (
                <PickRow
                  title={item.name}
                  detail={item.type}
                  selected={item.id === selectedSite}
                  onSelect={() => setSelectedSite(item.id)}
                />
              )}
            />
          )}
          {selectedScope === 'worksite' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Choose month, currently ${monthLabel(selectedMonth)}`}
              android_ripple={{ color: theme.muted }}
              onPress={() => setMonthOpen(true)}
              style={({ pressed }) => [
                styles.monthTrigger,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <CalendarDays size={18} color={theme.primary} />
              <Text style={[styles.monthLabel, { color: theme.foreground }]}>
                {monthLabel(selectedMonth)}
              </Text>
            </Pressable>
          ) : null}
          <View style={styles.formatRow}>
            {(
              [
                { key: 'csv', label: 'CSV' },
                { key: 'pdf', label: 'PDF' },
              ] as const
            ).map((chip) => {
              const selected = selectedFormat === chip.key;
              return (
                <Pressable
                  key={chip.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={chip.label}
                  android_ripple={{ color: theme.muted }}
                  onPress={() => setSelectedFormat(chip.key)}
                  style={({ pressed }) => [
                    styles.formatChip,
                    selected
                      ? {
                          backgroundColor: theme.muted,
                          borderColor: theme.primary,
                        }
                      : {
                          backgroundColor: theme.surface,
                          borderColor: theme.border,
                        },
                    { opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <Text
                    style={[styles.chipText, { color: theme.foreground }]}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.caption, { color: theme.mutedForeground }]}>
            {selectedFormat === 'csv'
              ? 'Opens in Excel or Sheets.'
              : 'Printable register table.'}
          </Text>
          {loading ? (
            <PreviewSkeleton muted={theme.muted} />
          ) : loadError ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={Users}
                title="Couldn't load export data"
                actionLabel="Try again"
                onAction={retry}
              />
            </View>
          ) : notFound ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                icon={Users}
                title={
                  selectedScope === 'worker'
                    ? 'Worker not found'
                    : 'Worksite not found'
                }
              />
            </View>
          ) : showSuccess ? (
            <View
              style={[
                styles.successCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <Download size={32} color={theme.primary} />
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.successTitle, { color: theme.foreground }]}>
                Saved to Downloads
              </Text>
              <Text style={[styles.filename, { color: theme.mutedForeground }]}>
                {savedName}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share file"
                android_ripple={{ color: theme.muted }}
                onPress={() => {
                  void handleShare();
                }}
                style={({ pressed }) => [
                  styles.shareRow,
                  { opacity: pressed ? 0.85 : 1 },
                ]}>
                <Text style={[styles.shareLabel, { color: theme.primary }]}>
                  Share file
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Export another"
                android_ripple={{ color: theme.muted }}
                onPress={resetExport}
                style={({ pressed }) => [
                  styles.shareRow,
                  { opacity: pressed ? 0.85 : 1 },
                ]}>
                <Text
                  style={[styles.shareLabel, { color: theme.mutedForeground }]}>
                  Export another
                </Text>
              </Pressable>
            </View>
          ) : scopeCount === 0 ? (
            <Text style={[styles.calmLine, { color: theme.mutedForeground }]}>
              No attendance to export yet
            </Text>
          ) : (
            <View
              style={[
                styles.previewCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}>
              <Text style={[styles.countLine, { color: theme.foreground }]}>
                {countLine}
              </Text>
              {(selectedScope === 'worker' ? workerSamples : registerSamples).map(
                (row, idx) =>
                  selectedScope === 'worker' ? (
                    <PreviewRow
                      key={`${row.date}-${idx}`}
                      date={row.date}
                      workerName={null}
                      status={row.status}
                      note={row.note}
                    />
                  ) : (
                    <PreviewRow
                      key={`${row.date}-${(row as RegisterCsvRow).workerName}-${idx}`}
                      date={row.date}
                      workerName={(row as RegisterCsvRow).workerName}
                      status={row.status}
                      note={row.note}
                    />
                  ),
              )}
              {selectedFormat === 'pdf' ? (
                <View style={styles.legendRow}>
                  {CYCLE.map((key) => (
                    <View
                      key={key}
                      style={styles.legendItem}
                      accessibilityLabel={STATUS[key].label}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: STATUS[key].solid },
                        ]}
                      />
                      <Text
                        style={[
                          styles.legendLabel,
                          { color: theme.mutedForeground },
                        ]}>
                        {STATUS[key].label}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
          {exporting ? (
            <View
              accessibilityLiveRegion="polite"
              style={styles.progressRow}>
              <View
                style={[styles.progressBar, { backgroundColor: theme.muted }]}
              />
              <Text
                style={[styles.progressLabel, { color: theme.mutedForeground }]}>
                Exporting…
              </Text>
            </View>
          ) : null}
          {exportError !== null && !showSuccess ? (
            <View style={styles.errorWrap}>
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.errorText, { color: theme.destructive }]}>
                {exportError}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Try again"
                android_ripple={{ color: theme.muted }}
                onPress={() => {
                  void handleExport();
                }}
                style={({ pressed }) => [
                  styles.retryRow,
                  { opacity: pressed ? 0.85 : 1 },
                ]}>
                <Text
                  style={[styles.retryLabel, { color: theme.destructive }]}>
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={exporting ? 'Exporting' : ctaLabel}
            accessibilityState={{ disabled: ctaDisabled }}
            android_ripple={{ color: theme.onAccent }}
            disabled={ctaDisabled}
            onPress={() => {
              void handleExport();
            }}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: theme.accent,
                opacity: ctaDisabled ? 0.5 : pressed ? 0.85 : 1,
              },
            ]}>
            <Text style={[styles.ctaLabel, { color: theme.onAccent }]}>
              {exporting ? 'Exporting…' : ctaLabel}
            </Text>
          </Pressable>
        </ScrollView>
        <MonthSheet
          visible={monthOpen}
          selectedMonth={selectedMonth}
          maxMonth={currentMonth}
          monthsBack={12}
          onPick={(month) => {
            setSelectedMonth(month);
            setMonthOpen(false);
          }}
          onClose={() => setMonthOpen(false)}
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
  caption: {
    ...Type.caption,
  },
  scopeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  scopeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  chipText: {
    ...Type.label,
  },
  emptyWrap: {
    paddingVertical: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  pickRow: {
    justifyContent: 'center',
    gap: 2,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  pickTitle: {
    ...Type.body,
    fontWeight: '600',
  },
  pickDetail: {
    ...Type.caption,
  },
  monthTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  monthLabel: {
    ...Type.body,
    fontVariant: ['tabular-nums'],
  },
  formatRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  formatChip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 96,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  previewCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  countLine: {
    ...Type.body,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sampleRow: {
    gap: Spacing.one,
    padding: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  sampleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sampleDate: {
    ...Type.body,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sampleChip: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  sampleChipText: {
    ...Type.caption,
    fontWeight: '600',
  },
  sampleNote: {
    ...Type.caption,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  legendLabel: {
    ...Type.caption,
  },
  calmLine: {
    ...Type.body,
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  skeletonWrap: {
    gap: Spacing.two,
  },
  skeletonRow: {
    alignSelf: 'stretch',
    height: 72,
    borderRadius: Radius.md,
  },
  progressRow: {
    gap: Spacing.two,
  },
  progressBar: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: Radius.pill,
  },
  progressLabel: {
    ...Type.caption,
  },
  errorWrap: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  errorText: {
    ...Type.body,
    textAlign: 'center',
  },
  retryRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  retryLabel: {
    ...Type.label,
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
  successCard: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  successTitle: {
    ...Type.h2,
    textAlign: 'center',
  },
  filename: {
    ...Type.caption,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  shareRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  shareLabel: {
    ...Type.label,
    textAlign: 'center',
  },
});
