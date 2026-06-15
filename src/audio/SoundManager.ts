import { SaveManager } from "../meta/SaveManager";

export type Sfx =
  | "good"
  | "bad"
  | "tick"
  | "levelup"
  | "select"
  | "death"
  | "shield"
  | "boss";

type Tone = {
  freq: number;
  duration: number;
  type: OscillatorType;
  sweep?: number;
};

const TONES: Record<Sfx, Tone[]> = {
  good: [{ freq: 660, duration: 0.12, type: "triangle", sweep: 990 }],
  bad: [{ freq: 180, duration: 0.18, type: "sawtooth", sweep: 90 }],
  tick: [{ freq: 880, duration: 0.05, type: "square" }],
  levelup: [
    { freq: 523, duration: 0.1, type: "triangle" },
    { freq: 784, duration: 0.14, type: "triangle" },
  ],
  select: [{ freq: 720, duration: 0.08, type: "square", sweep: 880 }],
  death: [{ freq: 320, duration: 0.5, type: "sawtooth", sweep: 80 }],
  shield: [{ freq: 440, duration: 0.16, type: "sine", sweep: 660 }],
  boss: [
    { freq: 110, duration: 0.3, type: "sawtooth" },
    { freq: 146, duration: 0.3, type: "square" },
  ],
};

/**
 * Procedural SFX via the Web Audio API. Generating tones in code keeps the
 * project free of binary audio assets while still giving every action feedback.
 */
class SoundManagerImpl {
  private ctx: AudioContext | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /** Browsers gate audio until a user gesture; call this on first interaction. */
  unlock(): void {
    this.ensureContext();
  }

  play(sfx: Sfx): void {
    const volume = SaveManager.get().settings.sfx;
    if (volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    let when = ctx.currentTime;
    for (const tone of TONES[sfx]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone.type;
      osc.frequency.setValueAtTime(tone.freq, when);
      if (tone.sweep) {
        osc.frequency.linearRampToValueAtTime(tone.sweep, when + tone.duration);
      }
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(volume * 0.4, when + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + tone.duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(when);
      osc.stop(when + tone.duration + 0.02);
      when += tone.duration * 0.6;
    }
  }
}

export const SoundManager = new SoundManagerImpl();
