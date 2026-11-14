// Tiny synth: every sound and the music are generated live, no audio files.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
export const audio = { sound: true, music: true };

export function unlockAudio() {
  if (!ctx) {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    ctx = new AC() as AudioContext;
    master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = audio.music ? 0.12 : 0; musicGain.connect(master);
    startMusic();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, dest?: AudioNode) {
  if (!ctx || !master) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(dest || master);
  o.start(start); o.stop(start + dur + 0.05);
}

export function sfx(name: 'blip' | 'pick' | 'ding' | 'big' | 'oops' | 'talk' | 'woof' | 'open' | 'step' | 'cook') {
  if (!ctx || !audio.sound) return;
  const t = ctx.currentTime;
  switch (name) {
    case 'blip': tone(660, t, 0.08, 'square', 0.05); break;
    case 'pick': tone(523, t, 0.08, 'triangle', 0.12); tone(784, t + 0.06, 0.1, 'triangle', 0.12); break;
    case 'ding': // same ding as Gabi's packing tracker ♡
      tone(880, t, 0.22, 'sine', 0.18); tone(1320, t + 0.06, 0.3, 'triangle', 0.18); break;
    case 'big': [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.35, 'triangle', 0.15)); tone(1568, t + 0.4, 0.5, 'sine', 0.12); break;
    case 'oops': tone(330, t, 0.12, 'square', 0.05); tone(262, t + 0.1, 0.16, 'square', 0.05); break;
    case 'talk': tone(400 + Math.random() * 200, t, 0.04, 'square', 0.025); break;
    case 'woof': tone(220, t, 0.08, 'sawtooth', 0.08); tone(180, t + 0.07, 0.1, 'sawtooth', 0.06); break;
    case 'open': tone(392, t, 0.07, 'triangle', 0.1); tone(587, t + 0.05, 0.1, 'triangle', 0.1); break;
    case 'step': tone(120, t, 0.03, 'triangle', 0.03); break;
    case 'cook': for (let i = 0; i < 6; i++) tone(900 + Math.random() * 900, t + i * 0.04, 0.03, 'square', 0.02); break;
  }
}

export function setMusic(on: boolean) {
  audio.music = on;
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(on ? 0.12 : 0, ctx.currentTime, 0.3);
}

// A gentle looping tune: soft chords + a wandering pentatonic melody.
let musicMode: 'work' | 'home' = 'work';
export function setMusicMode(m: 'work' | 'home') { musicMode = m; }
function startMusic() {
  if (!ctx || !musicGain) return;
  const chordsWork = [[261.6, 329.6, 392], [220, 261.6, 329.6], [174.6, 220, 261.6], [196, 246.9, 293.7]];
  const chordsHome = [[174.6, 220, 261.6], [164.8, 207.7, 246.9], [146.8, 174.6, 220], [196, 246.9, 293.7]];
  const scale = [523.3, 587.3, 659.3, 784, 880, 1046.5];
  let bar = 0;
  const beat = 0.5;
  let next = ctx.currentTime + 0.2;
  const schedule = () => {
    if (!ctx || !musicGain) return;
    while (next < ctx.currentTime + 1.2) {
      const chords = musicMode === 'work' ? chordsWork : chordsHome;
      const ch = chords[bar % 4];
      ch.forEach(f => tone(f / 2, next, beat * 3.6, 'sine', 0.08, musicGain!));
      for (let i = 0; i < 8; i++) {
        if (Math.random() < (musicMode === 'work' ? 0.55 : 0.35)) {
          const f = scale[(Math.random() * scale.length) | 0] * (musicMode === 'home' ? 0.5 : 1);
          tone(f, next + i * beat / 2, beat * 0.9, 'triangle', 0.05, musicGain!);
        }
      }
      next += beat * 4; bar++;
    }
  };
  setInterval(schedule, 300);
}
