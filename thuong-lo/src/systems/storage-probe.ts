/**
 * Persistent-storage probe (CLAUDE.md §4).
 *
 * iOS evicts web storage for sites left unused for long stretches, and the whole
 * save design rests on knowing whether this browser grants persistence. Phase 6
 * builds the real save system on top; Phase 0 only reports the answer on screen
 * so it can be read on the actual phone rather than guessed at.
 *
 * Browser notes: Safari exposes `navigator.storage` but grants persistence
 * mainly to home-screen installs, so the result differs between a Safari tab and
 * the installed PWA. Both are worth checking.
 */

export interface StorageStatus {
  /** False when the browser has no StorageManager at all. */
  readonly supported: boolean;
  /** True only when the browser confirms data will not be evicted silently. */
  readonly persisted: boolean;
  readonly usageMB: number | null;
  readonly quotaMB: number | null;
}

const BYTES_PER_MB = 1024 * 1024;

function toMB(bytes: number | undefined): number | null {
  return typeof bytes === 'number' ? Math.round((bytes / BYTES_PER_MB) * 10) / 10 : null;
}

export async function probePersistentStorage(): Promise<StorageStatus> {
  const storage: StorageManager | undefined = navigator.storage;

  if (!storage || typeof storage.persist !== 'function') {
    return { supported: false, persisted: false, usageMB: null, quotaMB: null };
  }

  let persisted = false;
  try {
    // Ask first: re-requesting an already-granted permission is harmless but
    // pointless, and on some browsers `persist()` shows a prompt.
    persisted = (await storage.persisted()) || (await storage.persist());
  } catch {
    persisted = false;
  }

  let usageMB: number | null = null;
  let quotaMB: number | null = null;
  try {
    const estimate = await storage.estimate();
    usageMB = toMB(estimate.usage);
    quotaMB = toMB(estimate.quota);
  } catch {
    /* estimate() is optional; the persisted flag is the part that matters */
  }

  return { supported: true, persisted, usageMB, quotaMB };
}
