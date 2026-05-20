/**
 * Particle Manager — пыль, искры, эффекты
 * Все частицы через Phaser.Graphics (без внешних текстур)
 */

const PARTICLES = {
  dust: { color: 0xaaaaaa, alpha: 0.4, size: 3, life: 400, gravity: -30 },
  spark: { color: 0xffd700, alpha: 0.9, size: 4, life: 600, gravity: -50 },
  death: { color: 0xe74c3c, alpha: 0.8, size: 6, life: 800, gravity: 100 },
  shield: { color: 0x00ffff, alpha: 0.6, size: 5, life: 500, gravity: -20 },
  magnet: { color: 0x9b59b6, alpha: 0.7, size: 4, life: 700, gravity: -40 }
};

export default class ParticleManager {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }

  emit(type, x, y, count = 5, spread = 20) {
    const cfg = PARTICLES[type];
    if (!cfg) return;

    for (let i = 0; i < count; i++) {
      const px = x + (Math.random() - 0.5) * spread;
      const py = y + (Math.random() - 0.5) * spread;
      const vx = (Math.random() - 0.5) * 100;
      const vy = (Math.random() - 0.5) * 100 + cfg.gravity;
      const life = cfg.life * (0.7 + Math.random() * 0.6);

      const p = this.scene.add.circle(px, py, cfg.size * (0.5 + Math.random()), cfg.color, cfg.alpha);
      p.setDepth(30);

      this.particles.push({
        sprite: p,
        vx, vy,
        life, maxLife: life,
        startAlpha: cfg.alpha
      });
    }
  }

  trail(x, y, type = 'dust', interval = 80) {
    if (!this._trailTimer || this.scene.time.now - this._trailTimer > interval) {
      this.emit(type, x, y, 2, 8);
      this._trailTimer = this.scene.time.now;
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        p.sprite.destroy();
        this.particles.splice(i, 1);
        continue;
      }

      const progress = p.life / p.maxLife;
      p.sprite.x += p.vx * dt / 1000;
      p.sprite.y += p.vy * dt / 1000;
      p.sprite.setAlpha(progress * p.startAlpha);
      p.sprite.setScale(progress);
    }
  }

  burst(type, x, y, count = 15) {
    this.emit(type, x, y, count, 40);
  }

  clear() {
    for (const p of this.particles) {
      p.sprite.destroy();
    }
    this.particles = [];
  }
}
