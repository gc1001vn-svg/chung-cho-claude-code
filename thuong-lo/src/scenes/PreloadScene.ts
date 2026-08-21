import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH, Ink, Palette } from '../theme';
import { SceneKey } from './keys';

const BAR_WIDTH = 420;
const BAR_HEIGHT = 14;

/**
 * Asset loading with a progress bar.
 *
 * Phase 0 ships no art, so the queue is empty and this scene passes through in a
 * frame. The bar is wired to the real loader events now rather than later, so
 * that when Phase 1 adds the tile atlas there is nothing to remember to build.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    this.drawProgressBar();
    // Phase 1: this.load.atlas('world', ...) — see docs/CHANGELOG.md.
  }

  create(): void {
    this.scene.start(SceneKey.Title);
  }

  private drawProgressBar(): void {
    const centreX = GAME_WIDTH / 2;
    const centreY = GAME_HEIGHT / 2;
    const left = centreX - BAR_WIDTH / 2;

    this.cameras.main.setBackgroundColor(Palette.skyTop);

    const frame = this.add.graphics();
    frame.lineStyle(2, Palette.muted, 0.6);
    frame.strokeRect(left - 2, centreY - BAR_HEIGHT / 2 - 2, BAR_WIDTH + 4, BAR_HEIGHT + 4);

    const fill = this.add.graphics();

    const label = this.add
      .text(centreX, centreY + 34, '0%', { fontFamily: '-apple-system, sans-serif', fontSize: '18px', color: Ink.muted })
      .setOrigin(0.5);

    this.load.on(Phaser.Loader.Events.PROGRESS, (value: number) => {
      fill.clear();
      fill.fillStyle(Palette.sand, 1);
      fill.fillRect(left, centreY - BAR_HEIGHT / 2, BAR_WIDTH * value, BAR_HEIGHT);
      label.setText(`${Math.round(value * 100)}%`);
    });
  }
}
