/**
 * Препятствия: лужа, ящик, бочка, палисадник, забор
 * Каждый тип — своя текстура из SpriteGenerator
 */
import { GAME } from '../config.js';

export default class Obstacle extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y, obsType) {
    const texKey = obsType?.key || 'box';
    super(scene, x, y, texKey);

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // static body

    this.obsType = obsType;
    this.passed = false;

    const w = obsType?.w || 40;
    const h = obsType?.h || 25;
    this.setDisplaySize(w, h);
    this.body.setSize(w * 0.7, h * 0.7);
    this.body.setOffset(0, 0);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
  }
}