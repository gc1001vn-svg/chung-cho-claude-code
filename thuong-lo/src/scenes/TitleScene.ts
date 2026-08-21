import Phaser from 'phaser';

import { t } from '../systems/i18n';
import { unlockAudio } from '../systems/audio-unlock';
import { getDisplayMode } from '../systems/orientation';
import { probePersistentStorage, type StorageStatus } from '../systems/storage-probe';
import { FONT_STACK, GAME_HEIGHT, GAME_WIDTH, Ink, MIN_TOUCH_SIZE, Palette } from '../theme';
import { SceneKey } from './keys';

const BUTTON_WIDTH = 360;
const BUTTON_HEIGHT = 80;
const SKY_STRIPS = 72;

interface GradientStop {
  readonly at: number;
  readonly color: number;
}

const SKY: readonly GradientStop[] = [
  { at: 0, color: Palette.skyTop },
  { at: 0.46, color: Palette.skyMid },
  { at: 0.76, color: Palette.skyLow },
  { at: 1, color: Palette.sand },
];

function mixColor(from: number, to: number, ratio: number): number {
  const fr = (from >> 16) & 0xff;
  const fg = (from >> 8) & 0xff;
  const fb = from & 0xff;
  const tr = (to >> 16) & 0xff;
  const tg = (to >> 8) & 0xff;
  const tb = to & 0xff;

  const r = Math.round(fr + (tr - fr) * ratio);
  const g = Math.round(fg + (tg - fg) * ratio);
  const b = Math.round(fb + (tb - fb) * ratio);
  return (r << 16) | (g << 8) | b;
}

function sampleGradient(stops: readonly GradientStop[], position: number): number {
  const first = stops[0];
  const last = stops[stops.length - 1];
  if (!first || !last) return 0x000000;
  if (position <= first.at) return first.color;

  for (let i = 1; i < stops.length; i += 1) {
    const lower = stops[i - 1];
    const upper = stops[i];
    if (!lower || !upper) break;
    if (position <= upper.at) {
      const span = upper.at - lower.at;
      const ratio = span === 0 ? 0 : (position - lower.at) / span;
      return mixColor(lower.color, upper.color, ratio);
    }
  }
  return last.color;
}

/**
 * Title screen and Phase 0 diagnostics.
 *
 * The tap does real work rather than being decoration: it is the only moment
 * iOS Safari will let an AudioContext start (§3.2), so audio unlocking and the
 * persistent-storage probe (§4) both hang off it. The panel it reveals reports
 * what the phone actually granted, which is what makes the Phase 0 acceptance
 * check something to read rather than guess at.
 */
export class TitleScene extends Phaser.Scene {
  private intro!: Phaser.GameObjects.Container;
  private started = false;
  private fpsText?: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.Title);
  }

  create(): void {
    this.drawSky();
    this.drawDunes();
    this.buildIntro();
    this.buildDebugToggle();

    // Any tap starts: a 360×80 button is the affordance, but nothing is gained
    // by making a player on a cracked screen hit it precisely.
    this.input.once(Phaser.Input.Events.POINTER_UP, () => void this.start());
  }

  override update(): void {
    if (this.fpsText?.visible) {
      this.fpsText.setText(t('debug.fps', { value: Math.round(this.game.loop.actualFps) }));
    }
  }

  // ---------------------------------------------------------------- backdrop

  /**
   * Vertical gradient painted as horizontal strips rather than
   * `fillGradientStyle`, which only honours per-corner colours under the WebGL
   * renderer and flattens to a single colour on Canvas.
   */
  private drawSky(): void {
    const sky = this.add.graphics();
    const stripHeight = GAME_HEIGHT / SKY_STRIPS;

    for (let i = 0; i < SKY_STRIPS; i += 1) {
      sky.fillStyle(sampleGradient(SKY, i / (SKY_STRIPS - 1)), 1);
      // The +1 overlaps neighbours so no seam shows on fractional device pixels.
      sky.fillRect(0, stripHeight * i, GAME_WIDTH, stripHeight + 1);
    }
  }

  private drawDunes(): void {
    const dunes = this.add.graphics();

    dunes.fillStyle(0xffda92, 0.95);
    dunes.fillCircle(250, 412, 78);

    dunes.fillStyle(0x8c4a36, 0.9);
    dunes.fillEllipse(300, 498, 900, 175);

    dunes.fillStyle(0x6f3830, 0.9);
    dunes.fillEllipse(1010, 510, 820, 160);

    dunes.fillStyle(Palette.sandDeep, 1);
    dunes.fillEllipse(GAME_WIDTH / 2, 676, 1900, 320);
  }

  // ------------------------------------------------------------------- intro

  private buildIntro(): void {
    const title = this.add
      .text(GAME_WIDTH / 2, 162, t('title.name'), {
        fontFamily: FONT_STACK,
        fontSize: '92px',
        fontStyle: 'bold',
        color: Ink.parchment,
      })
      .setOrigin(0.5)
      .setShadow(0, 6, '#1a0f18', 14, false, true);

    const tagline = this.add
      .text(GAME_WIDTH / 2, 232, t('title.tagline'), {
        fontFamily: FONT_STACK,
        fontSize: '26px',
        color: Ink.sand,
      })
      .setOrigin(0.5);

    const button = this.buildStartButton(GAME_WIDTH / 2, 418);

    const hint = this.add
      .text(GAME_WIDTH / 2, 418 + BUTTON_HEIGHT / 2 + 32, t('title.tap_hint'), {
        fontFamily: FONT_STACK,
        fontSize: '20px',
        color: Ink.muted,
      })
      .setOrigin(0.5);

    this.intro = this.add.container(0, 0, [title, tagline, button, hint]);
  }

  private buildStartButton(x: number, y: number): Phaser.GameObjects.Container {
    const surface = this.add.graphics();
    surface.fillStyle(Palette.ink, 0.86);
    surface.fillRoundedRect(-BUTTON_WIDTH / 2, -BUTTON_HEIGHT / 2, BUTTON_WIDTH, BUTTON_HEIGHT, 18);
    surface.lineStyle(3, Palette.sand, 0.9);
    surface.strokeRoundedRect(-BUTTON_WIDTH / 2, -BUTTON_HEIGHT / 2, BUTTON_WIDTH, BUTTON_HEIGHT, 18);

    const label = this.add
      .text(0, 0, t('title.tap_to_start'), {
        fontFamily: FONT_STACK,
        fontSize: '32px',
        fontStyle: 'bold',
        color: Ink.sand,
      })
      .setOrigin(0.5);

    const button = this.add.container(x, y, [surface, label]);

    // A slow pulse so the screen never looks frozen while waiting for the tap.
    this.tweens.add({
      targets: button,
      scale: { from: 1, to: 1.04 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return button;
  }

  // ------------------------------------------------------------------ status

  private async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    // Order matters: audio has to be unlocked inside the gesture's own task,
    // before the first await hands control back to the browser.
    const audioReady = await unlockAudio();
    const storage = await probePersistentStorage();

    this.tweens.add({
      targets: this.intro,
      alpha: 0,
      duration: 260,
      onComplete: () => {
        this.intro.destroy();
        this.showDiagnostics(audioReady, storage);
      },
    });
  }

  private showDiagnostics(audioReady: boolean, storage: StorageStatus): void {
    const lines: Array<{ text: string; color: string }> = [
      {
        text: audioReady ? t('status.audio_on') : t('status.audio_off'),
        color: audioReady ? Ink.good : Ink.danger,
      },
      { text: this.storageLine(storage), color: this.storageColor(storage) },
      { text: this.quotaLine(storage), color: Ink.muted },
      { text: t('status.display_mode', { mode: getDisplayMode() }), color: Ink.muted },
    ];

    const panel = this.add.container(0, 0);

    panel.add(
      this.add
        .text(GAME_WIDTH / 2, 158, t('status.heading'), {
          fontFamily: FONT_STACK,
          fontSize: '52px',
          fontStyle: 'bold',
          color: Ink.parchment,
        })
        .setOrigin(0.5)
        .setShadow(0, 5, '#1a0f18', 12, false, true),
    );

    lines.forEach((line, index) => {
      panel.add(
        this.add
          .text(GAME_WIDTH / 2, 252 + index * 44, line.text, {
            fontFamily: FONT_STACK,
            fontSize: '28px',
            color: line.color,
          })
          .setOrigin(0.5),
      );
    });

    panel.add(
      this.add
        .text(GAME_WIDTH / 2, 466, t('status.next'), {
          fontFamily: FONT_STACK,
          fontSize: '24px',
          color: Ink.sand,
        })
        .setOrigin(0.5),
    );

    panel.setAlpha(0);
    this.tweens.add({ targets: panel, alpha: 1, duration: 260 });
  }

  private storageLine(storage: StorageStatus): string {
    if (!storage.supported) return t('status.storage_unsupported');
    return storage.persisted ? t('status.storage_persisted') : t('status.storage_not_persisted');
  }

  private storageColor(storage: StorageStatus): string {
    if (!storage.supported) return Ink.muted;
    return storage.persisted ? Ink.good : Ink.danger;
  }

  private quotaLine(storage: StorageStatus): string {
    if (storage.usageMB === null || storage.quotaMB === null) return t('status.quota_unknown');
    return t('status.quota', { usage: storage.usageMB, quota: storage.quotaMB });
  }

  // ------------------------------------------------------------------- debug

  /** FPS readout with an on/off switch, per CLAUDE.md §3.4. */
  private buildDebugToggle(): void {
    this.fpsText = this.add
      .text(20, 18, t('debug.fps', { value: 0 }), {
        fontFamily: FONT_STACK,
        fontSize: '22px',
        color: Ink.good,
        backgroundColor: '#00000066',
        padding: { x: 10, y: 6 },
      })
      .setVisible(false)
      .setDepth(100);

    const toggle = this.add
      .text(20, GAME_HEIGHT - 20, t('debug.toggle'), {
        fontFamily: FONT_STACK,
        fontSize: '20px',
        color: Ink.muted,
        backgroundColor: '#00000055',
        padding: { x: 14, y: 12 },
      })
      .setOrigin(0, 1)
      .setDepth(100);

    // Grow the hit area to the 48 px minimum without inflating the visible chip.
    const padX = Math.max(0, (MIN_TOUCH_SIZE - toggle.width) / 2);
    const padY = Math.max(0, (MIN_TOUCH_SIZE - toggle.height) / 2);
    toggle.setInteractive(
      new Phaser.Geom.Rectangle(-padX, -padY, toggle.width + padX * 2, toggle.height + padY * 2),
      Phaser.Geom.Rectangle.Contains,
    );

    toggle.on(Phaser.Input.Events.POINTER_UP, () => {
      const next = !this.fpsText?.visible;
      this.fpsText?.setVisible(next);
      toggle.setColor(next ? Ink.good : Ink.muted);
    });
  }
}
