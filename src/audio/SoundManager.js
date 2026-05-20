/**
 * 8-bit Sound Manager — Web Audio API retro synth
 * Чистый JS, не зависит от Phaser
 */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.muted = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type, opts = {}) {
    if (!this.enabled || this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    switch (type) {
      case 'jump':
        this._tone(now, 300, 0.08, 'square', 0.12, 0.8);
        break;
      case 'coin':
        this._tone(now, 880, 0.05, 'sine', 0.08, 0.6);
        this._tone(now + 0.06, 1100, 0.05, 'sine', 0.08, 0.5);
        break;
      case 'danger':
        this._tone(now, 200, 0.15, 'sawtooth', 0.2, 0.5);
        break;
      case 'booster':
        this._tone(now, 523, 0.06, 'square', 0.1, 0.5);
        this._tone(now + 0.08, 659, 0.06, 'square', 0.1, 0.5);
        this._tone(now + 0.16, 784, 0.1, 'square', 0.15, 0.5);
        break;
      case 'gameover':
        this._tone(now, 400, 0.2, 'sawtooth', 0.25, 0.7);
        this._tone(now + 0.25, 350, 0.2, 'sawtooth', 0.3, 0.6);
        this._tone(now + 0.5, 300, 0.3, 'sawtooth', 0.4, 0.5);
        break;
      case 'step':
        if (Math.random() > 0.7) {
          this._tone(now, 100 + Math.random() * 40, 0.02, 'square', 0.03, 0.15);
        }
        break;
    }
  }

  _tone(time, freq, dur, wave, fade, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + fade);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + dur);
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}

export const soundManager = new SoundManager();
export default soundManager;
