import { GAME } from '../config.js';

/**
 * AchievementManager — система достижений
 * Сохраняет прогресс в localStorage
 */

const ACHIEVEMENTS = [
  { id: 'distance_100', name: 'Первые шаги', desc: 'Пробеги 100 метров', check: (stats) => stats.distance >= 100 },
  { id: 'distance_500', name: 'Марафонец', desc: 'Пробеги 500 метров', check: (stats) => stats.distance >= 500 },
  { id: 'distance_1000', name: 'Легенда двора', desc: 'Пробеги 1000 метров', check: (stats) => stats.distance >= 1000 },
  { id: 'coins_50', name: 'Богач', desc: 'Собери 50 монет за забег', check: (stats) => stats.coins >= 50 },
  { id: 'coins_100', name: 'Олигарх', desc: 'Собери 100 монет за забег', check: (stats) => stats.coins >= 100 },
  { id: 'speed_70', name: 'Гонщик', desc: 'Достигни скорости 70 км/ч', check: (stats) => stats.maxSpeed >= 70 },
  { id: 'speed_90', name: 'Световой барьер', desc: 'Достигни скорости 90 км/ч', check: (stats) => stats.maxSpeed >= 90 },
  { id: 'combo_5', name: 'Комбо-мастер', desc: 'Достигни комбо x5', check: (stats) => stats.maxCombo >= 5 },
  { id: 'no_hit', name: 'Неуловимый', desc: 'Пробеги 300м без щита', check: (stats) => stats.distance >= 300 && !stats.usedShield },
  { id: 'duck_master', name: 'Пригнись!', desc: 'Увернись от балки 5 раз', check: (stats) => stats.duckCount >= 5 },
];

export default class AchievementManager {
  constructor(scene) {
    this.scene = scene;
    this.unlocked = new Set();
    this.loadProgress();
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('gopnik_achievements');
      if (saved) {
        const ids = JSON.parse(saved);
        ids.forEach(id => this.unlocked.add(id));
      }
    } catch (e) {
      // ignore
    }
  }

  saveProgress() {
    localStorage.setItem('gopnik_achievements', JSON.stringify([...this.unlocked]));
  }

  check(stats) {
    for (const ach of ACHIEVEMENTS) {
      if (this.unlocked.has(ach.id)) continue;
      if (ach.check(stats)) {
        this.unlock(ach);
      }
    }
  }

  unlock(ach) {
    this.unlocked.add(ach.id);
    this.saveProgress();
    this.showUnlock(ach);
  }

  showUnlock(ach) {
    const label = this.scene.add.text(this.scene.cameras.main.scrollX + GAME.width / 2, GAME.height / 2 - 50,
      `🏆 ${ach.name}\n${ach.desc}`, {
        font: 'bold 18px monospace', fill: '#ffd700', stroke: '#000', strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: label,
      y: label.y - 40,
      alpha: 0,
      duration: 2500,
      onComplete: () => label.destroy()
    });
  }

  getAll() {
    return ACHIEVEMENTS.map(ach => ({
      ...ach,
      unlocked: this.unlocked.has(ach.id)
    }));
  }

  getUnlockedCount() {
    return this.unlocked.size;
  }

  reset() {
    this.unlocked.clear();
    localStorage.removeItem('gopnik_achievements');
  }
}
