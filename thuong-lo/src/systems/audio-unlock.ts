/**
 * iOS Safari refuses to start an AudioContext outside a user gesture, and a
 * context created on page load arrives permanently 'suspended'. Everything here
 * must therefore be driven from a real touch handler — see TitleScene.
 *
 * Verified on iOS Safari: `webkitAudioContext` is still the constructor on older
 * iOS builds, so both spellings are probed.
 */

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

let context: AudioContext | null = null;

function resolveConstructor(): typeof AudioContext | undefined {
  return window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
}

export function getAudioContext(): AudioContext | null {
  return context;
}

export function isAudioUnlocked(): boolean {
  return context?.state === 'running';
}

/**
 * Create and resume the shared AudioContext. Call from inside a touch handler.
 * Returns whether audio is actually running afterwards, so the caller can tell
 * the player the truth instead of assuming success.
 */
export async function unlockAudio(): Promise<boolean> {
  const Ctor = resolveConstructor();
  if (!Ctor) return false;

  try {
    context ??= new Ctor();
    if (context.state === 'suspended') await context.resume();
    return context.state === 'running';
  } catch {
    // A refused context must not take the title screen down with it.
    return false;
  }
}

/** Suspend audio when the tab is hidden so a backgrounded game stops draining battery. */
export async function suspendAudio(): Promise<void> {
  if (context?.state === 'running') {
    try {
      await context.suspend();
    } catch {
      /* nothing useful to do if the browser refuses */
    }
  }
}

/** Resume audio after the tab becomes visible again. */
export async function resumeAudio(): Promise<void> {
  if (context?.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      /* the next user gesture will try again */
    }
  }
}
