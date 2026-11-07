/* Música ambiental generada en vivo y efectos, todo por un mismo contexto de audio. */
const CHORDS = [
  [110, 164.81, 220, 261.63],
  [87.31, 130.81, 174.61, 220],
  [130.81, 196, 246.94, 329.63],
  [98, 146.83, 196, 293.66],
];
const SPARKLES = [440, 523.25, 587.33, 659.25, 783.99, 880];

let ctx;
let master;
let ambientBus;
let analyser;
let wave;
let chordTimer;
let sparkleTimer;
let chordIndex = 0;
let ambientOn = false;
let ducked = false;

export function audioContext() {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.9;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    wave = new Uint8Array(analyser.frequencyBinCount);
    master.connect(analyser);
    analyser.connect(ctx.destination);
    ambientBus = ctx.createGain();
    ambientBus.gain.value = 0;
    ambientBus.connect(master);
  }
  ctx.resume();
  return ctx;
}
export const output = () => {
  audioContext();
  return master;
};

function playChord() {
  const now = ctx.currentTime;
  const freqs = CHORDS[chordIndex];
  chordIndex = (chordIndex + 1) % CHORDS.length;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320, now);
  filter.frequency.linearRampToValueAtTime(900, now + 4);
  filter.frequency.linearRampToValueAtTime(300, now + 9);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(0.1, now + 3);
  gain.gain.linearRampToValueAtTime(0.0001, now + 10);
  filter.connect(gain).connect(ambientBus);
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    osc.type = i < 2 ? 'triangle' : 'sawtooth';
    osc.frequency.value = f;
    osc.detune.value = i % 2 ? 5 : -5;
    osc.connect(filter);
    osc.start(now);
    osc.stop(now + 10.2);
  });
}

function playSparkle() {
  if (Math.random() < 0.35) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.frequency.value = SPARKLES[Math.floor(Math.random() * SPARKLES.length)];
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
  osc.connect(gain).connect(ambientBus);
  osc.start(now);
  osc.stop(now + 1.5);
}

const applyLevel = () => {
  if (!ctx) return;
  const target = !ambientOn ? 0 : ducked ? 0.12 : 0.6;
  ambientBus.gain.cancelScheduledValues(ctx.currentTime);
  ambientBus.gain.setTargetAtTime(target, ctx.currentTime, 0.5);
};

export function setAmbient(on) {
  ambientOn = on;
  audioContext();
  applyLevel();
  if (on && !chordTimer) {
    playChord();
    chordTimer = setInterval(playChord, 8000);
    sparkleTimer = setInterval(playSparkle, 2400);
  }
  if (!on) {
    clearInterval(chordTimer);
    clearInterval(sparkleTimer);
    chordTimer = sparkleTimer = null;
  }
}

/* Baja el ambiente mientras suena la caja de ritmos o el video. */
export function duckAmbient(on) {
  ducked = on;
  applyLevel();
}

export function audioLevel() {
  if (!analyser || ctx.state !== 'running') return 0;
  analyser.getByteTimeDomainData(wave);
  let peak = 0;
  for (const v of wave) peak = Math.max(peak, Math.abs(v - 128));
  return Math.min(peak / 70, 1);
}
export function frequencyBars(target) {
  if (analyser) analyser.getByteFrequencyData(target);
  return target;
}

function blip(freq, to, length, volume, type = 'sine') {
  if (!ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  osc.frequency.exponentialRampToValueAtTime(to, now + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
  osc.connect(gain).connect(master);
  osc.start(now);
  osc.stop(now + length + 0.02);
}

export const sfx = {
  coin() {
    blip(988, 988, 0.07, 0.09, 'square');
    setTimeout(() => blip(1319, 1319, 0.16, 0.08, 'square'), 70);
  },
  kick: () => blip(320, 110, 0.12, 0.3, 'triangle'),
  land: () => blip(120, 50, 0.2, 0.25),
  jump: () => blip(280, 760, 0.14, 0.09, 'square'),
  door: () => blip(90, 180, 0.5, 0.18, 'sawtooth'),
  roll: () => [0, 90, 180, 300].forEach((d, i) => setTimeout(() => blip(500 + i * 90, 260, 0.05, 0.1, 'square'), d)),
  win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, f, 0.32, 0.1, 'triangle'), i * 110)),
};
