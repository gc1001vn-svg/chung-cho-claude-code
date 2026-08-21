import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { resumeAudio, suspendAudio } from './systems/audio-unlock';
import { t } from './systems/i18n';
import { isPortrait, onOrientationChange } from './systems/orientation';
import { setupPwaUpdatePrompt } from './systems/pwa-update';
import { installTouchGuards } from './systems/touch-guards';
import { GAME_HEIGHT, GAME_WIDTH, Palette } from './theme';
import './style.css';

const container = document.querySelector<HTMLElement>('#game');
if (!container) throw new Error('#game is missing from index.html');

// Strings that live in the HTML shell rather than in a Phaser scene, because
// they must render even if the game itself fails to boot.
const rotateText = document.querySelector<HTMLElement>('#rotate-text');
if (rotateText) rotateText.textContent = t('rotate.message');

const buildId = document.querySelector<HTMLElement>('#build-id');
if (buildId) buildId.textContent = __BUILD_ID__;

installTouchGuards(container);
setupPwaUpdatePrompt();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: container,
  backgroundColor: Palette.skyTop,
  scale: {
    // FIT + CENTER_BOTH covers 16:9 through 21:9 with letterboxing rather than
    // cropping, so no UI can end up off-screen on a tall phone (§3.3).
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  render: {
    antialias: true,
    roundPixels: true,
    powerPreference: 'high-performance',
  },
  // Audio starts locked on iOS; unlocking is driven explicitly from the title
  // screen's tap handler instead of Phaser's own unlock shim.
  audio: { noAudio: true },
  scene: [BootScene, PreloadScene, TitleScene],
});

/**
 * iPhone cannot be locked to landscape — no Screen Orientation API in Safari,
 * and the manifest's `orientation` is ignored. style.css covers the portrait
 * overlay; this stops the game loop behind it so an upright phone is not
 * rendering frames nobody can see.
 */
function applyOrientation(portrait: boolean): void {
  if (!game.isRunning) return;

  if (portrait) {
    game.loop.sleep();
    void suspendAudio();
  } else {
    game.loop.wake();
    void resumeAudio();
  }
}

game.events.once(Phaser.Core.Events.READY, () => applyOrientation(isPortrait()));
onOrientationChange(applyOrientation);

// Phaser parks its own render loop on visibilitychange; the AudioContext is
// ours to manage (§3.3 — do not drain battery in the background).
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    void suspendAudio();
  } else if (!isPortrait()) {
    void resumeAudio();
  }
});
