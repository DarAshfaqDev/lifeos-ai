"use client";

export type SoundscapeId =
  | "none"
  | "rain"
  | "ocean"
  | "forest"
  | "brown"
  | "pink"
  | "ambient"
  | "binaural";

export interface SoundscapeOption {
  id: SoundscapeId;
  label: string;
  category: string;
  description: string;
  honestNote?: string;
}

export const SOUNDSCAPES: SoundscapeOption[] = [
  {
    id: "none",
    label: "Silence",
    category: "None",
    description: "No sound. Just the quiet.",
  },
  {
    id: "rain",
    label: "Rain",
    category: "Nature",
    description: "Soft steady rain. Some people find it calming and good for concentration.",
  },
  {
    id: "ocean",
    label: "Ocean",
    category: "Nature",
    description: "Slow rolling waves. A steady, gentle rhythm.",
  },
  {
    id: "forest",
    label: "Forest",
    category: "Nature",
    description: "Distant breeze through leaves. Calm and open.",
  },
  {
    id: "brown",
    label: "Brown noise",
    category: "Noise",
    description: "Low, deep, steady sound. Often described as a soft rumble.",
  },
  {
    id: "pink",
    label: "Pink noise",
    category: "Noise",
    description: "Smooth, even noise. Many people find it easier to ignore than silence.",
  },
  {
    id: "ambient",
    label: "Calm ambient",
    category: "Ambient",
    description: "Soft, slowly shifting tones. Gentle and unobtrusive.",
  },
  {
    id: "binaural",
    label: "Binaural / beat-based",
    category: "Binaural",
    description: "Slightly different tones in each ear. Some people find them relaxing or useful for focus. Use headphones for the intended effect.",
    honestNote:
      "Effects vary between people. Treat this as an optional sound experience, not a treatment.",
  },
];

const VOLUME_KEY = "lifeos_sound_volume";
const SOUND_KEY = "lifeos_sound_choice";
const FADE_KEY = "lifeos_sound_fade";

function storedNumber(key: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const v = parseFloat(localStorage.getItem(key) || "");
  return Number.isFinite(v) ? v : fallback;
}

export function loadSoundPrefs() {
  const saved = (typeof window !== "undefined" && localStorage.getItem(SOUND_KEY)) as
    | SoundscapeId
    | null;
  return {
    sound: saved && SOUNDSCAPES.some((s) => s.id === saved) ? saved : "none",
    volume: storedNumber(VOLUME_KEY, 24),
    fade: localStorage.getItem(FADE_KEY) !== "off",
  };
}

export function saveSoundPrefs(sound: SoundscapeId, volume: number, fade: boolean) {
  localStorage.setItem(SOUND_KEY, sound);
  localStorage.setItem(VOLUME_KEY, String(volume));
  localStorage.setItem(FADE_KEY, fade ? "on" : "off");
}

/**
 * Web Audio soundscape engine.
 *
 * All sounds are generated in the browser (no audio files, nothing to
 * download or license). They are intentionally plain, steady textures —
 * support for concentration, not entertainment.
 *
 * We do not claim these alter brainwaves or treat anything. They are simply
 * sounds some people find calming.
 */
class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private nodes: AudioScheduledSourceNode[] = [];
  private gainNodes: GainNode[] = [];
  private filters: BiquadFilterNode[] = [];
  private lfoNodes: OscillatorNode[] = [];
  private current: SoundscapeId = "none";
  private volume = 24;
  private fade = true;
  private fading = false;

  isRunning(): boolean {
    return this.current !== "none" && !this.fading;
  }

  get activeSound(): SoundscapeId {
    return this.current;
  }

  ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private noiseBuffer(color: "white" | "pink" | "brown"): AudioBuffer {
    const ctx = this.ctx!;
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (color === "white") {
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    } else if (color === "pink") {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11;
        b6 = white * 0.115926;
      }
    } else {
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    return buffer;
  }

  private loop(buffer: AudioBuffer, volume = 1, filterFreq?: number, filterQ?: number, filterType: BiquadFilterType = "lowpass") {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    if (filterFreq) {
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFreq;
      if (filterQ) filter.Q.value = filterQ;
      src.connect(filter);
      filter.connect(gain);
      this.filters.push(filter);
    } else {
      src.connect(gain);
    }
    gain.connect(this.master!);
    src.start();
    this.nodes.push(src);
    this.gainNodes.push(gain);
  }

  private slowLfo(gain: GainNode, min: number, max: number, rate: number) {
    const ctx = this.ctx!;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = rate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = (max - min) / 2;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    gain.gain.value = (max + min) / 2;
    lfo.start();
    this.lfoNodes.push(lfo);
  }

  private buildRain() {
    const ctx = this.ctx!;
    const buffer = this.noiseBuffer("pink");
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const high = ctx.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 400;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    src.connect(high);
    high.connect(gain);
    gain.connect(this.master!);
    src.start();
    this.nodes.push(src);
    this.gainNodes.push(gain);
    this.filters.push(high);
  }

  private buildOcean() {
    const buffer = this.noiseBuffer("brown");
    this.loop(buffer, 0.55, 500, 0.6);
  }

  private buildForest() {
    const buffer = this.noiseBuffer("pink");
    const src = this.ctx!.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const band = this.ctx!.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1200;
    band.Q.value = 0.4;
    const gain = this.ctx!.createGain();
    gain.gain.value = 0.3;
    src.connect(band);
    band.connect(gain);
    gain.connect(this.master!);
    this.slowLfo(gain, 0.18, 0.42, 0.05);
    src.start();
    this.nodes.push(src);
    this.gainNodes.push(gain);
    this.filters.push(band);
  }

  private buildBrown() {
    this.loop(this.noiseBuffer("brown"), 0.5, 250, 0.5);
  }

  private buildPink() {
    this.loop(this.noiseBuffer("pink"), 0.42, 2000, 0.3);
  }

  private buildAmbient() {
    const ctx = this.ctx!;
    const freqs = [110, 165, 220, 275];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.value = 0.07 + i * 0.012;
      osc.connect(gain);
      gain.connect(this.master!);
      this.slowLfo(gain, 0.04, 0.09, 0.03 + i * 0.008);
      osc.start();
      this.nodes.push(osc);
      this.gainNodes.push(gain);
    });
  }

  private buildBinaural() {
    const ctx = this.ctx!;
    const base = 220;
    [base, base + 10].forEach((f) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const gain = ctx.createGain();
      gain.gain.value = 0.045;
      osc.connect(gain);
      gain.connect(this.master!);
      osc.start();
      this.nodes.push(osc);
      this.gainNodes.push(gain);
    });
  }

  start(sound: SoundscapeId, volume: number, fade: boolean) {
    this.stop();
    if (sound === "none") return;
    this.current = sound;
    this.volume = volume;
    this.fade = fade;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    switch (sound) {
      case "rain":
        this.buildRain();
        break;
      case "ocean":
        this.buildOcean();
        break;
      case "forest":
        this.buildForest();
        break;
      case "brown":
        this.buildBrown();
        break;
      case "pink":
        this.buildPink();
        break;
      case "ambient":
        this.buildAmbient();
        break;
      case "binaural":
        this.buildBinaural();
        break;
    }
    this.setVolume(volume, fade ? 1.2 : 0);
  }

  setVolume(volume: number, rampSeconds = 0.15) {
    this.volume = volume;
    if (!this.master || !this.ctx) return;
    const target = Math.min(1, Math.max(0, volume / 100)) * 0.9;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + rampSeconds);
  }

  stop() {
    if (this.fading) return;
    const ctx = this.ctx;
    if (!ctx || !this.master) {
      this.current = "none";
      return;
    }
    this.fading = true;
    const now = ctx.currentTime;
    const ramp = this.fade ? 0.8 : 0.05;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + ramp);
    setTimeout(() => {
      this.nodes.forEach((n) => {
        try {
          n.stop();
        } catch {}
      });
      this.nodes = [];
      this.gainNodes = [];
      this.filters = [];
      this.lfoNodes.forEach((l) => {
        try {
          l.stop();
        } catch {}
      });
      this.lfoNodes = [];
      this.fading = false;
      this.current = "none";
    }, (ramp + 0.1) * 1000);
  }
}

export const soundscape = new SoundscapeEngine();
