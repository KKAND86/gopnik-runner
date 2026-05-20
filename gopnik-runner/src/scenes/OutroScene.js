/**
 * OutroScene — финальная заставка
 * Мама на балконе, гопники отступают, "Мама спасла!"
 * Кнопка "Ещё раз" → GameScene
 */
import { generateAllSprites, createAnimations } from '../utils/SpriteGenerator.js';

export default class OutroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'OutroScene' });
  }

  init(data) {
    this.finalDistance = data.distance || 0;
    this.finalCoins = data.coins || 0;
    this.isNewBest = data.isNewBest || false;
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    generateAllSprites(this);
    createAnimations(this);

    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Кнопка "Лидерборд"
    const lbBtn = this.add.text(20, 20, '🏆 Лидеры', {
      font: '14px monospace', fill: '#888'
    }).setInteractive();
    lbBtn.on('pointerdown', () => {
      this.scene.start('LeaderboardScene');
    });

    // Балкон (пиксель-арт)
    const balcony = this.add.sprite(w / 2, 80, 'balcony');
    balcony.setDisplaySize(w * 0.8, 60);

    // Мама с метлой (пиксель-арт)
    const mama = this.add.sprite(w / 2 - 20, 70, 'mama');
    mama.setDisplaySize(36, 54);

    // Гопники внизу — используем спрайты с анимацией
    const gopY = h - 80;
    const gopniks = [];
    for (let i = -1; i <= 1; i++) {
      const g = this.add.sprite(w / 2 + i * 50, gopY, 'gopnik_run1');
      g.setDisplaySize(30, 45);
      g.setFlipX(true); // бегут вправо
      g.play('gopnik_run');
      gopniks.push(g);
    }

    // Анимация: гопники убегают вправо
    for (const g of gopniks) {
      this.tweens.add({
        targets: g,
        x: w + 100,
        duration: 2000,
        ease: 'Power2'
      });
    }

    // Текст "Мама спасла!"
    const savedText = this.add.text(w / 2, h / 2 - 40, 'МАМА СПАСЛА!', {
      font: 'bold 28px monospace', fill: '#2ecc71', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: savedText,
      alpha: 1,
      y: h / 2 - 60,
      duration: 800,
      delay: 500,
      ease: 'Back.out'
    });

    // Результат
    const resultText = this.add.text(w / 2, h / 2 + 20,
      `Дистанция: ${Math.floor(this.finalDistance)} м\nМонет: ${this.finalCoins} ₽`,
      { font: '18px monospace', fill: '#fff', align: 'center', stroke: '#000', strokeThickness: 2 }
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: resultText,
      alpha: 1,
      duration: 600,
      delay: 1200
    });

    // Новый рекорд
    if (this.isNewBest) {
      const bestText = this.add.text(w / 2, h / 2 + 70, '🔥 НОВЫЙ РЕКОРД! 🔥', {
        font: 'bold 20px monospace', fill: '#f1c40f', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: bestText,
        alpha: 1,
        scaleX: 1.1, scaleY: 1.1,
        duration: 400,
        delay: 1500,
        yoyo: true,
        repeat: 2
      });
    }

    // Кнопка "Ещё раз"
    const btnBg = this.add.rectangle(w / 2, h - 60, 180, 44, 0x2ecc71).setInteractive();
    btnBg.setStrokeStyle(2, 0x27ae60);
    const btnText = this.add.text(w / 2, h - 60, 'ЕЩЁ РАЗ', {
      font: 'bold 18px monospace', fill: '#fff'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: [btnBg, btnText],
      scaleX: 1.05, scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    btnBg.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    this.input.once('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
