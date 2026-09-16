export class SoundEngine {
  private static instance: SoundEngine | null = null;
  private ctx: AudioContext | null = null;
  
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  private skidOsc: OscillatorNode | null = null;
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;
  
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  public init() {
    if (this.isInitialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3; // Global volume
      this.masterGain.connect(this.ctx.destination);

      // Engine Synth
      this.engineOsc = this.ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      
      // Engine Filter to muffle it a bit
      const engineFilter = this.ctx.createBiquadFilter();
      engineFilter.type = 'lowpass';
      engineFilter.frequency.value = 800;

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.value = 0; // Starts silent

      this.engineOsc.connect(engineFilter);
      engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      
      this.engineOsc.start();

      // Skid Noise (White noise approximation using high frequency oscillator with modulation)
      this.skidOsc = this.ctx.createOscillator();
      this.skidOsc.type = 'square';
      this.skidOsc.frequency.value = 100;
      
      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.value = 2000;
      this.skidFilter.Q.value = 1;

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.value = 0;

      this.skidOsc.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.masterGain);

      this.skidOsc.start();

      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  private lastSpeedRatio = -1;
  private lastIsNitro = false;
  private lastSkidIntensity = -1;

  public setEngine(speedRatio: number, isNitro: boolean) {
    if (!this.ctx || !this.isInitialized || !this.engineOsc || !this.engineGain || this.ctx.state === 'closed') return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      const clampedRatio = Number.isFinite(speedRatio) ? Math.max(0, Math.min(2, speedRatio)) : 0;
      if (Math.abs(clampedRatio - this.lastSpeedRatio) < 0.03 && isNitro === this.lastIsNitro) {
        return;
      }
      this.lastSpeedRatio = clampedRatio;
      this.lastIsNitro = isNitro;

      const targetFreq = 60 + (clampedRatio * 140);
      const targetVol = Math.max(0, Math.min(1, 0.2 + (clampedRatio * 0.3) + (isNitro ? 0.2 : 0)));

      const time = this.ctx.currentTime;
      this.engineGain.gain.setTargetAtTime(targetVol, time, 0.1);

      if (isNitro) {
        this.engineOsc.frequency.setTargetAtTime(targetFreq * 1.5, time, 0.05);
      } else {
        this.engineOsc.frequency.setTargetAtTime(targetFreq, time, 0.1);
      }
    } catch {
      /* prevent audio error from crashing frame */
    }
  }

  public setSkid(intensity: number) {
    if (!this.ctx || !this.isInitialized || !this.skidGain || !this.skidOsc || !this.skidFilter || this.ctx.state === 'closed') return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    try {
      const clampedIntensity = Number.isFinite(intensity) ? Math.max(0, Math.min(1, intensity)) : 0;
      if (Math.abs(clampedIntensity - this.lastSkidIntensity) < 0.05 && (clampedIntensity > 0 || this.lastSkidIntensity === 0)) {
        return;
      }
      this.lastSkidIntensity = clampedIntensity;

      const targetVol = Math.min(0.5, clampedIntensity * 0.5);
      const time = this.ctx.currentTime;
      this.skidGain.gain.setTargetAtTime(targetVol, time, 0.05);
      
      if (targetVol > 0.01) {
        this.skidOsc.frequency.setValueAtTime(120, time);
        this.skidFilter.frequency.setValueAtTime(2000, time);
      }
    } catch {
      /* prevent audio error from crashing frame */
    }
  }

  public mute(isMuted: boolean) {
    if (this.masterGain && this.ctx && this.ctx.state !== 'closed') {
      try {
        this.masterGain.gain.setTargetAtTime(isMuted ? 0 : 0.3, this.ctx.currentTime, 0.1);
      } catch {
        /* ignore */
      }
    }
  }

  public playCountdownBeep(isGo: boolean = false) {
    if (!this.ctx || this.ctx.state === 'closed') {
      try {
        this.init();
      } catch {
        return;
      }
    }
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isGo ? 'triangle' : 'sine';
      osc.frequency.value = isGo ? 880 : 440;
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + (isGo ? 0.6 : 0.2));
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + (isGo ? 0.6 : 0.2));
    } catch {
      /* ignore */
    }
  }
}

export const soundEngine = SoundEngine.getInstance();
