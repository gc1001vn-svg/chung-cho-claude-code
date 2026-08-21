import Phaser from 'phaser';

import { SceneKey } from './keys';

/**
 * First scene in the chain. It exists to hold anything that must be settled
 * before assets are touched — from Phase 1 that means the texture filter mode
 * and the isometric tile metrics. For now it only hands over to PreloadScene,
 * so the chain is in place and later phases have somewhere obvious to add to.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    this.scene.start(SceneKey.Preload);
  }
}
