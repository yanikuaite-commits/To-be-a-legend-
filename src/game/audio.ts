let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType, gain = 0.05, slideTo?: number) {
  const audio = context();
  if (!audio) return;
  const osc = audio.createOscillator();
  const amp = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, audio.currentTime + duration);
  amp.gain.setValueAtTime(gain, audio.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  osc.connect(amp).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration + 0.02);
}

export function sfxWhistle() {
  tone(2200, 0.18, "sine", 0.035);
  setTimeout(() => tone(2600, 0.22, "sine", 0.03), 120);
}

export function sfxKick() {
  tone(150, 0.09, "triangle", 0.06, 70);
}

export function sfxGoal() {
  tone(392, 0.25, "square", 0.035);
  setTimeout(() => tone(523, 0.25, "square", 0.035), 130);
  setTimeout(() => tone(659, 0.4, "square", 0.04), 260);
}

export function sfxClick() {
  tone(640, 0.05, "sine", 0.025);
}

export function haptic(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  if ("vibrate" in navigator) navigator.vibrate(pattern);
}
