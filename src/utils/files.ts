import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

/**
 * Importable file write/share/delete helpers for export (Phase 6) and
 * backup (Phase 7) — file I/O stays OUT of screens (D-discretion).
 *
 * Uses only SDK-57 legacy `expo-file-system` APIs confirmed in the
 * installed type declarations. Downloads-first (D-13): Android resolves the
 * public Downloads folder via the Storage Access Framework; other
 * platforms write under `documentDirectory`. When the destination is
 * unavailable the helpers THROW (fail loudly, D-16) — there is intentionally
 * no silent fallback to a location the success card does not promise.
 * Partial files are deleted before rethrowing, never surfaced.
 *
 * Web PDF path (06-05): browsers print HTML via a new window +
 * `window.print` (user picks Save as PDF); native still uses `expo-print`.
 */

/** Strip any directory components the caller passed in (T-06-02). */
function basenameOf(filename: string): string {
  return filename.split('/').pop() ?? filename;
}

/** `createFileAsync` takes the name WITHOUT extension. */
function nameWithoutExtension(base: string): string {
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(0, dot) : base;
}

/**
 * Resolve a writable Downloads destination uri for `base`, creating the
 * real file. Throws `downloads-unavailable` when the destination cannot be
 * provided. The returned uri's file carries the slug filename, so screens
 * display only a real file name.
 */
async function createDownloadsFile(base: string, mimeType: string): Promise<string> {
  if (Platform.OS === 'android') {
    const dirUri = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
    const permission =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(dirUri);
    if (!permission.granted) {
      throw new Error('downloads-unavailable');
    }
    return FileSystem.StorageAccessFramework.createFileAsync(
      permission.directoryUri,
      nameWithoutExtension(base),
      mimeType,
    );
  }
  const docDir = FileSystem.documentDirectory;
  if (docDir === null) {
    throw new Error('downloads-unavailable');
  }
  return `${docDir}${base}`;
}

/**
 * Save UTF-8 text (CSV) under the slug `filename`, Downloads-first
 * (D-13). Returns the real file uri. Throws (after deleting partials)
 * when Downloads is unavailable — never writes somewhere the "Saved to
 * Downloads" success card does not describe.
 */
export async function writeTextFile(filename: string, contents: string): Promise<string> {
  const base = basenameOf(filename);
  let fileUri: string | null = null;
  try {
    fileUri = await createDownloadsFile(base, 'text/csv');
    if (Platform.OS === 'android') {
      await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, contents);
    } else {
      await FileSystem.writeAsStringAsync(fileUri, contents);
    }
    return fileUri;
  } catch (err) {
    if (fileUri !== null) {
      await deleteFile(fileUri);
    }
    throw err;
  }
}

/**
 * Render HTML to a PDF file via `expo-print` (native-only path). Returns
 * the artifact uri — callers persist it under the slug name with
 * `copyBinaryFile`. On web throws a catchable `pdf-unsupported` error the
 * screen converts to the "Couldn't export — try again" failure surface.
 */
export async function printHtmlToPdf(html: string): Promise<string> {
  if (Platform.OS === 'web') {
    throw new Error('pdf-unsupported');
  }
  const { uri } = await Print.printToFileAsync({ html });
  return uri;
}

/**
 * Web-only print path: open the builder HTML in a new tab and invoke the
 * browser print dialog (user picks Save as PDF). Synchronous so the
 * `window.open` call stays in the tap handler's call stack (async gaps
 * trigger popup blockers). Returns `'blocked'` when there is no window or
 * the popup was blocked — callers surface an actionable message. Only
 * `buildWorkerPdfHtml`/`buildRegisterPdfHtml` output (escaped inside the
 * builders) ever reaches `document.write`; never concatenate names/notes
 * at the call site (T-06-05-01).
 */
export function openWebPrintHtml(html: string): 'opened' | 'blocked' {
  if (typeof window === 'undefined') {
    return 'blocked';
  }
  const w = window.open('', '_blank');
  if (w === null) {
    return 'blocked';
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  return 'opened';
}

/**
 * Open the system share sheet for `uri` (EX-03 second-device transfer).
 * Returns `'unavailable'` where sharing is unsupported (D-15 web
 * best-effort gate) instead of throwing. Share-sheet dismiss changes
 * nothing — no state is touched here.
 */
export async function shareFile(uri: string): Promise<'shared' | 'unavailable'> {
  if (!(await Sharing.isAvailableAsync())) {
    return 'unavailable';
  }
  await Sharing.shareAsync(uri);
  return 'shared';
}

/**
 * Best-effort delete, catch-all-inside, never throws (D-16: partials
 * deleted, never surfaced).
 */
export async function deleteFile(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Intentionally silent: cleanup must never fail the export flow.
  }
}

/**
 * Binary-safe save of the `expo-print` artifact under the slug `filename`.
 * NEVER reads/writes the bytes as UTF-8 text (that round-trip would
 * corrupt PDF bytes) — moves them with `copyAsync` (`moveAsync` fallback
 * only if copy is unsupported). Returns the real destination uri; throws
 * (after deleting partials) when Downloads is unavailable.
 */
export async function copyBinaryFile(fromUri: string, filename: string): Promise<string> {
  const base = basenameOf(filename);
  let destUri: string | null = null;
  try {
    destUri = await createDownloadsFile(base, 'application/pdf');
    try {
      await FileSystem.copyAsync({ from: fromUri, to: destUri });
    } catch {
      await FileSystem.moveAsync({ from: fromUri, to: destUri });
    }
    return destUri;
  } catch (err) {
    if (destUri !== null) {
      await deleteFile(destUri);
    }
    throw err;
  }
}
