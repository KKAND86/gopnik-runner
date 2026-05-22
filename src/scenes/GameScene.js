/**
 * Гопник-раннер: Core Loop v6
 * Позиция игрока исправлена. Индикатор прыжка. Уровни меняют цвет локации.
 */
import { GAME, COLORS } from '../config.js';
import { generateAllSprites, createAnimations } from '../utils/SpriteGenerator.js';
import soundManager from '../audio/SoundManager.js';
import telegramManager from '../utils/TelegramManager.js';
import ParticleManager from '../utils/ParticleManager.js';
import AchievementManager from '../utils/AchievementManager.js';
import Player from '../entities/Player.js';
import Obstacle from '../entities/Obstacle.js';
import Gopnik from '../entities/Gopnik.js';
import Booster, { getRandomBoosterType } from '../entities/Booster.js';

const OBSTACLES = [
  { key: 'puddle', w: 50, h: 12, color: 0x3498db },      // Лужа — любой прыжок
  { key: 'box', w: 40, h: 25, color: 0xe67e22 },          // Ящик — короткий прыжок
  { key: 'barrel', w: 30, h: 35, color: 0x95a5a6 },      // Бочка — короткий прыжок
  { key: 'crate', w: 35, h: 55, color: 0x8b4513 },       // Ящик-гигант — только длинный
  { key: 'wall', w: 25, h: 70, color: 0x2c3e50 },         // Стена — только длинный
  { key: 'pit', w: 80, h: 40, color: 0x1a1a1a },           // Яма — перепрыгнуть
  { key: 'beam', w: 100, h: 20, color: 0x5d4037 }          // Балка — только duck
];

const LEVEL_PALETTES = [
  { name: 'ДЕНЬ', top: '#87ceeb', bottom: '#e0f6ff', buildings: [0x34495e, 0x2c3e50, 0x7f8c8d] },
  { name: 'ЗАКАТ', top: '#ff9966', bottom: '#ffecd2', buildings: [0x8b4513, 0xa0522d, 0xcd853f] },
  { name: 'ВЕЧЕР', top: '#2c3e50', bottom: '#4a6fa5', buildings: [0x1a1a2e, 0x16213e, 0x0f3460] },
  { name: 'НОЧЬ', top: '#1a1a2e', bottom: '#16213e', buildings: [0x0a0a1a, 0x1a1a2e, 0x2d2d44] }
];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    this.distance = 0;
    this.coins = 0;
    this.isGameOver = false;
    this.startTime = this.time.now;
    this.level = 1;
    this.currentPaletteIdx = -1;

    // Particles + Combo + Magnet + Achievements
    this.particles = new ParticleManager(this);
    this.achievements = new AchievementManager(this);
    this.runStats = {
      distance: 0, coins: 0, maxSpeed: 0, maxCombo: 0,
      usedShield: false, duckCount: 0
    };
    this.doubleJumpActive = false;
    this.slowMoActive = false;
    this.jumpCount = 0;
    this.comboCount = 0;
    this.comboTimer = null;
    this.magnetActive = false;
    this.magnetRadius = 180;

    generateAllSprites(this);
    createAnimations(this);

    // Пиксель
    const gfx = this.make.graphics({ x: 0, y: 0, add: false });
    gfx.fillStyle(0xffffff);
    gfx.fillRect(0, 0, 1, 1);
    gfx.generateTexture('pixel', 1, 1);
    gfx.destroy();

    this.createSky();

    // Земля: tileSprite
    const groundY = GAME.groundY;
    const groundH = 120;

    this.groundTile = this.add.tileSprite(GAME.width / 2, groundY + groundH / 2, GAME.width + 200, groundH, 'pixel');
    this.groundTile.setTint(0x777777);
    this.groundTile.setDepth(0);

    this.grassTile = this.add.tileSprite(GAME.width / 2, groundY + 4, GAME.width + 200, 8, 'pixel');
    this.grassTile.setTint(0x2ecc71);
    this.grassTile.setDepth(1);

    this.edgeLine = this.add.tileSprite(GAME.width / 2, groundY - 1, GAME.width + 200, 2, 'pixel');
    this.edgeLine.setTint(0x111111);
    this.edgeLine.setDepth(2);

    // Физическая земля
    const groundBody = this.add.rectangle(25000, groundY + 1, 50000, 2, 0x00ff00, 0);
    this.physics.add.existing(groundBody, true);
    groundBody.setVisible(false);

    // ИГРОК: Y подобран так, чтобы ноги были на траве (трава top=600)
    this.player = new Player(this, GAME.player.startX, groundY - 32);
    this.physics.add.collider(this.player, groundBody, () => {
      if (this.player.body.velocity.y >= 0) {
        this.player.isGrounded = true;
      }
    });

    this.gopniki = [];
    this.obstacles = [];
    this.coinsList = [];
    this.boosters = [];

    this.setupControls();
    this.createUI();

    this.cameras.main.startFollow(this.player, true, 1, 1);
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, GAME.height);
    this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, GAME.height);

    // Спавнеры
    this.scheduleNextCoin();
    this.time.delayedCall(2000, () => this.scheduleNextObstacle());
    this.time.delayedCall(5000, () => this.scheduleNextBooster());
  }

  createSky() {
    this.updateSkyGradient('#87ceeb', '#e0f6ff');
    this.sky = this.add.tileSprite(GAME.width / 2, GAME.height / 2, GAME.width, GAME.height, 'skyGradient');
    this.sky.setScrollFactor(0);
    this.sky.setDepth(-10);

    // Здания
    this.buildings = [];
    const colors = LEVEL_PALETTES[0].buildings;
    let bx = -100;
    while (bx < GAME.width + 200) {
      const w = Phaser.Math.Between(60, 140);
      const h = Phaser.Math.Between(50, 120);
      const b = this.add.rectangle(bx + w / 2, GAME.groundY - h / 2, w, h, Phaser.Utils.Array.GetRandom(colors));
      b.setAlpha(0.4);
      b.setDepth(-5);
      this.buildings.push({ sprite: b, w });
      bx += w + Phaser.Math.Between(10, 40);
    }
  }

  updateSkyGradient(top, bottom) {
    if (this.textures.exists('skyGradient')) {
      this.textures.remove('skyGradient');
    }
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = GAME.height;
    const ctx = canvas.getContext('2d');
    const grd = ctx.createLinearGradient(0, 0, 0, GAME.height);
    grd.addColorStop(0, top);
    grd.addColorStop(1, bottom);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 1, GAME.height);
    this.textures.addCanvas('skyGradient', canvas);
  }

  setupControls() {
    let isDuckTap = false;

    const startHold = (pointer) => {
      soundManager.ensureContext();
      if (this.isGameOver) { this.restart(); return; }
      if (this.player.isDead || this.player.isDucking) return;

      // Check if this is a duck tap (bottom 30% of screen)
      if (pointer && pointer.y > GAME.height * 0.7) {
        if (this.player.isGrounded && !this.player.isDucking) {
          isDuckTap = true;
          this.player.duck();
        }
        return;
      }

      // Allow jump from ground or double jump in air
      if (!this.player.isGrounded && !(this.doubleJumpActive && !this.player.hasDoubleJumped)) return;

      this.holdStartTime = this.time.now;
      this.isHolding = true;
    };

    const endHold = () => {
      if (isDuckTap) {
        isDuckTap = false;
        return;
      }
      if (!this.isHolding) return;
      this.isHolding = false;
      if (this.player.isDead) return;

      const holdDuration = this.time.now - this.holdStartTime;
      const isLongJump = holdDuration > GAME.controls.tapThreshold;
      soundManager.play('jump');

      if (this.player.isGrounded) {
        this.player.jump(isLongJump);
      } else if (this.doubleJumpActive && !this.player.hasDoubleJumped) {
        this.player.jump(isLongJump, true);
        this.particles.burst('spark', this.player.x, this.player.y, 6);
      }
    };

    this.input.on('pointerdown', startHold);
    this.input.on('pointerup', endHold);

    this.input.keyboard.on('keydown-SPACE', () => startHold());
    this.input.keyboard.on('keyup-SPACE', endHold);
    this.input.keyboard.on('keydown-UP', () => startHold());
    this.input.keyboard.on('keyup-UP', endHold);
    this.input.keyboard.on('keydown-W', () => startHold());
    this.input.keyboard.on('keyup-W', endHold);

    // Duck controls
    this.input.keyboard.on('keydown-DOWN', () => this.player.duck());
    this.input.keyboard.on('keydown-S', () => this.player.duck());
  }

  createUI() {
    const style = { font: 'bold 24px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 4 };

    this.distanceText = this.add.text(20, 20, '0 м', style).setScrollFactor(0);
    this.coinsText = this.add.text(20, 55, '0 ₽', style).setScrollFactor(0);

    // Magnet indicator
    this.magnetIcon = this.add.text(GAME.width - 60, 55, '', {
      font: '20px monospace'
    }).setOrigin(1, 0).setScrollFactor(0);

    // Double jump indicator
    this.doubleJumpIcon = this.add.text(GAME.width - 85, 55, '', {
      font: '20px monospace'
    }).setOrigin(1, 0).setScrollFactor(0);

    // Slow mo indicator
    this.slowMoIcon = this.add.text(GAME.width - 110, 55, '', {
      font: '20px monospace'
    }).setOrigin(1, 0).setScrollFactor(0);

    // Mute button
    this.muteBtn = this.add.text(GAME.width - 20, 55, '🔊', {
      font: '20px monospace'
    }).setOrigin(1, 0).setScrollFactor(0).setInteractive();
    this.muteBtn.on('pointerdown', () => {
      const muted = soundManager.toggleMute();
      this.muteBtn.setText(muted ? '🔇' : '🔊');
    });

    this.speedText = this.add.text(GAME.width - 20, 20, '0 км/ч', {
      font: 'bold 22px monospace', fill: '#f1c40f', stroke: '#000', strokeThickness: 3
    }).setOrigin(1, 0).setScrollFactor(0);

    // Combo text
    this.comboText = this.add.text(GAME.width / 2, 55, '', {
      font: 'bold 22px monospace', fill: '#ff69b4', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5, 0).setScrollFactor(0).setVisible(false);

    // Duck hint: show when beam is approaching
    let beamNearby = false;
    for (const obs of this.obstacles) {
      if (obs.obsType?.key === 'beam' && obs.x > this.player.x + 50 && obs.x < this.player.x + 250) {
        beamNearby = true;
        break;
      }
    }
    this.duckHint.setVisible(beamNearby);
    this.duckHint = this.add.text(GAME.width / 2, GAME.height - 30, '↓ ПРИГНИСЬ', {
      font: 'bold 14px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5, 1).setScrollFactor(0).setAlpha(0.6).setVisible(false);

    this.levelText = this.add.text(GAME.width / 2, 20, 'УРОВЕНЬ 1', {
      font: 'bold 26px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5, 0).setScrollFactor(0);

    this.dangerText = this.add.text(GAME.width / 2, 80, '', {
      font: 'bold 20px monospace', fill: '#e74c3c', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setVisible(false);

    this.hintText = this.add.text(GAME.width / 2, GAME.height - 50, 'ТАП = прыжок | ДЕРЖИ = длинный | СОБИРАЙ МОНЕТКИ!', {
      font: '16px monospace', fill: '#ffffff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0.7);

    // ИНДИКАТОР СИЛЫ ПРЫЖКА
    this.jumpPowerBg = this.add.rectangle(GAME.width / 2, GAME.height - 80, 200, 10, 0x333333);
    this.jumpPowerBg.setOrigin(0.5).setScrollFactor(0).setDepth(49).setVisible(false);

    this.jumpPowerBar = this.add.rectangle(GAME.width / 2 - 100, GAME.height - 80, 0, 10, 0xf1c40f);
    this.jumpPowerBar.setOrigin(0, 0.5).setScrollFactor(0).setDepth(50).setVisible(false);

    this.jumpPowerLabel = this.add.text(GAME.width / 2, GAME.height - 100, '', {
      font: 'bold 14px monospace', fill: '#f1c40f', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setVisible(false);

    // Game Over
    this.gameOverContainer = this.add.container(GAME.width / 2, GAME.height / 2).setScrollFactor(0).setDepth(100).setVisible(false);
    const bg = this.add.rectangle(0, 0, 400, 250, 0x000000, 0.8).setStrokeStyle(2, 0xffffff);
    const title = this.add.text(0, -70, 'ГОПНИКИ ДОГНАЛИ', { font: 'bold 28px monospace', fill: '#e74c3c' }).setOrigin(0.5);
    this.finalScoreText = this.add.text(0, -20, '', { font: '22px monospace', fill: '#fff' }).setOrigin(0.5);
    this.finalCoinsText = this.add.text(0, 20, '', { font: '22px monospace', fill: '#f1c40f' }).setOrigin(0.5);
    this.bestScoreText = this.add.text(0, 50, '', { font: '16px monospace', fill: '#888' }).setOrigin(0.5);
    const restartText = this.add.text(0, 90, 'ТАПНИ ДЛЯ РЕСТАРТА', { font: '18px monospace', fill: '#2ecc71' }).setOrigin(0.5);
    this.gameOverContainer.add([bg, title, this.finalScoreText, this.finalCoinsText, this.bestScoreText, restartText]);
  }

  scheduleNextObstacle() {
    if (this.isGameOver) return;
    const delay = Phaser.Math.Between(GAME.spawn.obstacleMinTime, GAME.spawn.obstacleMaxTime);
    this.time.delayedCall(delay, () => this.spawnObstacle());
  }

  spawnObstacle() {
    if (this.isGameOver) return;

    const type = Phaser.Utils.Array.GetRandom(OBSTACLES);
    const spawnX = this.player.x + GAME.width + Phaser.Math.Between(80, 250);
    let spawnY = GAME.groundY - type.h / 2;

    // Яма — на уровне земли
    if (type.key === 'pit') {
      spawnY = GAME.groundY + 10;
    }
    // Балка — в воздухе
    if (type.key === 'beam') {
      spawnY = GAME.groundY - 55;
    }

    const obs = new Obstacle(this, spawnX, spawnY, type);
    this.obstacles.push(obs);
    this.scheduleNextObstacle();
  }

  spawnGopnik() {
    if (this.isGameOver) return;

    const spawnX = this.player.x - Phaser.Math.Between(800, 1200);
    const spawnY = GAME.groundY - 30;

    const gop = new Gopnik(this, spawnX, spawnY);
    gop.gopnikSpeed = GAME.player.runSpeedMin - 30;

    this.gopniki.push(gop);
  }

  scheduleNextCoin() {
    if (this.isGameOver) return;
    const delay = Phaser.Math.Between(1000, 2500);
    this.time.delayedCall(delay, () => this.spawnCoin());
  }

  spawnCoin() {
    if (this.isGameOver || Math.random() > GAME.spawn.coinChance) {
      this.scheduleNextCoin();
      return;
    }

    const spawnX = this.player.x + GAME.width + Phaser.Math.Between(30, 150);
    const spawnY = Phaser.Math.Between(GAME.groundY - 130, GAME.groundY - 50);

    const coin = this.add.sprite(spawnX, spawnY, 'coin');
    coin.setDisplaySize(32, 32);
    this.physics.add.existing(coin);
    coin.body.setSize(24, 24);
    coin.body.allowGravity = false;
    this.coinsList.push(coin);

    this.tweens.add({
      targets: coin,
      y: spawnY - 10,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.scheduleNextCoin();
  }

  scheduleNextBooster() {
    if (this.isGameOver) return;
    const delay = Phaser.Math.Between(4000, 8000);
    this.time.delayedCall(delay, () => this.spawnBooster());
  }

  spawnBooster() {
    if (this.isGameOver || Math.random() > 0.6) {
      this.scheduleNextBooster();
      return;
    }

    const type = getRandomBoosterType();
    const spawnX = this.player.x + GAME.width + Phaser.Math.Between(50, 200);
    const spawnY = Phaser.Math.Between(GAME.groundY - 140, GAME.groundY - 60);

    const booster = new Booster(this, spawnX, spawnY, type);
    this.boosters.push(booster);

    this.tweens.add({
      targets: booster,
      y: spawnY - 8,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.scheduleNextBooster();
  }

  checkCollisions() {
    if (this.isGameOver) return;

    // Хитбокс по визуальным границам спрайта (а не физического тела)
    const playerLeft = this.player.x - this.player.displayWidth / 2 + 4;
    const playerRight = this.player.x + this.player.displayWidth / 2 - 4;
    const playerTop = this.player.y - this.player.displayHeight / 2 + 2;
    const playerBottom = this.player.y + this.player.displayHeight / 2;

    // Препятствия
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (!obs || !obs.active) { this.obstacles.splice(i, 1); continue; }

      const obsLeft = obs.x - obs.width / 2;
      const obsRight = obs.x + obs.width / 2;
      const obsTop = obs.y - obs.height / 2;
      const obsBottom = obs.y + obs.height / 2;

      // ЯМА: если на земле и над ямой — падаем
      if (obs.obsType?.key === 'pit') {
        if (this.player.isGrounded && this.player.x > obsLeft && this.player.x < obsRight) {
          this.player.die();
          this.triggerGameOver();
          return;
        }
        if (obs.x < this.player.x - GAME.width - 200) {
          obs.destroy();
          this.obstacles.splice(i, 1);
        }
        continue;
      }

      // БАЛКА: если не duck — умираем
      if (obs.obsType?.key === 'beam') {
        if (playerRight > obsLeft && playerLeft < obsRight &&
            playerBottom > obsTop && playerTop < obsBottom) {
          if (this.player.isDucking) {
            this.runStats.duckCount++;
            this.achievements.check(this.runStats);
          } else {
            this.player.die();
            this.triggerGameOver();
            return;
          }
        }
        if (obs.x < this.player.x - GAME.width - 200) {
          obs.destroy();
          this.obstacles.splice(i, 1);
        }
        continue;
      }

      if (playerRight > obsLeft && playerLeft < obsRight &&
          playerBottom > obsTop && playerTop < obsBottom) {
        // Перепрыгнул? Дно игрока должно быть чётко ниже верха препятствия
        if (playerBottom > obsTop + 5) {
          this.player.die();
          this.triggerGameOver();
          return;
        }
      }

      if (obs.x < this.player.x - GAME.width - 200) {
        obs.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // Гопники
    for (let i = this.gopniki.length - 1; i >= 0; i--) {
      const gop = this.gopniki[i];
      if (!gop || !gop.active) { this.gopniki.splice(i, 1); continue; }

      const dist = this.player.x - gop.x;
      if (dist < 40) {
        if (this.player.shieldActive) {
          // Nokia 3310 shield: отталкиваем гопника
          gop.x -= 300;
          gop.body.x = gop.x;
          continue;
        }
        this.player.die();
        this.triggerGameOver();
        return;
      }

      if (gop.x < this.player.x - GAME.width * 2) {
        gop.destroy();
        this.gopniki.splice(i, 1);
      }
    }

    // Монетки
    for (let i = this.coinsList.length - 1; i >= 0; i--) {
      const coin = this.coinsList[i];
      if (!coin || !coin.active) { this.coinsList.splice(i, 1); continue; }

      const dx = this.player.x - coin.x;
      const dy = this.player.y - coin.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 35) {
        coin.destroy();
        this.coinsList.splice(i, 1);
        
        // Combo system
        this.comboCount++;
        const multiplier = Math.min(Math.floor(this.comboCount / 3) + 1, 5);
        const bonusCoins = multiplier > 1 ? multiplier : 1;
        this.coins += bonusCoins;
        
        // Combo UI
        if (this.comboCount >= 3) {
          this.comboText.setText(`COMBO x${multiplier}! 🔥`);
          this.comboText.setVisible(true);
          this.tweens.add({
            targets: this.comboText,
            scaleX: 1.3, scaleY: 1.3,
            duration: 150, yoyo: true
          });
        }
        
        // Reset combo timer
        if (this.comboTimer) this.comboTimer.remove();
        this.comboTimer = this.time.delayedCall(2000, () => {
          this.comboCount = 0;
          this.comboText.setVisible(false);
        });
        
        soundManager.play('coin');
        this.coinsText.setText(this.coins + ' ₽');
        this.particles.burst('spark', coin.x, coin.y, 8);

        this.player.speed = Math.min(this.player.speed + GAME.player.coinBoost, GAME.player.runSpeedMax);

        this.tweens.add({
          targets: this.speedText,
          scaleX: 1.5, scaleY: 1.5,
          duration: 100, yoyo: true
        });

        telegramManager.haptic('light');
      }

      if (coin.x < this.player.x - GAME.width) {
        coin.destroy();
        this.coinsList.splice(i, 1);
      }
    }

    // Бустеры
    for (let i = this.boosters.length - 1; i >= 0; i--) {
      const b = this.boosters[i];
      if (!b || !b.active) { this.boosters.splice(i, 1); continue; }

      const dx = this.player.x - b.x;
      const dy = this.player.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 40) {
        const type = b.boosterType;
        b.destroy();
        this.boosters.splice(i, 1);

        // Эффекты бустеров
        if (type.effect === 'speed') {
          this.player.speed = Math.min(this.player.speed + 150, GAME.player.runSpeedMax + 100);
          this.showFloatingText(b.x, b.y, '⚡ КЕФИР!', '#fff');
        } else if (type.effect === 'shield') {
          this.player.shieldActive = true;
          this.runStats.usedShield = true;
          this.player.setTint(0x00ffff);
          this.time.delayedCall(3000, () => {
            if (this.player && !this.player.isDead) {
              this.player.shieldActive = false;
              this.player.clearTint();
            }
          });
          this.showFloatingText(b.x, b.y, '🛡️ NOKIA 3310', '#0ff');
        } else if (type.effect === 'repel') {
          for (const gop of this.gopniki) {
            if (gop && gop.active) {
              gop.x -= 500;
              gop.body.x = gop.x;
            }
          }
          this.showFloatingText(b.x, b.y, '👋 МАМА С МЕТЛОЙ!', '#f0f');
        } else if (type.effect === 'magnet') {
          this.magnetActive = true;
          this.time.delayedCall(5000, () => {
            this.magnetActive = false;
          });
          this.showFloatingText(b.x, b.y, '🧲 МАГНИТ!', '#9b59b6');
          this.particles.burst('magnet', b.x, b.y, 12);
        } else if (type.effect === 'doublejump') {
          this.doubleJumpActive = true;
          this.time.delayedCall(5000, () => {
            this.doubleJumpActive = false;
          });
          this.showFloatingText(b.x, b.y, '👟 ДВОЙНОЙ ПРЫЖОК!', '#e74c3c');
          this.particles.burst('spark', b.x, b.y, 12);
        } else if (type.effect === 'slowmo') {
          this.slowMoActive = true;
          this.physics.world.timeScale = 0.4;
          this.time.delayedCall(3000, () => {
            this.slowMoActive = false;
            this.physics.world.timeScale = 1;
          });
          this.showFloatingText(b.x, b.y, '⏱ ЗАМЕДЛЕНИЕ!', '#00ffff');
          this.particles.burst('shield', b.x, b.y, 12);
        }
        soundManager.play('booster');

        telegramManager.haptic('success');
      }

      if (b.x < this.player.x - GAME.width) {
        b.destroy();
        this.boosters.splice(i, 1);
      }
    }
  }

  showFloatingText(x, y, text, color) {
    const label = this.add.text(x, y, text, {
      font: 'bold 16px monospace', fill: color || '#fff', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    this.tweens.add({
      targets: label,
      y: y - 60,
      alpha: 0,
      duration: 1200,
      onComplete: () => label.destroy()
    });
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    soundManager.play('gameover');
    
    // Death effect
    this.particles.burst('death', this.player.x, this.player.y, 20);
    this.cameras.main.shake(300, 0.01);

    this.physics.pause();

    const best = parseInt(localStorage.getItem('bestDistance') || '0');
    const isNewBest = this.distance > best;
    if (isNewBest) {
      localStorage.setItem('bestDistance', Math.floor(this.distance));
    }

    // Переход на OutroScene через 1.5 сек — даём увидеть смерть
    this.time.delayedCall(1500, () => {
      this.scene.start('OutroScene', {
        distance: this.distance,
        coins: this.coins,
        isNewBest: isNewBest
      });
    });
  }

  restart() {
    this.particles.clear();
    this.magnetActive = false;
    this.doubleJumpActive = false;
    this.slowMoActive = false;
    this.physics.world.timeScale = 1;
    this.comboCount = 0;
    if (this.comboTimer) this.comboTimer.remove();
    this.scene.restart();
  }

  update(time, delta) {
    if (this.isGameOver) return;

    const dt = delta / 1000;

    // Ground collision detection
    const onGround = this.player.body.blocked.down || this.player.body.touching.down;
    if (onGround) {
      if (!this.player.isGrounded) {
        this.player.isGrounded = true;
        this.player.hasDoubleJumped = false;
      }
    } else {
      this.player.isGrounded = false;
    }

    // Particles update (uses ms)
    this.particles.update(delta);

    // Dust trail when grounded
    if (this.player.isGrounded && !this.player.isDead) {
      this.particles.trail(this.player.x - 10, this.player.y + 28, 'dust', 60);
    }

    // Magnet: pull coins
    if (this.magnetActive) {
      for (const coin of this.coinsList) {
        if (!coin || !coin.active) continue;
        const dx = this.player.x - coin.x;
        const dy = this.player.y - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.magnetRadius && dist > 30) {
          coin.x += dx * 0.08;
          coin.y += dy * 0.08;
          coin.body.x = coin.x;
          coin.body.y = coin.y;
        }
      }
    }

    // Дистанция + скорость + уровень
    this.distance = Math.max(this.distance, this.player.x - GAME.player.startX);
    this.distanceText.setText(Math.floor(this.distance) + ' м');

    const kmh = Math.floor(this.player.speed * 0.12);
    this.speedText.setText(kmh + ' км/ч');

    // Magnet indicator
    this.magnetIcon.setText(this.magnetActive ? '🧲' : '');

    // Double jump / slow mo indicators
    this.doubleJumpIcon.setText(this.doubleJumpActive ? '👟' : '');
    this.slowMoIcon.setText(this.slowMoActive ? '⏱' : '');

    // Stats for achievements
    this.runStats.distance = this.distance;
    this.runStats.coins = this.coins;
    this.runStats.maxSpeed = Math.max(this.runStats.maxSpeed, kmh);
    this.runStats.maxCombo = Math.max(this.runStats.maxCombo, this.comboCount);
    this.achievements.check(this.runStats);

    // Уровень: каждые 500м + смена палитры
    const newLevel = Math.floor(this.distance / 500) + 1;
    if (newLevel !== this.level) {
      this.level = newLevel;
      this.levelText.setText('УРОВЕНЬ ' + this.level + ' — ' + LEVEL_PALETTES[Math.min(Math.floor((this.level - 1) / 2), LEVEL_PALETTES.length - 1)].name);
      this.tweens.add({
        targets: this.levelText,
        scaleX: 1.3, scaleY: 1.3,
        duration: 200, yoyo: true
      });

      // Меняем палитру
      const paletteIdx = Math.min(Math.floor((this.level - 1) / 2), LEVEL_PALETTES.length - 1);
      if (paletteIdx !== this.currentPaletteIdx) {
        this.currentPaletteIdx = paletteIdx;
        const p = LEVEL_PALETTES[paletteIdx];
        this.updateSkyGradient(p.top, p.bottom);
        this.sky.setTexture('skyGradient');
        for (const b of this.buildings) {
          b.sprite.setFillStyle(Phaser.Utils.Array.GetRandom(p.buildings));
        }
      }
    }

    // Shield particles
    if (this.player.shieldActive && !this.player.isDead) {
      this.particles.emit('shield', this.player.x, this.player.y, 1, 30);
    }

    // Игрок: ускорение
    this.player.speed = Math.min(
      this.player.speed + (GAME.player.speedIncrement * dt),
      GAME.player.runSpeedMax
    );
    this.player.body.setVelocityX(this.player.speed);

    // ИНДИКАТОР СИЛЫ ПРЫЖКА
    if (this.isHolding && this.player.isGrounded) {
      const holdDuration = this.time.now - this.holdStartTime;
      const progress = Math.min(holdDuration / GAME.controls.tapThreshold, 1);

      this.jumpPowerBg.setVisible(true);
      this.jumpPowerBar.setVisible(true);
      this.jumpPowerLabel.setVisible(true);
      this.jumpPowerBar.width = progress * 200;

      if (progress >= 1) {
        this.jumpPowerBar.setFillStyle(0xe74c3c);
        this.jumpPowerLabel.setText('ОТПУСТИ!');
        this.jumpPowerLabel.setColor('#e74c3c');
      } else {
        this.jumpPowerBar.setFillStyle(0xf1c40f);
        this.jumpPowerLabel.setText('ЗАРЯДКА...');
        this.jumpPowerLabel.setColor('#f1c40f');
      }
    } else {
      this.jumpPowerBg.setVisible(false);
      this.jumpPowerBar.setVisible(false);
      this.jumpPowerLabel.setVisible(false);
    }

    // Гопники
    let nearestDist = Infinity;
    let nearestGopnik = null;

    for (let i = this.gopniki.length - 1; i >= 0; i--) {
      const gop = this.gopniki[i];
      if (!gop || !gop.active) { this.gopniki.splice(i, 1); continue; }

      const distToPlayer = this.player.x - gop.x;

      const targetSpeed = this.player.speed + Math.max(0, (distToPlayer - 300) * 0.1);
      gop.gopnikSpeed = Phaser.Math.Linear(gop.gopnikSpeed, targetSpeed, 0.01);
      gop.body.setVelocityX(gop.gopnikSpeed);

      if (distToPlayer < nearestDist && distToPlayer > 0) {
        nearestDist = distToPlayer;
        nearestGopnik = gop;
      }
    }

    if (nearestGopnik && nearestDist < 400) {
      this.dangerText.setText('⚠️ ГОПНИКИ СЗАДИ! ' + Math.floor(nearestDist) + 'м');
      this.dangerText.setVisible(true);
      if (!this._dangerSoundPlayed) {
        soundManager.play('danger');
        this._dangerSoundPlayed = true;
      }
    } else {
      this.dangerText.setVisible(false);
      this._dangerSoundPlayed = false;
    }

    // Коллизии
    this.checkCollisions();

    // Фон
    this.sky.tilePositionX = this.cameras.main.scrollX * 0.1;

    const camX = this.cameras.main.scrollX;
    this.groundTile.x = camX + GAME.width / 2;
    this.groundTile.tilePositionX = camX;
    this.grassTile.x = camX + GAME.width / 2;
    this.grassTile.tilePositionX = camX;
    this.edgeLine.x = camX + GAME.width / 2;
    this.edgeLine.tilePositionX = camX;

    for (const b of this.buildings) {
      if (b.sprite.x + b.w / 2 < camX - 50) {
        const rightmost = Math.max(...this.buildings.map(b2 => b2.sprite.x + b2.w / 2));
        b.sprite.x = rightmost + Phaser.Math.Between(10, 40) + b.w / 2;
      }
    }

    // Первый гопник
    if (time - this.startTime > GAME.spawn.gopnikDelay && this.gopniki.length === 0) {
      this.spawnGopnik();
    }

    // Страховка
    if (this.player.y > GAME.groundY + 150) {
      this.player.die();
      this.triggerGameOver();
    }
  }
}
