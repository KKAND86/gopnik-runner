/**
 * Бустеры: кефир, Nokia 3310, мама с метлой
 * Каждый даёт временный эффект
 */
import { GAME } from '../config.js';

const BOOSTER_TYPES = [
  { key: 'kefir',     effect: 'speed',   label: 'КЕФИР!' },
  { key: 'nokia3310', effect: 'shield',  label: 'NOKIA 3310' },
  { key: 'mama',      effect: 'repel',   label: 'МАМА С МЕТЛОЙ!' },
  { key: 'magnet',    effect: 'magnet',  label: 'МАГНИТ!' }
];

export function getRandomBoosterType() {
  return Phaser.Utils.Array.GetRandom(BOOSTER_TYPES);
}

export default class Booster extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, type) {
    super(scene, x, y, type.key);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.allowGravity = false;

    this.boosterType = type;
    this.setDisplaySize(36, 36);
    this.body.setSize(28, 28, true);
  }
}
