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
    this.body.setSize(GAME.player.width * 0.5, GAME.player.height * 0.8);
    this.body.setOffset(0, 0);
    this.body.setCollideWorldBounds(true);
    this.body.setGravityY(GAME.gravity);
    this.body.setAllowGravity(true);

    this.scene = scene;
    this.isGrounded = false;
    this.isDead = false;
    this.speed = GAME.player.runSpeedMin;
  }

  update(time, dt) {
    if (this.isDead) return;

    this.speed = Math.min(
      GAME.player.runSpeedMax,
      GAME.player.runSpeedMin + (this.x * GAME.player.speedScale)
    );

    this.body.setVelocityX(this.speed);
    this.setFlipX(this.body.velocity.x < 0);

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