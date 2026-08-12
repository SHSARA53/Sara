import type { Lang, LocalizedText } from "../../models/types";

export type SoundEffectKey =
  | "tap"
  | "success"
  | "softSuccess"
  | "celebration"
  | "hint"
  | "errorGentle"
  | "coin"
  | "sticker"
  | "completion";

interface AudioConfig {
  soundEnabled: boolean;
  voiceEnabled: boolean;
  volume: number; // 0-1
  /** Calm Mode: softer effect volume and a slower, gentler speaking rate for tired/wind-down moments. */
  calm: boolean;
}

let config: AudioConfig = { soundEnabled: true, voiceEnabled: true, volume: 0.8, calm: false };

export function setAudioConfig(next: Partial<AudioConfig>): void {
  config = { ...config, ...next };
}

// ---------------------------------------------------------------------------
// Voice layer (text-to-speech). This is an abstraction on purpose: today it
// speaks via the browser's SpeechSynthesis API, but `speak()` is the single
// choke point where professionally recorded voice clips could be swapped in
// later (e.g. by checking an audioClipMap[key] before falling back to TTS).
// ---------------------------------------------------------------------------

let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  const refreshVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

function voiceForLang(lang: Lang): SpeechSynthesisVoice | undefined {
  const code = lang === "he" ? "he" : "en";
  return cachedVoices.find((voice) => voice.lang.toLowerCase().startsWith(code));
}

export function speak(text: string | LocalizedText, lang: Lang): void {
  if (!config.voiceEnabled) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const message = typeof text === "string" ? text : text[lang];
  if (!message) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = lang === "he" ? "he-IL" : "en-US";
  utterance.rate = config.calm ? 0.82 : 0.92;
  utterance.pitch = config.calm ? 1.05 : 1.15;
  utterance.volume = config.calm ? config.volume * 0.75 : config.volume;
  const voice = voiceForLang(lang);
  if (voice) utterance.voice = voice;

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

// ---------------------------------------------------------------------------
// Sound-effect layer. Short pleasant tones synthesized with WebAudio so the
// app needs zero external audio assets and stays fully offline-capable.
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

/** Call once on the first user gesture to unlock audio on iOS/Safari. */
export function primeAudio(): void {
  getAudioContext();
}

function tone(ctx: AudioContext, startTime: number, freq: number, duration: number, gainPeak: number, type: OscillatorType = "sine") {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

const EFFECT_NOTES: Record<SoundEffectKey, { freq: number; dur: number; type?: OscillatorType }[]> = {
  tap: [{ freq: 520, dur: 0.08 }],
  success: [
    { freq: 523.25, dur: 0.12 },
    { freq: 659.25, dur: 0.12 },
    { freq: 783.99, dur: 0.22 },
  ],
  softSuccess: [
    { freq: 587.33, dur: 0.14 },
    { freq: 698.46, dur: 0.2 },
  ],
  celebration: [
    { freq: 523.25, dur: 0.1 },
    { freq: 659.25, dur: 0.1 },
    { freq: 783.99, dur: 0.1 },
    { freq: 1046.5, dur: 0.28 },
  ],
  hint: [{ freq: 440, dur: 0.16 }],
  errorGentle: [
    { freq: 392, dur: 0.16 },
    { freq: 349.23, dur: 0.2 },
  ],
  coin: [
    { freq: 987.77, dur: 0.08 },
    { freq: 1318.51, dur: 0.16 },
  ],
  sticker: [
    { freq: 660, dur: 0.09 },
    { freq: 880, dur: 0.09 },
    { freq: 1100, dur: 0.2 },
  ],
  completion: [
    { freq: 523.25, dur: 0.14 },
    { freq: 659.25, dur: 0.14 },
    { freq: 783.99, dur: 0.14 },
    { freq: 1046.5, dur: 0.14 },
    { freq: 1318.51, dur: 0.32 },
  ],
};

export function playEffect(key: SoundEffectKey): void {
  if (!config.soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = EFFECT_NOTES[key];
  const peakGain = (config.calm ? 0.11 : 0.18) * config.volume;
  let t = ctx.currentTime;
  for (const note of notes) {
    tone(ctx, t, note.freq, note.dur, peakGain, note.type);
    t += note.dur * 0.85;
  }
}
