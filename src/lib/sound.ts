"use client";

// SoundManager — sons élégants générés via Web Audio API (pas de fichiers externes).
// Muet par défaut. Toggle via setMuted(true/false).

class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = true;

  setMuted(m: boolean) {
    this.muted = m;
  }

  isMuted() {
    return this.muted;
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15, delay = 0) {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(gain, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  // Cristalline ding (correct)
  correct() {
    this.tone(880, 0.15, "sine", 0.18);
    this.tone(1320, 0.12, "sine", 0.1, 0.02);
  }

  // Low buzz (wrong)
  wrong() {
    this.tone(150, 0.25, "sawtooth", 0.12);
    this.tone(120, 0.25, "sawtooth", 0.08, 0.05);
  }

  // Ding + echo (critical < 2s)
  critical() {
    this.tone(1046, 0.12, "sine", 0.2);
    this.tone(1568, 0.15, "sine", 0.12, 0.03);
    this.tone(2093, 0.1, "sine", 0.08, 0.12);
  }

  // Soft tick (timer low)
  tick() {
    this.tone(600, 0.05, "square", 0.05);
  }

  // Ascending arpeggio (combo x3+)
  combo(level: number) {
    const base = 523 + level * 40;
    this.tone(base, 0.1, "sine", 0.12);
    this.tone(base * 1.25, 0.1, "sine", 0.1, 0.06);
    this.tone(base * 1.5, 0.12, "sine", 0.1, 0.12);
  }

  // Swoosh (match start)
  swoosh() {
    this.tone(200, 0.3, "sine", 0.08);
    this.tone(400, 0.3, "sine", 0.06, 0.1);
    this.tone(600, 0.3, "sine", 0.04, 0.2);
  }

  // Muted pop (point scored)
  pop() {
    this.tone(440, 0.08, "sine", 0.1);
  }

  // Dry tac (opponent scores)
  tac() {
    this.tone(300, 0.06, "triangle", 0.06);
  }

  // Soft bell (match end)
  bell() {
    this.tone(523, 0.4, "sine", 0.15);
    this.tone(659, 0.4, "sine", 0.1, 0.05);
    this.tone(784, 0.5, "sine", 0.08, 0.1);
  }
}

export const sound = new SoundManager();
