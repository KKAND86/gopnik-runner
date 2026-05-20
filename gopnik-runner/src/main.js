/**
 * Точка входа
 * Phaser загружен глобально через <script src="lib/phaser.min.js">
 */
import { GAME } from './config.js';
import IntroScene from './scenes/IntroScene.js';
import GameScene from './scenes/GameScene.js';
import OutroScene from './scenes/OutroScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';
import { initSupabase } from './utils/supabase.js';

const Phaser = window.Phaser;
if (!Phaser) {
  document.body.innerHTML = '<div style="color:red;padding:20px;font:18px monospace">Ошибка: Phaser не загружен.</div>';
  throw new Error('Phaser not loaded');
}

// Telegram: загружаем API динамически только если нужно
if (window.location.href.includes('t.me') || window.Telegram?.WebApp) {
  const script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-web-app.js';
  script.onload = () => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready?.();
      tg.expand?.();
      tg.requestFullscreen?.();
      tg.setBackgroundColor?.('#1a1a1a');
    }
  };
  document.head.appendChild(script);
}

const config = {
  type: Phaser.AUTO,
  width: GAME.width,
  height: GAME.height,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  pixelArt: true,
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: GAME.gravity },
      debug: false
    }
  },
  scene: [IntroScene, GameScene, OutroScene, LeaderboardScene]
};

const game = new Phaser.Game(config);
window.game = game;

window.addEventListener('resize', () => game.scale.refresh());

// Supabase async init
initSupabase().then(client => {
  if (client) console.log('[Supabase] Подключен');
});
