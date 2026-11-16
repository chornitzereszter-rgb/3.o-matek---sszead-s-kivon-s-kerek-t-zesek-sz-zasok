class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    startTimeOffset: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.12,
    endFreq?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + startTimeOffset;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.playTone(540, 0, 0.055, 'triangle', 0.08);
  }

  public playCrateDrop() {
    this.playTone(220, 0, 0.07, 'triangle', 0.12);
    this.playTone(330, 0.03, 0.06, 'sine', 0.06);
  }

  public playLaserShot() {
    this.playTone(880, 0, 0.13, 'sawtooth', 0.07, 240);
    this.playTone(1180, 0.01, 0.1, 'triangle', 0.06, 420);
  }

  public playExplosion() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Low punch
    this.playTone(140, 0, 0.24, 'sawtooth', 0.14, 42);
    // Filtered white noise burst
    const bufferSize = Math.floor(ctx.sampleRate * 0.22);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.16, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  }

  public playTurboActivate() {
    this.playTone(392, 0, 0.09, 'square', 0.06);
    this.playTone(523.25, 0.07, 0.09, 'square', 0.06);
    this.playTone(659.25, 0.14, 0.1, 'square', 0.06);
    this.playTone(783.99, 0.21, 0.22, 'triangle', 0.1);
  }

  public playBossAlert() {
    this.playTone(196, 0, 0.16, 'sawtooth', 0.09);
    this.playTone(196, 0.2, 0.16, 'sawtooth', 0.09);
    this.playTone(261.63, 0.4, 0.28, 'sawtooth', 0.1);
  }

  public playShieldHit() {
    this.playTone(220, 0, 0.16, 'sawtooth', 0.11, 95);
    this.playTone(155, 0.08, 0.2, 'triangle', 0.1, 70);
  }

  public playSuccess() {
    this.playTone(523.25, 0, 0.14, 'triangle', 0.11);
    this.playTone(659.25, 0.08, 0.16, 'triangle', 0.11);
    this.playTone(783.99, 0.16, 0.24, 'sine', 0.12);
  }

  public playComboSuccess() {
    this.playTone(523.25, 0, 0.12, 'triangle', 0.11);
    this.playTone(659.25, 0.07, 0.12, 'triangle', 0.11);
    this.playTone(783.99, 0.14, 0.14, 'triangle', 0.11);
    this.playTone(1046.5, 0.21, 0.28, 'sine', 0.13);
  }

  public playError() {
    this.playTone(240, 0, 0.14, 'triangle', 0.1);
    this.playTone(195, 0.1, 0.22, 'triangle', 0.1);
  }

  public playTrainWhistle() {
    this.playTone(440, 0, 0.18, 'triangle', 0.09);
    this.playTone(554.37, 0, 0.18, 'sine', 0.07);
    this.playTone(440, 0.24, 0.34, 'triangle', 0.1);
    this.playTone(554.37, 0.24, 0.34, 'sine', 0.08);
  }

  public playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, idx * 0.1, 0.28, 'triangle', 0.11);
    });
    this.playTone(783.99, 0.45, 0.4, 'sine', 0.08);
    this.playTone(1046.5, 0.45, 0.45, 'sine', 0.1);
  }
}

export const soundEngine = new SoundEngine();
