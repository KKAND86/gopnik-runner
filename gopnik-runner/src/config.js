/**
 * Глобальные константы игры
 * Здесь настраивается баланс без лазанья в логику
 */
export const GAME = {
  width: 1280,
  height: 720,
  gravity: 1200,
  groundY: 600,        // Высота земли от верха
  
  player: {
    startX: 200,
    width: 48,
    height: 64,
    jumpVelocity: -400,       // Короткий прыжок: ~67px высоты
    longJumpVelocity: -600,   // Длинный прыжок: ~150px высоты
    runSpeedMin: 300,
    runSpeedMax: 600,
    speedIncrement: 5,
    coinBoost: 15            // монетка = +15 к скорости
  },
  
  controls: {
    tapThreshold: 150  // Короче = отзывчивее
  },
  
  spawn: {
    obstacleMinTime: 2000,   // БЫЛО 1500 — больше времени
    obstacleMaxTime: 4000,   // БЫЛО 3000
    coinChance: 0.4,
    gopnikDelay: 8000       // Первый гопник через 8 сек (было 5)
  }
};

/** Цвета placeholder'ов (удалить при замене на спрайты) */
export const COLORS = {
  player: 0x2ecc71,    // Зелёный — игрок
  gopnik: 0xe74c3c,    // Красный — гопник
  ground: 0x34495e,    // Тёмно-синий — земля
  coin: 0xf1c40f,      // Жёлтый — монетка
  skyTop: 0x87ceeb,    // Голубое небо
  skyBottom: 0xe0f6ff  // Светлее к горизонту
};
