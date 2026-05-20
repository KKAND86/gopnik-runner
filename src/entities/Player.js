/**
 * Игрок — пиксель-арт спрайт из SpriteGenerator
 * Управление: короткий прыжок (тап) / длинный прыжок (удержание >150мс)
 */
import { GAME } from '../config.js';

export default class Player extends Phaser.GameObjects.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setDisplaySize(GAME.player.width, GAME.player.height);
    this.body.setSize(12, 20, true);
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(GAME.gravity);
    this.body.setAllowGravity(true);

    this.scene = scene;
    this.isGrounded = true;
    this.isDead = false;
    this.speed = GAME.player.runSpeedMin;

    this.play('player_run');
  }

  update(time, dt) {
    if (this.isDead) return;

    // Наклон при прыжке/падении
    if (!this.isGrounded) {
      this.setRotation(this.body.velocity.y < 0 ? -0.1 : 0.1);
    } else {
      this.setRotation(0);
    }
  }

  jump(isLong = false) {
    if (!this.isGrounded || this.isDead) return;
    const impulse = isLong ? GAME.player.longJumpVelocity : GAME.player.jumpVelocity;
    this.body.setVelocityY(impulse);
    this.isGrounded = false;
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;
    this.setTint(0x555555);
    this.body.setVelocity(0);
  }
}