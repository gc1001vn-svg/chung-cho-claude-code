/**
 * Browser gestures that ruin a touch game (CLAUDE.md §3.2).
 *
 * CSS covers most of this — `touch-action`, `overscroll-behavior`,
 * `-webkit-touch-callout` in style.css — but iOS Safari needs help that CSS
 * cannot give:
 *
 *  - `user-scalable=no` in the viewport meta has been ignored by iOS since
 *    iOS 10, so pinch-zoom has to be refused through Safari's non-standard
 *    `gesturestart` / `gesturechange` / `gestureend` events.
 *  - Double-tap zoom survives `touch-action: manipulation` in some iOS
 *    versions, so a fast second tap is swallowed here as well.
 *
 * These events do not exist off Safari; `addEventListener` with an unknown name
 * is simply inert elsewhere, so no capability check is needed.
 */

const DOUBLE_TAP_MS = 320;

function block(event: Event): void {
  event.preventDefault();
}

export function installTouchGuards(target: HTMLElement): () => void {
  const teardown: Array<() => void> = [];

  const listen = <E extends Event>(
    element: HTMLElement | Document,
    type: string,
    handler: (event: E) => void,
  ): void => {
    const wrapped = handler as EventListener;
    element.addEventListener(type, wrapped, { passive: false });
    teardown.push(() => element.removeEventListener(type, wrapped));
  };

  // Safari-only pinch-zoom gestures.
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    listen(document, type, block);
  }

  // Double-tap zoom: refuse the second tap of a quick pair.
  let lastTouchEnd = 0;
  listen<TouchEvent>(target, 'touchend', (event) => {
    const now = Date.now();
    if (now - lastTouchEnd <= DOUBLE_TAP_MS) event.preventDefault();
    lastTouchEnd = now;
  });

  // Long-press context menu, on top of -webkit-touch-callout for desktop browsers.
  listen(target, 'contextmenu', block);

  return () => {
    for (const undo of teardown) undo();
  };
}
