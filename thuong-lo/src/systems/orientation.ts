/**
 * Landscape handling (CLAUDE.md §3.1, §3.2).
 *
 * Checked before relying on it: iOS Safari implements neither the Screen
 * Orientation API nor `screen.orientation.lock()`, and an installed iPhone PWA
 * ignores the manifest's `orientation` member. There is no way to force
 * landscape on iPhone, so the only workable answer is to detect portrait and ask
 * the player to turn the phone.
 *
 * The overlay's visibility is pure CSS (`@media (orientation: portrait)` in
 * style.css) so it is correct even before this module runs. What lives here is
 * only the part CSS cannot do: telling the game to stop while upright.
 */

const PORTRAIT_QUERY = '(orientation: portrait)';

export function isPortrait(): boolean {
  return window.matchMedia(PORTRAIT_QUERY).matches;
}

/**
 * Subscribe to portrait/landscape changes. Returns an unsubscribe function.
 *
 * `MediaQueryList.addEventListener` is used rather than the legacy `addListener`
 * because Safari has supported it since iOS 14, which is below the floor this
 * project targets.
 */
export function onOrientationChange(handler: (portrait: boolean) => void): () => void {
  const query = window.matchMedia(PORTRAIT_QUERY);
  const listener = (event: MediaQueryListEvent): void => handler(event.matches);

  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

export type DisplayMode = 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';

/**
 * Which shell the game is running in. Useful on a real phone: an iPhone added to
 * the home screen reports 'standalone' even though the manifest asks for
 * 'fullscreen', which is the clearest confirmation that install worked.
 */
export function getDisplayMode(): DisplayMode {
  const modes: readonly DisplayMode[] = ['fullscreen', 'standalone', 'minimal-ui'];
  for (const mode of modes) {
    if (window.matchMedia(`(display-mode: ${mode})`).matches) return mode;
  }
  return 'browser';
}
