/**
 * Отдельный класс для гопников, догоняющих сзади
 * Использует texture 'gopnik' из SpriteGenerator
 */
import { GAME } from '../config.js';

export default class Gopnik extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'gopnik');

    scene.add.existing(this);
    scene.physics.add.existing(this, false); // dynamic body

    this.setDisplaySize(40, 60);
    this.body.setSize(32, 50);

    this.speed = 7; // px/tick — догоняет игрока
    this.passed = false;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
  }
}
