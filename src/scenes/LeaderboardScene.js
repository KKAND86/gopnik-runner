/**
 * LeaderboardScene — таблица лидеров
 * Показывает топ из Supabase + личный рекорд
 * Кнопка "Играть" → GameScene
 */
import telegramManager from '../utils/TelegramManager.js';export default class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Telegram: показываем BackButton для возврата
    telegramManager.showBackButton(() => {
      telegramManager.hideBackButton();
      this.scene.start('IntroScene');
    });

    // Заголовок
    this.add.text(w / 2, 40, '🏆 ЛИДЕРБОРД', {
      font: 'bold 28px monospace', fill: '#f1c40f', stroke: '#000', strokeThickness: 4
    }).setOrigin(0.5);

    // Локальный рекорд
    const best = parseInt(localStorage.getItem('bestDistance') || '0');
    this.add.text(w / 2, 80, `Твой рекорд: ${best} м`, {
      font: '18px monospace', fill: '#2ecc71'
    }).setOrigin(0.5);

    // Заглушка: таблица топ-10
    const mockData = [
      { name: 'Гопник_99', dist: 4520 },
      { name: 'Балалайка', dist: 3890 },
      { name: 'Кефирчик', dist: 3150 },
      { name: 'Тапочки', dist: 2780 },
      { name: 'Вован', dist: 2450 },
      { name: 'Адидас', dist: 2100 },
      { name: 'МамкинСын', dist: 1850 },
      { name: 'Борщ', dist: 1520 },
      { name: 'Семки', dist: 1200 },
      { name: 'Пельмень', dist: 980 },
    ];

    // Подсветка если пользователь в топе
    const isInTop = best > mockData[mockData.length - 1].dist;

    let startY = 120;
    mockData.forEach((row, i) => {
      const y = startY + i * 36;
      const isMe = best === row.dist; // точное совпадение для демо

      // Фон строки
      if (isMe) {
        this.add.rectangle(w / 2, y, w * 0.85, 32, 0x2ecc71).setAlpha(0.2);
      } else if (i % 2 === 0) {
        this.add.rectangle(w / 2, y, w * 0.85, 32, 0x222222).setAlpha(0.3);
      }

      // Место
      const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
      this.add.text(50, y, medal, { font: '18px monospace' }).setOrigin(0, 0.5);

      // Имя
      this.add.text(90, y, row.name, {
        font: '16px monospace', fill: isMe ? '#2ecc71' : '#fff'
      }).setOrigin(0, 0.5);

      // Дистанция
      this.add.text(w - 50, y, `${row.dist} м`, {
        font: '16px monospace', fill: isMe ? '#2ecc71' : '#aaa'
      }).setOrigin(1, 0.5);
    });

    if (isInTop && !mockData.some(r => r.dist === best)) {
      // Пользователь выше всех — добавить строку
      const y = startY + mockData.length * 36 + 10;
      this.add.rectangle(w / 2, y, w * 0.85, 32, 0x2ecc71).setAlpha(0.2);
      this.add.text(50, y, '👤', { font: '18px monospace' }).setOrigin(0, 0.5);
      this.add.text(90, y, 'ТЫ', { font: 'bold 16px monospace', fill: '#2ecc71' }).setOrigin(0, 0.5);
      this.add.text(w - 50, y, `${best} м`, { font: '16px monospace', fill: '#2ecc71' }).setOrigin(1, 0.5);
    }

    // Кнопка "ИГРАТЬ"
    const btnBg = this.add.rectangle(w / 2, h - 50, 160, 44, 0xe74c3c).setInteractive();
    btnBg.setStrokeStyle(2, 0xc0392b);
    this.add.text(w / 2, h - 50, '▶️ ИГРАТЬ', {
      font: 'bold 20px monospace', fill: '#fff'
    }).setOrigin(0.5);

    const startGame = () => {
      telegramManager.haptic('medium');
      telegramManager.hideBackButton();
      this.scene.start('GameScene');
    };

    btnBg.on('pointerdown', startGame);
    telegramManager.showMainButton('▶️ ИГРАТЬ', startGame, '#e74c3c');

    // Также кнопка "Меню" → IntroScene
    const menuBtn = this.add.text(20, h - 20, '← Меню', {
      font: '14px monospace', fill: '#888'
    }).setOrigin(0, 1).setInteractive();
    menuBtn.on('pointerdown', () => {
      telegramManager.hideBackButton();
      this.scene.start('IntroScene');
    });
  }
}
