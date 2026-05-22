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
    this.isDucking = false;
    this.hasDoubleJumped = false;
    this.speed = GAME.player.runSpeedMin;

    this.play('player_run');
  }

  update(time, dt) {
    if (this.isDead) return;

    // Наклон при прыжке/падении
    if (!this.isGrounded && !this.isDucking) {
      this.setRotation(this.body.velocity.y < 0 ? -0.1 : 0.1);
    } else {
      this.setRotation(0);
    }
  }

  duck() {
    if (this.isDead || !this.isGrounded || this.isDucking) return;
    this.isDucking = true;
    this.setDisplaySize(48, 32);
    this.body.setSize(12, 12, true);
    this.y += 16;
    this.play('player_duck');

    this.duckTimer = this.scene.time.delayedCall(800, () => {
      this.standUp();
    });
  }

  standUp() {
    if (!this.isDucking || this.isDead) return;
    // Если не на земле (упали в яму), не встаём — умираем
    if (!this.isGrounded) return;
    this.isDucking = false;
    this.y -= 16;
    this.setDisplaySize(GAME.player.width, GAME.player.height);
    this.body.setSize(12, 20, true);
    if (!this.isDead) {
      this.play('player_run');
    }
    if (this.duckTimer) {
      this.duckTimer.remove();
      this.duckTimer = null;
    }
  }

  jump(isLong = false, doubleJump = false) {
    if (this.isDead || this.isDucking) return;
    if (!this.isGrounded && !doubleJump) return;
    if (this.duckTimer) {
      this.duckTimer.remove();
      this.duckTimer = null;
    }
    const impulse = isLong ? GAME.player.longJumpVelocity : GAME.player.jumpVelocity;
    this.body.setVelocityY(impulse);
    this.isGrounded = false;
    this.hasDoubleJumped = doubleJump;
  }

  die() {
    if (this.isDead) return;
    if (this.isDucking) this.standUp();
    this.isDead = true;
    this.setTint(0x555555);
    this.body.setVelocity(0);
  }
}