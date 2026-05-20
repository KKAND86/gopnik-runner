/**
 * IntroScene — начальная заставка
 * Милый, за кефиром сходи! → тап → GameScene
 */
import { generateAllSprites, createAnimations } from '../utils/SpriteGenerator.js';

export default class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // Генерируем все текстуры (IntroScene первая в списке сцен)
    generateAllSprites(this);
    createAnimations(this);

    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Фон — облака
    const sky = this.add.tileSprite(w / 2, h / 2, w, h, 'cloud');
    sky.setAlpha(0.1);
    this.tweens.add({
      targets: sky,
      tilePositionX: 200,
      duration: 20000,
      repeat: -1
    });

    // Телефон (пиксель-арт спрайт)
    const phone = this.add.sprite(w / 2, h / 2 - 60, 'phone');
    phone.setDisplaySize(48, 60);

    // Пульсация телефона
    this.tweens.add({
      targets: phone,
      scaleX: 1.1, scaleY: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Игрок стоит внизу
    const player = this.add.sprite(w / 2, h - 60, 'player_run1');
    player.setDisplaySize(32, 48);

    // Текст девушки
    this.add.text(w / 2, h / 2 + 20, 'Милый, за кефиром сходи!', {
      font: 'bold 20px monospace', fill: '#ff69b4', stroke: '#000', strokeThickness: 3
    }).setOrigin(0.5);

    // Подсказка
    const hint = this.add.text(w / 2, h - 30, 'ТАПНИ ЧТОБЫ БЕЖАТЬ', {
      font: '16px monospace', fill: '#2ecc71', stroke: '#000', strokeThickness: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Кнопка "Лидерборд"
    const lbBtn = this.add.text(w - 20, 20, '🏆', { font: '24px monospace' }).setOrigin(1, 0).setInteractive();
    lbBtn.on('pointerdown', () => this.scene.start('LeaderboardScene'));

    // Скип
    this.input.once('pointerdown', () => {
      this.scene.start('GameScene');
    });

    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
