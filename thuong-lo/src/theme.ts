/**
 * Shared visual constants. Balance numbers live in `src/data/*.json` per
 * CLAUDE.md §6; this file is presentation only — colours and type sizes the
 * scenes draw with, so a palette change is one edit rather than twenty.
 */

export const Palette = {
  skyTop: 0x2a1b3c,
  skyMid: 0x7a3a49,
  skyLow: 0xd07e3c,
  sand: 0xf3c978,
  sandDeep: 0xc1863f,
  ink: 0x2a1a12,
  parchment: 0xf6e7c6,
  muted: 0xbfa98a,
  danger: 0xd9534f,
  good: 0x6fbf73,
} as const;

/** Same colours as CSS strings, for Phaser text styles which do not take numbers. */
export const Ink = {
  parchment: '#F6E7C6',
  sand: '#F3C978',
  muted: '#BFA98A',
  ink: '#2A1A12',
  danger: '#F0857F',
  good: '#8FD694',
} as const;

/**
 * System font stack. No web font is downloaded: the first-load budget is 30 MB
 * for the whole game (§1) and every one of these renders Vietnamese diacritics
 * correctly on both iOS and Android.
 */
export const FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/** Minimum touch target in design pixels, per CLAUDE.md §3.3. */
export const MIN_TOUCH_SIZE = 48;

/**
 * Design resolution, at 2:1.
 *
 * Scale.FIT letterboxes whatever does not match, and the target range is 16:9
 * (1.78) to 21:9 (2.33) — so a 16:9 canvas would surrender 18% of an iPhone 13's
 * width to black bars. 2:1 sits near the middle of the range and keeps the worst
 * case around 11–14% at either extreme; style.css then paints the leftover strip
 * with the same dusk gradient so the seam does not read as a black bar.
 */
export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 640;
